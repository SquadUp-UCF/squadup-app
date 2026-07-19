// Mobile port of squadup-front's src/utils/games.js — same rules, so a game's
// status/live/new/banner presentation reads the same on both clients.
import { colors } from '@/constants/theme';
import type { Game } from '@/types/game';

// A game runs for roughly this long; used to decide when it stops being "live".
export const LIVE_WINDOW_MS = 2 * 60 * 60 * 1000;

// A game created within this window shows a "NEW" badge.
export const NEW_WINDOW_MS = 24 * 60 * 60 * 1000;

const STATUS_META = {
  open: colors.statusOpen,
  confirmed: colors.statusConfirmed,
  locked: colors.statusLocked,
  completed: colors.statusCompleted,
  cancelled: colors.statusCancelled,
} as const;

export function statusMeta(game: Game) {
  return STATUS_META[game.status] || STATUS_META.open;
}

/**
 * Whether a game has a real, host-uploaded banner rather than the default
 * sport-icon placeholder. On mobile a custom banner is a local file/content
 * URI picked via expo-image-picker; anything else (or nothing) falls back to
 * the placeholder — same rule web's hasCustomBanner() applies to non-stock
 * paths.
 */
export function hasCustomBanner(game: Game) {
  return Boolean(game.photo_url) && /^(file|content|https?):\/\//i.test(game.photo_url);
}

/** A game is "live" while it's underway: started, within the window, not ended. */
export function isLive(game: Game, now = Date.now()) {
  if (game.status === 'completed' || game.status === 'cancelled') return false;
  const start = new Date(game.start_time).getTime();
  if (Number.isNaN(start)) return false;
  return start <= now && now <= start + LIVE_WINDOW_MS;
}

/** Shown in the feed: upcoming or currently live, never terminal/long-past. */
export function isActive(game: Game, now = Date.now()) {
  if (game.status === 'completed' || game.status === 'cancelled') return false;
  const start = new Date(game.start_time).getTime();
  if (Number.isNaN(start)) return false;
  return start + LIVE_WINDOW_MS >= now;
}

/** Whether kickoff has passed — the API stops accepting new guests at that point. */
export function hasStarted(game: Game, now = Date.now()) {
  const start = new Date(game.start_time).getTime();
  if (Number.isNaN(start)) return false;
  return start <= now;
}

export function isNew(game: Game, now = Date.now()) {
  if (!game.createdAt) return false;
  return now - new Date(game.createdAt).getTime() < NEW_WINDOW_MS;
}

/**
 * Whether `userId` has anyone they could actually rate on this game. Only
 * joined, registered players other than the rater can be rated — a game played
 * solo, or with guests only, has nobody, and prompting for one produces an
 * empty dialog whose only real option is to back out of it.
 */
export function hasSomeoneToRate(game: Game, userId: string | undefined) {
  return game.participants.some(
    (p) => p.user && p.status === 'joined' && p.user !== userId,
  );
}

// Sums party_size across joined participants — one account can RSVP for a
// group, so headcount isn't always 1-per-roster-entry.
export function activeCount(game: Game) {
  return (game.participants || [])
    .filter((p) => p.status === 'joined')
    .reduce((sum, p) => sum + (p.party_size || 1), 0);
}
