// In-memory holder for the current auth token.
//
// The service layer is intentionally token-less (screens call e.g.
// `discoverGames()` with no token argument), so `apiFetch` reads the bearer
// token from here instead. `session-context` keeps this in sync on hydrate,
// login, and logout, so every authenticated request picks up the right token
// without threading it through every call site.
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}
