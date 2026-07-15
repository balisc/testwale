/**
 * Next.js instrumentation — runs once when the Node server starts.
 * Validates required production secrets; never logs secret values.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') return;

  const { assertProductionEnv } = await import('@/lib/env');
  assertProductionEnv();
}
