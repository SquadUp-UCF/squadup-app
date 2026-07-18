// Thin fetch wrapper for the SquadUp API.
//
// - Prefixes the configured API base URL.
// - Attaches the current bearer token automatically (from auth-token), so the
//   service layer can stay token-less; pass `token` to override for a call.
// - Sends/parses JSON, or a multipart FormData body when `multipart` is set
//   (used for avatar upload — the boundary Content-Type is left to fetch).
// - Turns NestJS error responses ({ statusCode, message, error }, where
//   `message` may be a string or an array of validation messages) into a
//   single `ApiError` the UI can display.
import { API_BASE_URL } from './api-config';
import { getAuthToken } from './auth-token';

/** Error carrying the HTTP status (0 = network/unreachable) and a display message. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type QueryValue = string | number | boolean | undefined;

type ApiFetchOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  // Override the stored auth token for this call. `null` sends no token.
  token?: string | null;
  query?: Record<string, QueryValue>;
  // When true, `body` is sent as-is (a FormData) without JSON encoding.
  multipart?: boolean;
};

/** Reduce a NestJS error body to one human-readable line. */
function extractErrorMessage(data: unknown, status: number): string {
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object') {
    const message = (data as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join('\n');
    if (typeof message === 'string' && message.trim()) return message;
    const error = (data as { error?: unknown }).error;
    if (typeof error === 'string' && error.trim()) return error;
  }
  return `Request failed (${status})`;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = `${API_BASE_URL}${path}`;
  if (!query) return url;
  const params = Object.entries(query)
    .filter(([, value]) => value !== undefined)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    );
  return params.length ? `${url}?${params.join('&')}` : url;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { method = 'GET', body, query, multipart = false } = options;
  // Explicit `token` (including null) overrides the stored one.
  const token = 'token' in options ? options.token : getAuthToken();

  const headers: Record<string, string> = {};
  if (body !== undefined && !multipart) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : multipart
            ? (body as BodyInit)
            : JSON.stringify(body),
    });
  } catch {
    // DNS/connection failure — server down, wrong host, or no connectivity.
    throw new ApiError(
      'Could not reach the server. Check your connection and that the API is running.',
      0,
    );
  }

  // 204 No Content (e.g. DELETE /users/me) has no body to parse.
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let data: unknown;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text; // Non-JSON body (e.g. an HTML error page).
    }
  }

  if (!response.ok) {
    throw new ApiError(extractErrorMessage(data, response.status), response.status);
  }

  return data as T;
}
