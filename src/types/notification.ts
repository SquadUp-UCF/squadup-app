// In-app notifications. Most are rows the API persisted (`/notifications`);
// `rate_teammates` is the exception — it's synthesized on the client from
// `/games/pending-ratings` so it disappears on its own once the rating is
// submitted, with no second source of truth to keep in step.
export type NotificationType =
  | 'game_filling_up'
  | 'game_confirmed'
  | 'game_locked'
  | 'player_joined'
  | 'game_starting_soon'
  | 'game_cancelled'
  | 'game_updated'
  | 'game_completed'
  | 'rate_teammates';

/**
 * Types the API sends that this client deliberately doesn't show.
 *
 * `game_completed` ("your game has ended — rate your teammates") is the same
 * ask as the client-derived `rate_teammates` row, so rendering both puts two
 * rows in the list for one thing to do. The synthesized row wins because it
 * opens the rating prompt in place and disappears by itself once the rating is
 * submitted; the server row can do neither — tapping it only opens the game,
 * and it would linger after the rating was done.
 *
 * The web client is the mirror image: it has no rating prompt and no
 * `/games/pending-ratings` queue, so it shows `game_completed` and never sees
 * `rate_teammates` (which the API doesn't send — it exists only here). Between
 * the two clients every user is told exactly once.
 */
export const HIDDEN_NOTIFICATION_TYPES: ReadonlySet<NotificationType> = new Set([
  'game_completed',
]);

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  gameId: string | null;
  read: boolean;
  createdAt: string; // ISO date string
};

/** Client-only rows carry a `rating:` id prefix; server rows never do. */
export const RATING_ID_PREFIX = 'rating:';

export function isRatingNotification(n: AppNotification): boolean {
  return n.type === 'rate_teammates';
}
