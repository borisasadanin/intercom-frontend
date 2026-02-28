const TOKEN_KEY = "intercom2_token";
const CLIENT_ID_KEY = "intercom2_clientId";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getClientId(): string | null {
  return localStorage.getItem(CLIENT_ID_KEY);
}

export function setAuth(token: string, clientId: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(CLIENT_ID_KEY, clientId);
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CLIENT_ID_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null && getClientId() !== null;
}
