// another fake backend (sep file to follow backend api structure
// of splitting auth and users)
import type { UserProfile } from '@/types/user';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Shared directory of mock profiles — also used by services/auth.ts (the
// logged-in user always resolves to DEMO_USER_ID in this mocked world) and by
// the game-detail roster lookup, so a host/participant shown in a game always
// has a matching profile here.
export const DEMO_USER_ID = 'fake-id';

export const MOCK_USERS: Record<string, UserProfile> = {
  [DEMO_USER_ID]: {
    id: DEMO_USER_ID,
    first_name: 'Test',
    last_name: 'User',
    email: 'test@ucf.edu',
    username: 'testuser',
    profile_picture: null,
    preferred_positions: {},
  },
  'demo-host-2': {
    id: 'demo-host-2',
    first_name: 'Marcus',
    last_name: 'Reed',
    email: 'mr123456@ucf.edu',
    username: 'marcusr',
    profile_picture: null,
    preferred_positions: { basketball: 'Intermediate', volleyball: 'Pro' },
  },
  'demo-host-3': {
    id: 'demo-host-3',
    first_name: 'Ava',
    last_name: 'Chen',
    email: 'ac234567@ucf.edu',
    username: 'avachen',
    profile_picture: null,
    preferred_positions: { soccer: 'Pro' },
  },
  'demo-host-4': {
    id: 'demo-host-4',
    first_name: 'Jordan',
    last_name: 'Lee',
    email: 'jl345678@ucf.edu',
    username: 'jlee',
    profile_picture: null,
    preferred_positions: { 'table-tennis': 'Beginner' },
  },
};

const TAKEN_USERNAMES = new Set(['admin', 'test', 'squadup', 'marcusr', 'avachen', 'jlee']);

export async function getUser(id: string): Promise<UserProfile | null> {
  await delay(300);
  return MOCK_USERS[id] || null;
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  await delay(400); // mirrors the debounced check in ProfileSetup.jsx
  return !TAKEN_USERNAMES.has(username.trim().toLowerCase());
}

export async function updateProfile(
  userId: string,
  input: Partial<Pick<UserProfile, 'first_name' | 'last_name' | 'username' | 'preferred_positions'>>
): Promise<UserProfile> {
  await delay(600);
  const current = MOCK_USERS[userId] || MOCK_USERS[DEMO_USER_ID];
  const updated = { ...current, ...input };
  MOCK_USERS[userId] = updated;
  return updated;
}

export async function uploadAvatar(userId: string, uri: string | null): Promise<UserProfile> {
  await delay(500);
  const current = MOCK_USERS[userId] || MOCK_USERS[DEMO_USER_ID];
  const updated = { ...current, profile_picture: uri };
  MOCK_USERS[userId] = updated;
  return updated;
}
