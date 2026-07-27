/** Hash fragment keys that must never remain in the browser URL or history. */
export const SENSITIVE_AUTH_HASH_KEYS = [
  'access_token',
  'refresh_token',
  'provider_token',
  'provider_refresh_token',
  'id_token',
  'session_id',
] as const;

export function hashContainsSensitiveAuthKeys(hash: string): boolean {
  if (!hash || hash.length <= 1) return false;
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  return SENSITIVE_AUTH_HASH_KEYS.some((key) => params.has(key));
}

/**
 * Removes a legacy implicit-flow hash without reading or forwarding token values.
 * Returns true when a sensitive hash was scrubbed.
 */
export function scrubSensitiveAuthHash(): boolean {
  if (typeof window === 'undefined') return false;
  if (!hashContainsSensitiveAuthKeys(window.location.hash)) return false;

  const cleanUrl = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState(null, '', cleanUrl);
  return true;
}
