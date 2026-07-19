// The in-app notification centre. Two sources feed one list:
//
//   1. Rows the API persisted (`/notifications`) — game cancelled/updated,
//      someone joined, game confirmed/full. These carry their own read state.
//   2. A synthetic "rate your teammates" row per completed game the user hasn't
//      rated yet, derived from `/games/pending-ratings`. Nothing persists these
//      server-side: the row exists exactly as long as the rating is owed, so a
//      game rated from anywhere drops out of the list on the next refresh and
//      can never be rated twice.
//
// The list is polled while the app is foregrounded, and anything that arrives
// unread after the first load is pushed to the toast queue so it also surfaces
// live over whatever screen the user is on.
//
// Rows can be removed as well as read. Server rows are deleted through the API.
// A rating row has no server row to delete, so deleting one is recorded the only
// way that sticks: as a rating submitted with no thumbs, which is exactly what
// "I'm not rating this game" means and what the Submit button does when nothing
// is chosen. That keeps the single-source-of-truth property above intact — no
// local suppression list to keep in step, expire, or outgrow SecureStore.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  clearNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notifications';
import { getPendingRatings, rateGame } from '@/services/games';
import { sportLabel } from '@/components/ui/sport-icon';
import { useSession } from '@/contexts/session-context';
import { hasSomeoneToRate } from '@/utils/games';
import { RATING_ID_PREFIX, type AppNotification } from '@/types/notification';
import type { Game } from '@/types/game';

const POLL_INTERVAL_MS = 30_000;
// Games the user has already acknowledged owing a rating for — either by
// tapping "Later" on the prompt or by opening the notification centre. Persisted
// so the auto-prompt doesn't reappear on every app launch; the row itself stays
// in the list (as read) until the rating is actually submitted.
// It is pruned against what's still pending on every poll, which is what keeps
// it well inside SecureStore's ~2KB practical ceiling.
const DISMISSED_KEY = 'squadup_rating_dismissals';

type NotificationsState = {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  /** Delete one row. Deleting a rating row means "not rating this game". */
  removeNotification: (id: string) => Promise<void>;
  /** Empty the whole list, outstanding rating prompts included. */
  clearAll: () => Promise<void>;

  /** Completed games still owing a rating, newest first. */
  pendingRatings: Game[];
  /** The one to auto-prompt for, or null once every pending game is acknowledged. */
  promptRating: Game | null;
  /** "Later" — stop auto-prompting for this game but keep it in the list. */
  dismissRating: (gameId: string) => void;
  /** Rating submitted — drop the row immediately rather than waiting on a poll. */
  clearRating: (gameId: string) => void;

  /** Newest un-shown arrival, for the top-of-screen toast. */
  liveNotification: AppNotification | null;
  dismissLive: () => void;
};

const NotificationsContext = createContext<NotificationsState | null>(null);

/** One synthetic row per completed game the user still owes a rating for. */
function buildRatingRows(games: Game[], dismissed: Set<string>): AppNotification[] {
  return games.map((game) => ({
    id: `${RATING_ID_PREFIX}${game.id}`,
    type: 'rate_teammates' as const,
    title: 'Rate your teammates',
    body: `How did the ${sportLabel(game.sport)} game at ${game.location} go?`,
    gameId: game.id,
    read: dismissed.has(game.id),
    // Ordered by when the game happened, so it slots into the timeline near the
    // other notifications from that game rather than always pinning to the top.
    createdAt: game.start_time,
  }));
}

function byNewest(a: AppNotification, b: AppNotification): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

/**
 * Drop acknowledgements for games that are no longer pending, so the set can't
 * grow without bound — but only for ids that were already acknowledged when the
 * request went out. A game acknowledged *while* the fetch was in flight can't be
 * judged by a response that predates it: the response simply doesn't know about
 * it yet, and pruning on that basis would silently undo the acknowledgement and
 * let the prompt reappear.
 */
function pruneAcknowledgements(
  current: Set<string>,
  atRequestStart: Set<string>,
  stillPending: Set<string>,
): Set<string> {
  return new Set(
    [...current].filter((id) => stillPending.has(id) || !atRequestStart.has(id)),
  );
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { token, user } = useSession();
  const [serverRows, setServerRows] = useState<AppNotification[]>([]);
  const [pendingRatings, setPendingRatings] = useState<Game[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [liveQueue, setLiveQueue] = useState<AppNotification[]>([]);

  // Ids already accounted for, so a poll only toasts genuinely new arrivals.
  // Seeded (without toasting) by the first load of a session — otherwise
  // signing in would fire a toast for every unread notification in the history.
  const known = useRef<Set<string>>(new Set());
  const seeded = useRef(false);
  const dismissedRef = useRef<Set<string>>(new Set());
  // Read by the bulk actions so they don't have to depend on (and be rebuilt
  // by) every poll — an unstable `markAllRead` re-triggers the notification
  // screen's focus effect, which calls it again, which polls again, forever.
  const pendingRatingsRef = useRef<Game[]>([]);
  const userIdRef = useRef<string | undefined>(user?.id);
  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  // A poll timer, a screen focus and a pull-to-refresh can all fire at once.
  // Overlapping runs would both diff against a `known` set neither has updated
  // yet and queue the same arrival as two toasts, so runs are serialized — but
  // a request that lands mid-run is remembered and replayed rather than
  // dropped, because callers use it to pick up a change they just made.
  const inFlight = useRef<Promise<void> | null>(null);
  const rerunRequested = useRef(false);
  // Games already being resolved, so a poll mid-flight doesn't double-post.
  const resolving = useRef<Set<string>>(new Set());

  const persistDismissed = useCallback((next: Set<string>) => {
    dismissedRef.current = next;
    setDismissed(next);
    SecureStore.setItemAsync(DISMISSED_KEY, JSON.stringify([...next])).catch(() => {
      // Non-fatal: the prompt may reappear after a restart.
    });
  }, []);

  // Restore acknowledgements before the first load, so rows don't flash unread.
  useEffect(() => {
    if (!token) return;
    SecureStore.getItemAsync(DISMISSED_KEY)
      .then((raw) => {
        if (!raw) return;
        const ids: string[] = JSON.parse(raw);
        dismissedRef.current = new Set(ids);
        setDismissed(new Set(ids));
      })
      .catch(() => {
        // Corrupt or missing — start with nothing acknowledged.
      });
  }, [token]);

  /**
   * Record a game as rated with no thumbs — exactly what submitting the prompt
   * without choosing anyone does — so the server stops listing it as pending.
   * Used both for games with nobody to rate and for rating rows the user
   * deletes; either way the answer to "does this user still owe a rating?" is
   * settled in the one place that owns it.
   */
  const resolveWithoutRating = useCallback((gameId: string) => {
    if (resolving.current.has(gameId)) return;
    resolving.current.add(gameId);
    rateGame(gameId, []).catch(() => {
      // Let a later poll try again.
      resolving.current.delete(gameId);
    });
  }, []);

  /** Drop a game from the pending list without waiting for the next poll. */
  const forgetPending = useCallback((gameId: string) => {
    const remaining = pendingRatingsRef.current.filter((g) => g.id !== gameId);
    pendingRatingsRef.current = remaining;
    setPendingRatings(remaining);
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;
    if (inFlight.current) {
      rerunRequested.current = true;
      return inFlight.current;
    }

    const run = (async () => {
      try {
        do {
          rerunRequested.current = false;
          await load();
        } while (rerunRequested.current);
      } finally {
        inFlight.current = null;
      }
    })();
    inFlight.current = run;
    return run;

    async function load() {
      // Snapshotted before the requests go out — see `pruneAcknowledgements`.
      const dismissedAtStart = new Set(dismissedRef.current);

      // A failed leg resolves to null so one flaky request doesn't blank the list.
      const [rows, ratingGames] = await Promise.all([
        getNotifications().catch(() => null),
        getPendingRatings().catch(() => null),
      ]);

      let nextDismissed = dismissedRef.current;

      if (ratingGames) {
        // Games with nobody to rate are settled in the background instead of
        // becoming a prompt with an empty list and no meaningful action.
        const rateable = ratingGames.filter((game) => {
          if (hasSomeoneToRate(game, userIdRef.current)) return true;
          resolveWithoutRating(game.id);
          return false;
        });

        const stillPending = new Set(rateable.map((g) => g.id));
        const pruned = pruneAcknowledgements(
          dismissedRef.current,
          dismissedAtStart,
          stillPending,
        );
        if (pruned.size !== dismissedRef.current.size) {
          nextDismissed = pruned;
          persistDismissed(pruned);
        }

        pendingRatingsRef.current = rateable;
        setPendingRatings(rateable);
      }
      if (rows) setServerRows(rows);

      const merged = [
        ...(rows ?? serverRows),
        ...buildRatingRows(pendingRatingsRef.current, nextDismissed),
      ];

      if (!seeded.current) {
        merged.forEach((n) => known.current.add(n.id));
        seeded.current = true;
        return;
      }

      const arrivals = merged.filter((n) => !known.current.has(n.id));
      arrivals.forEach((n) => known.current.add(n.id));
      const toToast = arrivals.filter((n) => !n.read).sort(byNewest);
      if (toToast.length > 0) setLiveQueue((prev) => [...prev, ...toToast]);
    }
    // `serverRows` is read only as a fallback for a failed leg; depending on it
    // would rebuild this callback on every poll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, persistDismissed, resolveWithoutRating]);

  // Reset everything on sign-out, and do the first load on sign-in.
  useEffect(() => {
    if (!token) {
      setServerRows([]);
      setPendingRatings([]);
      setLiveQueue([]);
      setDismissed(new Set());
      dismissedRef.current = new Set();
      pendingRatingsRef.current = [];
      resolving.current = new Set();
      known.current = new Set();
      seeded.current = false;
      return;
    }
    setIsLoading(true);
    refresh().finally(() => setIsLoading(false));
  }, [token, refresh]);

  // Poll while foregrounded; refresh immediately on return from background so
  // the badge is right the moment the user looks at it.
  useEffect(() => {
    if (!token) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => {
        refresh().catch(() => {});
      }, POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    const onChange = (state: AppStateStatus) => {
      if (state === 'active') {
        refresh().catch(() => {});
        start();
      } else {
        stop();
      }
    };

    if (AppState.currentState === 'active') start();
    const sub = AppState.addEventListener('change', onChange);
    return () => {
      stop();
      sub.remove();
    };
  }, [token, refresh]);

  const notifications = useMemo(() => {
    // Keyed by id on the way in: the server collapses repeat events into one
    // row, and this makes sure nothing downstream (a retry landing mid-merge, a
    // rating row for a game that also has a server row) can list the same id
    // twice or hand FlatList a duplicate key.
    const byId = new Map<string, AppNotification>();
    for (const row of [...serverRows, ...buildRatingRows(pendingRatings, dismissed)]) {
      byId.set(row.id, row);
    }
    return [...byId.values()].sort(byNewest);
  }, [serverRows, pendingRatings, dismissed]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  // The first pending game the user hasn't acknowledged — what home auto-prompts
  // with. Once they hit "Later" it stops prompting and lives in the list only.
  const promptRating = useMemo(
    () => pendingRatings.find((g) => !dismissed.has(g.id)) ?? null,
    [pendingRatings, dismissed],
  );

  const dismissRating = useCallback(
    (gameId: string) => {
      const next = new Set(dismissedRef.current);
      next.add(gameId);
      persistDismissed(next);
    },
    [persistDismissed],
  );

  const clearRating = useCallback(
    (gameId: string) => {
      forgetPending(gameId);
      const next = new Set(dismissedRef.current);
      next.delete(gameId);
      persistDismissed(next);
    },
    [forgetPending, persistDismissed],
  );

  const markRead = useCallback(
    async (id: string) => {
      if (id.startsWith(RATING_ID_PREFIX)) {
        dismissRating(id.slice(RATING_ID_PREFIX.length));
        return;
      }
      setServerRows((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      try {
        await markNotificationRead(id);
      } catch {
        // The optimistic flag stands; the next poll reconciles it.
      }
    },
    [dismissRating],
  );

  const markAllRead = useCallback(async () => {
    setServerRows((prev) => prev.map((n) => ({ ...n, read: true })));
    const next = new Set(dismissedRef.current);
    pendingRatingsRef.current.forEach((g) => next.add(g.id));
    persistDismissed(next);
    try {
      await markAllNotificationsRead();
    } catch {
      // Same as above — reconciled by the next poll.
    }
  }, [persistDismissed]);

  const removeNotification = useCallback(
    async (id: string) => {
      // Deleting a rating row is a decision not to rate that game, recorded as
      // a rating with no thumbs so the server stops asking.
      if (id.startsWith(RATING_ID_PREFIX)) {
        const gameId = id.slice(RATING_ID_PREFIX.length);
        forgetPending(gameId);
        resolveWithoutRating(gameId);
        return;
      }
      setServerRows((prev) => prev.filter((n) => n.id !== id));
      try {
        await deleteNotification(id);
      } catch {
        // The row comes back on the next poll if the delete didn't land.
      }
    },
    [forgetPending, resolveWithoutRating],
  );

  const clearAll = useCallback(async () => {
    setServerRows([]);
    // Same deal as a single rating row: settle each one rather than hiding it,
    // or the next poll would put them all straight back.
    pendingRatingsRef.current.forEach((g) => resolveWithoutRating(g.id));
    pendingRatingsRef.current = [];
    setPendingRatings([]);
    try {
      await clearNotifications();
    } catch {
      // Same as above.
    }
  }, [resolveWithoutRating]);

  const dismissLive = useCallback(() => setLiveQueue((prev) => prev.slice(1)), []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      refresh,
      markRead,
      markAllRead,
      removeNotification,
      clearAll,
      pendingRatings,
      promptRating,
      dismissRating,
      clearRating,
      liveNotification: liveQueue[0] ?? null,
      dismissLive,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      refresh,
      markRead,
      markAllRead,
      removeNotification,
      clearAll,
      pendingRatings,
      promptRating,
      dismissRating,
      clearRating,
      liveQueue,
      dismissLive,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
