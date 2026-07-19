// Notification endpoints — /api/notifications. Like the other services these
// stay token-less; apiFetch attaches the bearer token. Responses are serialized
// Mongoose docs (`_id`, `createdAt`), normalized here to the app's shape.
import { apiFetch } from '@/lib/http';
import type { AppNotification, NotificationType } from '@/types/notification';

function normalizeNotification(raw: Record<string, any>): AppNotification {
  return {
    id: String(raw._id ?? raw.id),
    type: (raw.type ?? 'game_updated') as NotificationType,
    title: raw.title ?? '',
    body: raw.body ?? '',
    gameId: raw.gameId != null ? String(raw.gameId) : null,
    read: Boolean(raw.read),
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
  };
}

/** The 50 most recent notifications for the signed-in user, newest first. */
export async function getNotifications(): Promise<AppNotification[]> {
  const raw = await apiFetch<Record<string, any>[]>('/notifications');
  return raw.map(normalizeNotification);
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch<void>(`/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch<void>('/notifications/read-all', { method: 'PATCH' });
}

/** Remove one row from the history. Idempotent — deleting a gone row is fine. */
export async function deleteNotification(id: string): Promise<void> {
  await apiFetch<void>(`/notifications/${id}`, { method: 'DELETE' });
}

/** Empty the whole history. */
export async function clearNotifications(): Promise<void> {
  await apiFetch<void>('/notifications', { method: 'DELETE' });
}
