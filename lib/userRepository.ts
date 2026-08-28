import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export type DbUser = {
  id: string;
  full_name: string;
  email: string;
  password_hash?: string | null;
  provider: 'email' | 'google';
  google_id?: string | null;
  avatar_url?: string | null;
};

function parseUser(data: unknown): DbUser | null {
  if (!data || typeof data !== 'object') return null;
  const row = data as Record<string, unknown>;
  if (typeof row.id !== 'string' || typeof row.email !== 'string') return null;

  return {
    id: row.id,
    full_name: String(row.full_name ?? ''),
    email: row.email,
    provider: row.provider === 'google' ? 'google' : 'email',
    avatar_url: typeof row.avatar_url === 'string' ? row.avatar_url : null,
  };
}

function mapRpcError(error: unknown) {
  const message = String((error as { message?: string })?.message ?? '');
  const code = String((error as { code?: string })?.code ?? '');

  if (code === '23505' || /duplicate_email/i.test(message)) {
    return { ok: false as const, reason: 'duplicate_email' as const };
  }

  if (/use_google/i.test(message)) {
    return { ok: false as const, reason: 'use_google' as const };
  }

  if (/use_password/i.test(message)) {
    return { ok: false as const, reason: 'use_password' as const };
  }

  if (/Could not find the table|relation .* does not exist|schema cache|function .* does not exist/i.test(message)) {
    return { ok: false as const, reason: 'missing_setup' as const, message };
  }

  if (/row-level security|permission denied|42501/i.test(message)) {
    return { ok: false as const, reason: 'rls_error' as const, message };
  }

  return { ok: false as const, reason: 'unknown' as const, message };
}

export async function createEmailUser(input: {
  full_name: string;
  email: string;
  password: string;
}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false as const, reason: 'missing_setup' as const, message: 'service_role_required' };
  const { data, error } = await admin.rpc('register_email_user', {
    p_full_name: input.full_name,
    p_email: input.email,
    p_password: input.password,
  });

  if (error) {
    return mapRpcError(error);
  }

  const user = parseUser(data);
  if (!user) {
    return { ok: false as const, reason: 'unknown' as const, message: 'Invalid register response.' };
  }

  return { ok: true as const, user };
}

export async function loginEmailUser(input: { email: string; password: string }) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false as const, reason: 'missing_setup' as const, message: 'service_role_required' };
  const { data, error } = await admin.rpc('login_email_user', {
    p_email: input.email,
    p_password: input.password,
  });

  if (error) {
    return mapRpcError(error);
  }

  const user = parseUser(data);
  if (!user) {
    return { ok: false as const, reason: 'invalid_credentials' as const };
  }

  return { ok: true as const, user };
}

export async function upsertGoogleUser(input: {
  full_name: string;
  email: string;
  google_id: string;
  avatar_url?: string | null;
}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false as const, reason: 'missing_setup' as const, message: 'service_role_required' };
  const { data, error } = await admin.rpc('upsert_google_user', {
    p_full_name: input.full_name,
    p_email: input.email,
    p_google_id: input.google_id,
    p_avatar_url: input.avatar_url ?? null,
  });

  if (error) {
    return mapRpcError(error);
  }

  const user = parseUser(data);
  if (!user) {
    return { ok: false as const, reason: 'unknown' as const, message: 'Invalid google upsert response.' };
  }

  return { ok: true as const, user };
}
