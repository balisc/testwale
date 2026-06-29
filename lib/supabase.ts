import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)?.trim();
const SUPABASE_URL = rawSupabaseUrl?.replace(/\/?rest\/v1\/?$/i, '').replace(/\/$/, '');
const SUPABASE_KEY = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_KEY ??
  process.env.SUPABASE_KEY ??
  process.env.SUPABASE_ANON_KEY
)?.trim();

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
    filter: () => noOp,
    single: () => noOp,
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
export { SUPABASE_AVAILABLE };
