// mock ai plugin for game creation/feed
import type { Game } from '@/types/game';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MOCK_GAMES: Game[] = [
  {
    id: '1',
    host: 'fake-host-1',
    sport: 'Test',
    location: 'Professors Ls class',
    start_time: '2026-07-10T21:00:00.000Z',
    min_players: 2,
    max_players: 10,
    status: 'open',
    participants: [{ user: 'fake-host-1', status: 'joined', joined_at: '2026-07-09T00:00:00.000Z' }],
    photo_url: '/sports/Test.svg',
  },
];

export async function discoverGames(): Promise<Game[]> {
  await delay(500);
  return MOCK_GAMES;
}

export async function createGame(input: {
  sport: string;
  location: string;
  description?: string;
  start_time: string;
  min_players: number;
  max_players: number;
}): Promise<Game> {
  await delay(700);
  const newGame: Game = {
    id: String(MOCK_GAMES.length + 1),
    host: 'fake-current-user',
    status: 'open',
    participants: [{ user: 'fake-current-user', status: 'joined', joined_at: new Date().toISOString() }],
    photo_url: `/sports/${input.sport.toLowerCase()}.svg`,
    ...input,
  };
  MOCK_GAMES.push(newGame); // mutates in-memory, so it shows up in discoverGames() after creating
  return newGame;
}