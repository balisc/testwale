import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
const SUPABASE_KEY = process.env.SUPABASE_KEY?.trim();

if (!SUPABASE_URL) {
  throw new Error('SUPABASE_URL is missing in .env.local');
}

if (!SUPABASE_KEY) {
  throw new Error('SUPABASE_KEY is missing in .env.local');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
  },
});

export default supabase;
