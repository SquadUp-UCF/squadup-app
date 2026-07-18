// Auth endpoints — POST/PATCH /api/auth/*.
//
// Flow: register (creates a `pending` account) -> send-code -> verify-code
// (activates it). The token from register/login is what the app stores; the
// register token becomes usable once the account is verified/active.
import { apiFetch } from '@/lib/http';
import { setAuthToken } from '@/lib/auth-token';
import { getMe } from './users';
import { makeTempUsername } from '@/utils/validation';
import type { UserProfile } from '@/types/user';

export type AuthResponse = {
  token: string;
  user: UserProfile;
};

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await apiFetch<{ token: string }>('/auth/login', {
    method: 'POST',
    token: null,
    body: { email, password },
  });
  // Set the token so the follow-up /users/me is authenticated; session-context
  // sets/persists it again when the screen calls login().
  setAuthToken(res.token);
  const user = await getMe();
  return { token: res.token, user };
}

export async function register(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  // The API requires a username at registration; the UI collects it later in
  // profile setup, so seed a temporary one now (same as the mock did).
  const username = makeTempUsername(input.firstName, input.lastName);
  const res = await apiFetch<{ token: string; user?: Record<string, any> }>('/auth/register', {
    method: 'POST',
    token: null,
    body: {
      first_name: input.firstName,
      last_name: input.lastName,
      username,
      email: input.email,
      password: input.password,
    },
  });
  // The account is pending until verified, so /users/me isn't available yet —
  // build the profile from what we submitted.
  const user: UserProfile = {
    id: String(res.user?._id ?? res.user?.id ?? ''),
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    username: res.user?.username ?? username,
    profile_picture: null,
    preferred_positions: {},
  };
  return { token: res.token, user };
}

export function sendVerificationCode(email: string): Promise<void> {
  return apiFetch<void>('/auth/send-code', { method: 'POST', token: null, body: { email } });
}

export function verifyCode(email: string, code: string): Promise<void> {
  return apiFetch<void>('/auth/verify-code', {
    method: 'POST',
    token: null,
    body: { email, code },
  });
}

// Resending is just requesting a fresh code; the API enforces a per-email
// cooldown and returns 429 if asked again too soon.
export function resendCode(email: string): Promise<void> {
  return sendVerificationCode(email);
}

export function forgotPassword(email: string): Promise<void> {
  return apiFetch<void>('/auth/forgot-password', {
    method: 'POST',
    token: null,
    body: { email },
  });
}

// Authenticated change. The API stamps password_changed_at, retiring the
// current token — callers log out afterward.
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiFetch<void>('/auth/change-password', {
    method: 'PATCH',
    body: { current_password: currentPassword, new_password: newPassword },
  });
}
