'use client';

type CacheEntry = {
  value: unknown;
  updatedAt: number;
};

type JsonRequestOptions = {
  maxAgeMs?: number;
  force?: boolean;
  init?: RequestInit;
};

const values = new Map<string, CacheEntry>();
const requests = new Map<string, Promise<unknown>>();
let clearListenerInstalled = false;
const STORAGE_PREFIX = 'questionwale:request-cache:';
const PERSISTED_PREFIXES = [
  'learning-dashboard:',
  'profile:',
  'profile-insights:',
  'profile-activity:',
  'profile-saved:',
  'profile-goals:',
] as const;

function shouldPersist(key: string): boolean {
  return key !== 'learning-dashboard:session'
    && PERSISTED_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function readStoredEntry(key: string): CacheEntry | null {
  if (typeof window === 'undefined' || !shouldPersist(key)) return null;
  try {
    const raw = window.sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CacheEntry>;
    if (!('value' in parsed) || typeof parsed.updatedAt !== 'number') return null;
    const entry = { value: parsed.value, updatedAt: parsed.updatedAt } satisfies CacheEntry;
    values.set(key, entry);
    return entry;
  } catch {
    return null;
  }
}

function persistEntry(key: string, entry: CacheEntry): void {
  if (typeof window === 'undefined' || !shouldPersist(key)) return;
  try {
    window.sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry));
  } catch {
    // Memory caching remains available when storage is full or disabled.
  }
}

function removeStoredEntries(prefix?: string): void {
  if (typeof window === 'undefined') return;
  try {
    for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
      const storageKey = window.sessionStorage.key(index);
      if (!storageKey?.startsWith(STORAGE_PREFIX)) continue;
      const cacheKey = storageKey.slice(STORAGE_PREFIX.length);
      if (!prefix || cacheKey.startsWith(prefix)) {
        window.sessionStorage.removeItem(storageKey);
      }
    }
  } catch {
    // Storage is an optional acceleration layer.
  }
}

export class ClientJsonError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown) {
    super(`request_failed:${status}`);
    this.name = 'ClientJsonError';
    this.status = status;
    this.payload = payload;
  }
}

function installClearListener() {
  if (typeof window === 'undefined' || clearListenerInstalled) return;
  clearListenerInstalled = true;
  window.addEventListener('questionwale:clear-user-caches', () => {
    values.clear();
    requests.clear();
    removeStoredEntries();
  });
}

export function readClientCache<T>(key: string): T | null {
  installClearListener();
  return ((values.get(key) ?? readStoredEntry(key))?.value as T | undefined) ?? null;
}

export function isClientCacheFresh(key: string, maxAgeMs: number): boolean {
  const entry = values.get(key) ?? readStoredEntry(key);
  return Boolean(entry && Date.now() - entry.updatedAt <= maxAgeMs);
}

export function writeClientCache<T>(key: string, value: T): void {
  installClearListener();
  const entry = { value, updatedAt: Date.now() } satisfies CacheEntry;
  values.set(key, entry);
  persistEntry(key, entry);
}

/** Keep the last value for an instant paint, but force the next read to refresh it. */
export function expireClientCache(prefix: string): void {
  installClearListener();
  for (const [key, entry] of values) {
    if (!key.startsWith(prefix)) continue;
    const expired = { ...entry, updatedAt: 0 } satisfies CacheEntry;
    values.set(key, expired);
    persistEntry(key, expired);
  }

  if (typeof window === 'undefined') return;
  try {
    for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
      const storageKey = window.sessionStorage.key(index);
      if (!storageKey?.startsWith(`${STORAGE_PREFIX}${prefix}`)) continue;
      const key = storageKey.slice(STORAGE_PREFIX.length);
      const entry = values.get(key) ?? readStoredEntry(key);
      if (!entry) continue;
      const expired = { ...entry, updatedAt: 0 } satisfies CacheEntry;
      values.set(key, expired);
      persistEntry(key, expired);
    }
  } catch {
    // Memory expiration still applies.
  }
}

export function clearClientCache(prefix?: string): void {
  installClearListener();
  if (!prefix) {
    values.clear();
    requests.clear();
    removeStoredEntries();
    return;
  }

  for (const key of values.keys()) {
    if (key.startsWith(prefix)) values.delete(key);
  }
  for (const key of requests.keys()) {
    if (key.startsWith(prefix)) requests.delete(key);
  }
  removeStoredEntries(prefix);
}

export async function fetchClientJson<T>(
  key: string,
  url: string,
  options: JsonRequestOptions = {},
): Promise<T> {
  installClearListener();
  const maxAgeMs = options.maxAgeMs ?? 60_000;
  const cached = values.get(key) ?? readStoredEntry(key);
  if (!options.force && cached && Date.now() - cached.updatedAt <= maxAgeMs) {
    return cached.value as T;
  }

  const existing = requests.get(key);
  if (existing) return existing as Promise<T>;

  const request = (async () => {
    const response = await fetch(url, {
      cache: 'no-store',
      credentials: 'include',
      ...options.init,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new ClientJsonError(response.status, payload);
    const entry = { value: payload, updatedAt: Date.now() } satisfies CacheEntry;
    values.set(key, entry);
    persistEntry(key, entry);
    return payload as T;
  })();

  requests.set(key, request);
  try {
    return await request;
  } finally {
    if (requests.get(key) === request) requests.delete(key);
  }
}
