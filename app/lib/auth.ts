// Client-side authentication utilities for localStorage session management

export type User = {
  id: string;
  email: string;
};

type StoredSession = {
  user: User;
  timestamp: number;
};

const SESSION_KEY = 'product_mirror_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Retrieves the stored session from localStorage
 * Returns null if no session exists or if session is expired
 */
export function getStoredSession(): User | null {
  if (typeof window === 'undefined') return null;

  const sessionData = localStorage.getItem(SESSION_KEY);
  if (!sessionData) return null;

  try {
    const data: StoredSession = JSON.parse(sessionData);

    // Check if session is expired
    if (Date.now() - data.timestamp > SESSION_DURATION) {
      clearSession();
      return null;
    }

    return data.user;
  } catch {
    // Invalid session data
    clearSession();
    return null;
  }
}

/**
 * Stores a new session in localStorage
 */
export function setSession(user: User): void {
  if (typeof window === 'undefined') return;

  const sessionData: StoredSession = {
    user,
    timestamp: Date.now()
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
}

/**
 * Clears the session from localStorage
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(SESSION_KEY);
}
