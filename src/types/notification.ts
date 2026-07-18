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
  | 'rate_teammates';

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
