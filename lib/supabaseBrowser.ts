'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (typeof window === 'undefined') return null;

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
    .trim()
    .replace(/\/$/, '');
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

  if (!url || !key) return null;

  if (!browserClient) {
    browserClient = createBrowserClient(url, key, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: false,
      },
    });
  }

  return browserClient;
}

export function isSupabaseBrowserConfigured() {
  return Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim() &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim(),
  );
}
