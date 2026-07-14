// Fake placeholder Ai to simulate backend
// will later be replaced with real backend/api
import { makeTempUsername } from '@/utils/validation';
import { DEMO_USER_ID, MOCK_USERS } from './users';
import type { UserProfile } from '@/types/user';

export type AuthResponse = {
  token: string;
  user: UserProfile;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  await delay(800); // simulates network latency, so loading states are visible now

  if (password.length < 4) {
    throw new Error('Invalid email or password'); // fake failure, easy to trigger while testing
  }

  const user = { ...MOCK_USERS[DEMO_USER_ID], email };
  MOCK_USERS[DEMO_USER_ID] = user;
  return { token: 'fake-jwt-token', user };
}

export async function register(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  await delay(800);
  const user: UserProfile = {
    id: DEMO_USER_ID,
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    username: makeTempUsername(input.firstName, input.lastName),
    profile_picture: null,
    preferred_positions: {},
  };
  MOCK_USERS[DEMO_USER_ID] = user;
  return { token: 'fake-jwt-token', user };
}

export async function sendVerificationCode(email: string): Promise<void> {
  await delay(500); // fake: pretend an email was sent
}

export async function verifyCode(email: string, code: string): Promise<void> {
  await delay(600);
  if (code !== '123456') {
    throw new Error('Invalid code'); // fake failure — use "123456" to succeed while testing
  }
}

export async function resendCode(email: string): Promise<void> {
  await delay(400);
}

// Always "succeeds" with a generic message, mirroring the web backend's
// behavior of not revealing whether an email is registered.
export async function forgotPassword(email: string): Promise<void> {
  await delay(600);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await delay(700);
  if (currentPassword.length < 4) {
    throw new Error('Current password is incorrect');
  }
}
