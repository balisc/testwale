import { createClient } from '@supabase/supabase-js';

function getSupabaseUrl() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim() || '')
    .replace(/\/?rest\/v1\/?$/i, '')
    .replace(/\/$/, '');
}

function getServiceRoleKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_KEY?.trim() ||
    ''
  );
}

export function getSupabaseAdmin() {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isSupabaseAdminConfigured() {
  return Boolean(getSupabaseUrl() && getServiceRoleKey());
}
