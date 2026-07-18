// Resolves where the SquadUp API lives.
//
// Priority:
//   1. EXPO_PUBLIC_API_URL — an explicit override, e.g. https://squad-up-ucf.net
//      (the `/api` suffix is optional; it's normalized either way). Set this for
//      staging/production or when the auto-detected host is wrong.
//   2. Auto-detected dev host — derived from Expo's Metro `hostUri` so a
//      physical device or emulator reaches the API on the same LAN without
//      hardcoding an IP.
//   3. localhost fallback (simulators / web).
//
// This backend serves every route under `/api`, but serves static media
// (sport banners at `/sports/...`, avatars at `/uploads/...`) at the server
// root — so we track both the bare origin and the `/api` base.
//
// NOTE: EXPO_PUBLIC_* vars are inlined at bundle time. After changing .env you
// must restart Metro with a cleared cache (`npx expo start -c`).
import Constants from 'expo-constants';

const DEFAULT_API_PORT = 5000;

/** Extract the dev machine host from Expo's Metro host, e.g. "192.168.1.50:8081" -> "192.168.1.50". */
function devHost(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0];
  }
  return 'localhost';
}

/**
 * Server origin without the `/api` prefix — where static media is served.
 * The override is accepted with or without a trailing `/api`; we strip it here
 * and re-append it for `API_BASE_URL`, so both forms resolve identically.
 */
export const SERVER_BASE_URL: string = (() => {
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override) {
    return override.replace(/\/+$/, '').replace(/\/api$/, '');
  }
  return `http://${devHost()}:${DEFAULT_API_PORT}`;
})();

/** Base URL for API routes (this backend serves everything under `/api`). */
export const API_BASE_URL: string = `${SERVER_BASE_URL}/api`;

/**
 * Resolve a server-relative media path (e.g. "/sports/soccer.jpg",
 * "/uploads/avatars/x.jpg") to an absolute URL. Absolute URLs and empty values
 * pass through unchanged.
 *
 * Media is resolved under the `/api` base, not the bare origin: in production a
 * reverse proxy only forwards `/api/*` to the API, so the API serves these
 * assets under `/api/sports` and `/api/uploads` too (see squadup-api main.ts).
 */
export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
