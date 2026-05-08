export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  isAdmin?: boolean;
  avatarUrl?: string | null;
}

export interface AuthSession {
  user: AuthUser;
  apiKey: string;
}

const API_KEY_STORAGE = "medicraft_api_key";
const USER_STORAGE = "medicraft_user";

export function getStoredApiKey() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(API_KEY_STORAGE);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(USER_STORAGE);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthUser;

    return {
      ...parsed,
      avatarUrl: parsed.avatarUrl ?? null,
    };
  } catch {
    return null;
  }
}

export function getAuthSession(): AuthSession | null {
  const apiKey = getStoredApiKey();
  const user = getStoredUser();

  if (!apiKey || !user) return null;

  return { apiKey, user };
}

export function setAuthSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(API_KEY_STORAGE, session.apiKey);
  localStorage.setItem(USER_STORAGE, JSON.stringify(session.user));
  window.dispatchEvent(new Event("medicraft-auth-changed"));
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(API_KEY_STORAGE);
  localStorage.removeItem(USER_STORAGE);
  window.dispatchEvent(new Event("medicraft-auth-changed"));
}
