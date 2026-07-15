import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim();
const SUPABASE_URL = rawSupabaseUrl?.replace(/\/?rest\/v1\/?$/i, '').replace(/\/$/, '');
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  process.env.SUPABASE_ANON_KEY?.trim();

const SUPABASE_AVAILABLE = Boolean(SUPABASE_URL && SUPABASE_KEY);

function createNoopQuery() {
  const fallback = {
    data: null,
    error: { message: 'Supabase is not configured in this environment.' },
  };

  const noOp: any = {
    select: () => noOp,
    order: () => noOp,
    not: () => noOp,
    is: () => noOp,
    eq: () => noOp,
    in: () => noOp,
    contains: () => noOp,
    filter: () => noOp,
    single: () => noOp,
    maybeSingle: () => noOp,
    limit: () => noOp,
    or: () => noOp,
    group: () => noOp,
    then(onFulfilled: any) {
      return Promise.resolve(fallback).then(onFulfilled);
    },
    catch(onRejected: any) {
      return Promise.resolve(fallback).catch(onRejected);
    },
  };

  return noOp;
}

const supabase: any = SUPABASE_AVAILABLE
  ? createClient(SUPABASE_URL!, SUPABASE_KEY!, {
      auth: {
        persistSession: false,
      },
    })
  : {
      from: () => createNoopQuery(),
    };

if (!SUPABASE_AVAILABLE) {
  console.warn('Supabase is not configured. Falling back to local JSON and preventing runtime errors.');
}

export default supabase;
export { SUPABASE_AVAILABLE, SUPABASE_URL };

/** Hostname only — safe for development logs (never log keys). */
export function getSupabaseHostname(): string | null {
  if (!SUPABASE_URL) return null;
  try {
    return new URL(SUPABASE_URL).hostname;
  } catch {
    return null;
  }
}
