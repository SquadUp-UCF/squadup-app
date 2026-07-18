// Tracks which games the signed-in user has "saved" (bookmarked), so the heart
// on any game card reflects the same state everywhere. Loaded once from the
// profile and kept in sync optimistically as the user toggles.
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
import { getSavedGameIds, saveGame, unsaveGame } from '@/services/users';
import { useSession } from '@/contexts/session-context';

type SavedGamesState = {
  savedIds: Set<string>;
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => Promise<void>;
};

const SavedGamesContext = createContext<SavedGamesState | null>(null);

export function SavedGamesProvider({ children }: { children: ReactNode }) {
  const { token } = useSession();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  // Guards against overlapping toggles on the same game double-firing requests.
  const inFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!token) {
      setSavedIds(new Set());
      return;
    }
    let active = true;
    getSavedGameIds()
      .then((ids) => {
        if (active) setSavedIds(new Set(ids));
      })
      .catch(() => {
        // Non-fatal — hearts just start empty until the next successful load.
      });
    return () => {
      active = false;
    };
  }, [token]);

  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds]);

  const toggleSaved = useCallback(
    async (id: string) => {
      if (!token || inFlight.current.has(id)) return;
      const wasSaved = savedIds.has(id);
      inFlight.current.add(id);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(id);
        else next.add(id);
        return next;
      });
      try {
        if (wasSaved) await unsaveGame(id);
        else await saveGame(id);
      } catch {
        // Revert on failure.
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(id);
          else next.delete(id);
          return next;
        });
      } finally {
        inFlight.current.delete(id);
      }
    },
    [token, savedIds],
  );

  const value = useMemo(
    () => ({ savedIds, isSaved, toggleSaved }),
    [savedIds, isSaved, toggleSaved],
  );

  return <SavedGamesContext.Provider value={value}>{children}</SavedGamesContext.Provider>;
}

export function useSavedGames() {
  const context = useContext(SavedGamesContext);
  if (!context) {
    throw new Error('useSavedGames must be used within a SavedGamesProvider');
  }
  return context;
}
