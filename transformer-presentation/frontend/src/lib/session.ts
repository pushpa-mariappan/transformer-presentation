/** Participant identity persisted in the browser so a refresh or reconnect resumes the same session. */
export interface StoredSession {
  id: string;
  username: string;
  token: string;
}

const KEY = "transformer-presentation.session";
const PRESENTER_KEY = "transformer-presentation.presenter-key";

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode) – session lasts for this tab only */
  }
}

export function loadSession(): StoredSession | null {
  const raw = safeGet(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredSession;
    return parsed.token ? parsed : null;
  } catch {
    return null;
  }
}

export const saveSession = (s: StoredSession) => safeSet(KEY, JSON.stringify(s));
export const clearSession = () => safeSet(KEY, null);
export const loadPresenterKey = () => safeGet(PRESENTER_KEY);
export const savePresenterKey = (k: string | null) => safeSet(PRESENTER_KEY, k);

export async function joinPresentation(username: string): Promise<StoredSession> {
  const res = await fetch("/api/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = (body as { detail?: unknown }).detail;
    throw new Error(typeof detail === "string" ? detail : "Could not join. Please try another name.");
  }
  return (await res.json()) as StoredSession;
}

export async function presenterLogin(key: string): Promise<boolean> {
  const res = await fetch("/api/presenter/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });
  return res.ok;
}
