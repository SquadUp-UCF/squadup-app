// Fake placeholder Ai

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
  };
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  await delay(800); // simulates network latency, so loading states are visible now

  if (password.length < 4) {
    throw new Error('Invalid email or password'); // fake failure, easy to trigger while testing
  }

  return {
    token: 'fake-jwt-token',
    user: { id: 'fake-id', first_name: 'Test', last_name: 'User', email, username: 'testuser' },
  };
}

// src/services/auth.ts — add below the existing login()
import { makeTempUsername } from '@/utils/validation';

export async function register(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  await delay(800);
  return {
    token: 'fake-jwt-token',
    user: {
      id: 'fake-id',
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      username: makeTempUsername(input.firstName, input.lastName),
    },
  };
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