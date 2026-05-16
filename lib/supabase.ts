import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)?.trim();
const SUPABASE_KEY = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_KEY ?? process.env.SUPABASE_KEY
)? .trim();

if (!SUPABASE_URL) {
  throw new Error('Supabase URL is missing. Set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL in .env.local');
}

if (!SUPABASE_KEY) {
  throw new Error('Supabase key is missing. Set NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_KEY in .env.local');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
  },
});

export default supabase;
