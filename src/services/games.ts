// mock api components (game feed/creation/join/leave/host actions)
import type { Game, Participant } from '@/types/game';
import { isActive } from '@/utils/games';
import { DEMO_USER_ID } from './users';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isoOffset(ms: number) {
  return new Date(Date.now() + ms).toISOString();
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// Seeded with a mix of states so LIVE/NEW/"Filling up"/host/already-joined/
// full are all visible on the feed without a real backend.
let MOCK_GAMES: Game[] = [
  {
    id: '1',
    host: 'demo-host-2',
    sport: 'basketball',
    location: 'Rec Center Court 2',
    description: 'Casual pickup, all levels welcome.',
    start_time: isoOffset(-20 * 60 * 1000), // started 20 min ago -> LIVE
    min_players: 2,
    max_players: 10,
    status: 'open',
    participants: [
      { user: 'demo-host-2', status: 'joined', joined_at: isoOffset(-DAY), party_size: 1 },
      { user: 'demo-host-3', status: 'joined', joined_at: isoOffset(-HOUR), party_size: 2 },
    ],
    photo_url: '',
    createdAt: isoOffset(-3 * DAY),
  },
  {
    id: '2',
    host: 'demo-host-3',
    sport: 'soccer',
    location: 'Intramural Field 3',
    description: 'Bring cleats, we play to 5.',
    start_time: isoOffset(2 * DAY),
    min_players: 6,
    max_players: 10,
    status: 'open',
    participants: [
      { user: 'demo-host-3', status: 'joined', joined_at: isoOffset(-2 * HOUR), party_size: 4 },
      { user: 'demo-host-4', status: 'joined', joined_at: isoOffset(-HOUR), party_size: 4 },
    ],
    photo_url: '',
    createdAt: isoOffset(-2 * HOUR), // < 24h -> NEW
  },
  {
    id: '3',
    host: DEMO_USER_ID,
    sport: 'tennis',
    location: 'UCF Tennis Courts',
    description: 'Looking for a doubles partner.',
    start_time: isoOffset(DAY),
    min_players: 2,
    max_players: 4,
    status: 'open',
    participants: [{ user: DEMO_USER_ID, status: 'joined', joined_at: isoOffset(-5 * DAY), party_size: 1 }],
    photo_url: '',
    createdAt: isoOffset(-5 * DAY),
  },
  {
    id: '4',
    host: 'demo-host-2',
    sport: 'volleyball',
    location: 'Sand Volleyball Courts',
    start_time: isoOffset(3 * HOUR),
    min_players: 4,
    max_players: 6,
    status: 'locked',
    participants: [
      { user: 'demo-host-2', status: 'joined', joined_at: isoOffset(-DAY), party_size: 3 },
      { user: 'demo-host-4', status: 'joined', joined_at: isoOffset(-HOUR), party_size: 3 },
    ],
    photo_url: '',
    createdAt: isoOffset(-6 * DAY),
  },
  {
    id: '5',
    host: 'demo-host-4',
    sport: 'table-tennis',
    location: 'Student Union Game Room',
    start_time: isoOffset(5 * HOUR),
    min_players: 2,
    max_players: 4,
    status: 'open',
    participants: [
      { user: 'demo-host-4', status: 'joined', joined_at: isoOffset(-DAY), party_size: 1 },
      { user: DEMO_USER_ID, status: 'joined', joined_at: isoOffset(-HOUR), party_size: 1 },
    ],
    photo_url: '',
    createdAt: isoOffset(-4 * DAY),
  },
];

export async function discoverGames(): Promise<Game[]> {
  await delay(500);
  return MOCK_GAMES.filter((g) => isActive(g));
}

export async function getGame(id: string): Promise<Game | null> {
  await delay(300);
  return MOCK_GAMES.find((g) => g.id === id) || null;
}

export async function getMyGames(userId: string, role: 'playing' | 'hosting'): Promise<Game[]> {
  await delay(400);
  if (role === 'hosting') {
    return MOCK_GAMES.filter((g) => g.host === userId);
  }
  return MOCK_GAMES.filter((g) =>
    g.participants.some((p) => p.user === userId && p.status === 'joined')
  );
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

export async function createGame(input: GameInput, hostId: string): Promise<Game> {
  await delay(700);
  const newGame: Game = {
    id: String(Date.now()),
    host: hostId,
    status: 'open',
    participants: [{ user: hostId, status: 'joined', joined_at: new Date().toISOString(), party_size: 1 }],
    photo_url: input.photo_url || '',
    createdAt: new Date().toISOString(),
    ...input,
  };
  MOCK_GAMES = [newGame, ...MOCK_GAMES]; // mutates in-memory, so it shows up in discoverGames() after creating
  return newGame;
}

export async function updateGame(id: string, input: GameInput): Promise<Game> {
  await delay(700);
  const existing = MOCK_GAMES.find((g) => g.id === id);
  if (!existing) throw new Error('Game not found');
  const updated: Game = { ...existing, ...input };
  MOCK_GAMES = MOCK_GAMES.map((g) => (g.id === id ? updated : g));
  return updated;
}

export async function deleteGame(id: string): Promise<void> {
  await delay(500);
  MOCK_GAMES = MOCK_GAMES.filter((g) => g.id !== id);
}

export async function joinGame(id: string, userId: string, partySize = 1): Promise<Game> {
  await delay(500);
  const existing = MOCK_GAMES.find((g) => g.id === id);
  if (!existing) throw new Error('Game not found');

  const participants: Participant[] = [
    ...existing.participants.filter((p) => p.user !== userId),
    { user: userId, status: 'joined', joined_at: new Date().toISOString(), party_size: partySize },
  ];
  const updated: Game = { ...existing, participants };
  MOCK_GAMES = MOCK_GAMES.map((g) => (g.id === id ? updated : g));
  return updated;
}

export async function leaveGame(id: string, userId: string): Promise<Game> {
  await delay(400);
  const existing = MOCK_GAMES.find((g) => g.id === id);
  if (!existing) throw new Error('Game not found');

  const participants = existing.participants.map((p) =>
    p.user === userId ? { ...p, status: 'cancelled' as const } : p
  );
  const updated: Game = { ...existing, participants };
  MOCK_GAMES = MOCK_GAMES.map((g) => (g.id === id ? updated : g));
  return updated;
}
