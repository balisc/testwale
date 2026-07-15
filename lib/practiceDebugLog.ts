/**
 * Development-only structured practice logging.
 * Always stringifies to plain JSON so DevTools / capture layers never show `{}`
 * for Error, Response, Map, Set, or objects with undefined-only fields.
 */

export type SerializedError = {
  name?: string | null;
  code: string | null;
  message: string | null;
  details: string | null;
  hint: string | null;
  stack?: string | null;
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Convert thrown / PostgREST errors into a JSON-safe plain object. */
export function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    return {
      name: error.name,
      code: null,
      message: error.message,
      details: null,
      hint: null,
      stack: error.stack ?? null,
    };
  }

  if (isPlainRecord(error)) {
    return {
      name: typeof error.name === 'string' ? error.name : null,
      code: error.code == null ? null : String(error.code),
      message: error.message == null ? null : String(error.message),
      details: error.details == null ? null : String(error.details),
      hint: error.hint == null ? null : String(error.hint),
      stack: typeof error.stack === 'string' ? error.stack : null,
    };
  }

  return {
    code: null,
    message: error == null ? null : String(error),
    details: null,
    hint: null,
  };
}

/** Drop undefined recursively so JSON.stringify never drops keys silently into `{}`. */
export function toJsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, nested) => {
      if (nested instanceof Error) return serializeError(nested);
      if (nested instanceof Map) return Object.fromEntries(nested.entries());
      if (nested instanceof Set) return Array.from(nested.values());
      if (typeof Response !== 'undefined' && nested instanceof Response) {
        return { kind: 'Response', status: nested.status, statusText: nested.statusText };
      }
      if (nested === undefined) return null;
      return nested;
    }),
  ) as T;
}

/** Log a plain JSON line in development only (info — not error, so Next overlay ignores it). */
export function logPracticeDebug(label: string, payload: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'production') return;
  try {
    // Prefer console.info: console.error is treated as an on-screen/runtime "issue" by Next.js.
    console.info(`${label} ${JSON.stringify(toJsonSafe(payload))}`);
  } catch {
    console.info(`${label} {"logError":"failed_to_serialize_payload"}`);
  }
}
