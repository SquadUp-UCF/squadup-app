// Game endpoints — /api/games. The bearer token is attached automatically by
// apiFetch (see lib/auth-token), so these stay token-less like the mock they
// replace. The API returns serialized Mongoose docs (with `_id`), so results
// are normalized to the app's Game shape.
import { apiFetch } from '@/lib/http';
import type { Game, Participant } from '@/types/game';

// UCF main campus — default coordinates for games created without a map pin
// (the create form doesn't collect one yet, but the API requires lat/long).
const UCF = { latitude: 28.6024, longitude: -81.2001 };

function normalizeGame(raw: Record<string, any>): Game {
  return {
    id: String(raw._id ?? raw.id),
    host: String(raw.host),
    sport: raw.sport ?? '',
    description: raw.description,
    location: raw.location ?? '',
    start_time: raw.start_time,
    min_players: raw.min_players,
    max_players: raw.max_players,
    status: raw.status ?? 'open',
    participants: (raw.participants ?? []).map(
      (p: Record<string, any>): Participant => ({
        user: String(p.user ?? ''),
        status: p.status,
        joined_at: p.joined_at,
        party_size: p.party_size,
      }),
    ),
    photo_url: raw.photo_url ?? '',
    createdAt: raw.createdAt ?? raw.created_at,
    latitude: raw.latitude,
    longitude: raw.longitude,
    skill_level: raw.skill_level,
  };
}

export async function discoverGames(): Promise<Game[]> {
  const games = await apiFetch<Record<string, any>[]>('/games');
  return games.map(normalizeGame);
}

export async function getGame(id: string): Promise<Game | null> {
  try {
    const raw = await apiFetch<Record<string, any>>(`/games/${id}`);
    return normalizeGame(raw);
  } catch {
    return null;
  }
}

export async function getMyGames(_userId: string, role: 'playing' | 'hosting'): Promise<Game[]> {
  const games = await apiFetch<Record<string, any>[]>('/games/mine', { query: { role } });
  return games.map(normalizeGame);
}

export type GameInput = {
  sport: string;
  location: string;
  description?: string;
  start_time: string;
  min_players: number;
  max_players: number;
  photo_url?: string;
};

// Only http(s) banner URLs are meaningful to the API; a local file/content URI
// picked on-device can't be served, so it's dropped (the game falls back to its
// sport's stock banner) rather than stored as an unreachable path.
function remoteBanner(photo?: string): string | undefined {
  return photo && /^https?:\/\//i.test(photo) ? photo : undefined;
}

// `hostId` is derived from the token server-side; kept in the signature for the
// call sites that still pass it.
export async function createGame(input: GameInput, _hostId: string): Promise<Game> {
  const raw = await apiFetch<Record<string, any>>('/games', {
    method: 'POST',
    body: {
      sport: input.sport,
      location: input.location,
      description: input.description,
      start_time: input.start_time,
      min_players: input.min_players,
      max_players: input.max_players,
      latitude: UCF.latitude,
      longitude: UCF.longitude,
      photo_url: remoteBanner(input.photo_url),
    },
  });
  return normalizeGame(raw);
}

export async function updateGame(id: string, input: GameInput): Promise<Game> {
  const raw = await apiFetch<Record<string, any>>(`/games/${id}`, {
    method: 'PATCH',
    body: {
      sport: input.sport,
      location: input.location,
      description: input.description,
      start_time: input.start_time,
      min_players: input.min_players,
      max_players: input.max_players,
      photo_url: remoteBanner(input.photo_url),
    },
  });
  return normalizeGame(raw);
}

export async function deleteGame(id: string): Promise<void> {
  await apiFetch<void>(`/games/${id}`, { method: 'DELETE' });
}

export async function joinGame(id: string, _userId: string, partySize = 1): Promise<Game> {
  const raw = await apiFetch<Record<string, any>>(`/games/${id}/join`, {
    method: 'POST',
    body: { party_size: partySize },
  });
  return normalizeGame(raw);
}

export async function leaveGame(id: string, _userId: string): Promise<Game> {
  const raw = await apiFetch<Record<string, any>>(`/games/${id}/leave`, { method: 'POST' });
  return normalizeGame(raw);
}
