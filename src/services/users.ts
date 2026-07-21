// User endpoints — /api/users/*. Token attached automatically by apiFetch.
//
// Note on skill level: the app surfaces a user's per-sport skill level under
// `preferred_positions` (the field the UI reads), but the API stores it in
// `skill_levels`. This adapter maps between the two so screens are unchanged.
import { apiFetch } from '@/lib/http';
import { mediaUrl } from '@/lib/api-config';
import { getGame } from './games';
import type { UserProfile, PlayerProfile } from '@/types/user';
import type { Game } from '@/types/game';

// Map a serialized API user (/users/me carries `_id`; /users/:id carries `id`)
// into the app's UserProfile.
function toUserProfile(raw: Record<string, any>): UserProfile {
  return {
    id: String(raw._id ?? raw.id ?? ''),
    first_name: raw.first_name ?? '',
    last_name: raw.last_name ?? '',
    email: raw.email ?? '',
    username: raw.username ?? '',
    // Relative avatar paths (e.g. /uploads/avatars/x.jpg) resolve to absolute
    // URLs; a null stays null.
    profile_picture: mediaUrl(raw.profile_picture),
    preferred_positions: raw.skill_levels ?? {},
  };
}

export async function getMe(): Promise<UserProfile> {
  const raw = await apiFetch<Record<string, any>>('/users/me');
  return toUserProfile(raw);
}

export async function getUser(id: string): Promise<UserProfile | null> {
  try {
    const raw = await apiFetch<Record<string, any>>(`/users/${id}`);
    return toUserProfile(raw);
  } catch {
    return null;
  }
}

// A player's public profile with stats (reputation + game counts) for the
// profile screen. `games_created`/`games_joined` come back as counts here.
export async function getPlayerProfile(id: string): Promise<PlayerProfile | null> {
  try {
    const raw = await apiFetch<Record<string, any>>(`/users/${id}`);
    return {
      id: String(raw._id ?? raw.id ?? id),
      first_name: raw.first_name ?? '',
      last_name: raw.last_name ?? '',
      username: raw.username ?? '',
      profile_picture: mediaUrl(raw.profile_picture),
      reputation: typeof raw.reputation === 'number' ? raw.reputation : 5,
      games_created: typeof raw.games_created === 'number' ? raw.games_created : 0,
      games_joined: typeof raw.games_joined === 'number' ? raw.games_joined : 0,
      preferred_positions: raw.skill_levels ?? {},
    };
  } catch {
    return null;
  }
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  try {
    const res = await apiFetch<{ available: boolean }>('/users/username-available', {
      query: { username },
    });
    return res.available;
  } catch {
    // If the check can't run (e.g. before the session is authenticated), don't
    // block the user — the server rejects a real clash with a 409 on save.
    return true;
  }
}

export async function updateProfile(
  _userId: string,
  input: Partial<Pick<UserProfile, 'first_name' | 'last_name' | 'username' | 'preferred_positions'>>,
): Promise<UserProfile> {
  const body: Record<string, unknown> = {};
  if (input.first_name !== undefined) body.first_name = input.first_name;
  if (input.last_name !== undefined) body.last_name = input.last_name;
  if (input.username !== undefined) body.username = input.username;
  // The app's `preferred_positions` is the user's skill level per sport.
  if (input.preferred_positions !== undefined) body.skill_levels = input.preferred_positions;
  const raw = await apiFetch<Record<string, any>>('/users/me', { method: 'PATCH', body });
  return toUserProfile(raw);
}

// The ids of games the user has bookmarked ("saved"), read from /users/me.
export async function getSavedGameIds(): Promise<string[]> {
  const raw = await apiFetch<Record<string, any>>('/users/me');
  const saved = (raw.saved_games ?? []) as any[];
  return saved.map((x) => String(x?._id ?? x?.$oid ?? x)).filter(Boolean);
}

// Full saved games. Resolves each id individually so it works whether or not
// the API populates the saved-games list, and drops any that can't be loaded
// (e.g. since deleted).
export async function getSavedGames(): Promise<Game[]> {
  const ids = await getSavedGameIds();
  const games = await Promise.all(ids.map((id) => getGame(id)));
  return games.filter((g): g is Game => g != null);
}

export function saveGame(gameId: string): Promise<void> {
  return apiFetch<void>(`/users/me/saved-games/${gameId}`, { method: 'POST' });
}

export function unsaveGame(gameId: string): Promise<void> {
  return apiFetch<void>(`/users/me/saved-games/${gameId}`, { method: 'DELETE' });
}

export async function uploadAvatar(_userId: string, uri: string | null): Promise<UserProfile> {
  if (!uri) {
    const raw = await apiFetch<Record<string, any>>('/users/me/avatar', { method: 'DELETE' });
    return toUserProfile(raw);
  }
  const name = uri.split('/').pop() || 'avatar.jpg';
  const ext = (/\.(\w+)$/.exec(name)?.[1] || 'jpg').toLowerCase();
  const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const form = new FormData();
  // React Native's file-part shape for multipart uploads.
  form.append('avatar', { uri, name, type } as unknown as Blob);
  const raw = await apiFetch<Record<string, any>>('/users/me/avatar', {
    method: 'PUT',
    body: form,
    multipart: true,
  });
  return toUserProfile(raw);
}
