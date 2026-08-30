-- QuestionWale consolidated security remediation (2026-08-28, expanded 2026-08-29).
-- Run only AFTER the matching Next.js application has been deployed.
-- Transactional, idempotent, data-preserving, and intentionally secret-free.

begin;
set local lock_timeout = '5s';
set local statement_timeout = '120s';

-- Fail before changing anything when the expected production schema is absent.
do $$
declare
  v_name text;
  v_required_tables constant text[] := array[
    'users', 'contact_us', 'map_locations', 'map_questions',
    'history_questions', 'science_questions', 'polity_questions',
    'economics_questions', 'geography_questions', 'general_knowledge_questions',
    'math_questions', 'current_affairs_questions', 'reasoning_questions',
    'user_profiles', 'user_bookmarks', 'user_notes', 'user_attempts',
    'user_question_attempts', 'question_reports'
  ];
  v_required_functions constant text[] := array[
    'public.register_email_user(text,text,text)',
    'public.login_email_user(text,text)',
    'public.upsert_google_user(text,text,text,text)',
    'public.get_user_profile_page(uuid)',
    'public.submit_question_answer(uuid,uuid,text,integer)',
    'public.get_user_progress_dashboard(uuid)',
    'public.report_question(uuid,uuid,text,text)'
  ];
begin
  foreach v_name in array array['anon', 'authenticated', 'service_role'] loop
    if not exists (select 1 from pg_roles where rolname = v_name) then
      raise exception 'security preflight failed: required Supabase role % is missing', v_name;
    end if;
  end loop;

  foreach v_name in array v_required_tables loop
    if to_regclass(format('public.%I', v_name)) is null then
      raise exception 'security preflight failed: required table public.% is missing', v_name;
    end if;
  end loop;

  foreach v_name in array v_required_functions loop
    if to_regprocedure(v_name) is null then
      raise exception 'security preflight failed: required function % is missing', v_name;
    end if;
  end loop;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'map_locations' and column_name = 'latitude'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'map_locations' and column_name = 'longitude'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'map_questions' and column_name = 'correct_location_id'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'map_questions' and column_name = 'tolerance_km'
  ) then
    raise exception 'security preflight failed: map scoring columns do not match the repository schema';
  end if;

  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = any(v_required_tables)
      and not pg_has_role(current_user, c.relowner, 'MEMBER')
  ) then
    raise exception 'security preflight failed: current role cannot alter every required table';
  end if;
end
$$;

create extension if not exists pgcrypto;

-- Prevent SECURITY DEFINER name shadowing in a browser-writable schema.
revoke create on schema public from public, anon, authenticated;
grant usage on schema public to anon, authenticated, service_role;

-- Revocable sessions. Legacy stateless cookies receive a seven-day transition
-- window and are upgraded by the application during a normal request.
create table if not exists public.user_security_state (
  user_id uuid primary key references public.users(id) on delete cascade,
  sessions_valid_after timestamptz not null default '-infinity'::timestamptz,
  legacy_sessions_accepted_until timestamptz not null default (now() + interval '7 days'),
  updated_at timestamptz not null default now()
);

insert into public.user_security_state (user_id)
select u.id from public.users u
on conflict (user_id) do nothing;

create table if not exists public.app_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  last_rotated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  check (expires_at > created_at)
);
create index if not exists idx_app_sessions_user_active
  on public.app_sessions (user_id, expires_at desc) where revoked_at is null;
create index if not exists idx_app_sessions_expiry on public.app_sessions (expires_at);

-- Existing users remain usable. Backfill only when the column is first added;
-- rerunning this migration must never auto-verify a newly-created account.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users'
      and column_name = 'email_verified_at'
  ) then
    alter table public.users add column email_verified_at timestamptz;
    update public.users set email_verified_at = coalesce(created_at, now());
  end if;
end
$$;

create table if not exists public.password_recovery_tokens (
  user_id uuid primary key references public.users(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  check (expires_at > created_at)
);
create index if not exists idx_password_recovery_expiry
  on public.password_recovery_tokens (expires_at) where used_at is null;

create table if not exists public.email_verification_tokens (
  user_id uuid primary key references public.users(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  check (expires_at > created_at)
);
create index if not exists idx_email_verification_expiry
  on public.email_verification_tokens (expires_at) where used_at is null;

-- Atomic distributed limiter. The application sends HMAC-SHA-256 keys, so no
-- raw IP address or account email is stored.
create table if not exists public.security_rate_limit_buckets (
  key_hash text primary key check (key_hash ~ '^[0-9a-f]{64}$'),
  request_count integer not null check (request_count >= 0),
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);
create index if not exists idx_security_rate_limit_expiry
  on public.security_rate_limit_buckets (reset_at);

create or replace function public.check_security_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table(allowed boolean, remaining integer, retry_after_seconds integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_key text := lower(trim(coalesce(p_key_hash, '')));
  v_now timestamptz := clock_timestamp();
  v_count integer;
  v_reset timestamptz;
begin
  if v_key !~ '^[0-9a-f]{64}$'
     or p_limit is null or p_limit < 1 or p_limit > 10000
     or p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid_rate_limit_input' using errcode = '22023';
  end if;

  if not exists (select 1 from public.security_rate_limit_buckets b where b.key_hash = v_key) then
    perform pg_advisory_xact_lock(hashtext('questionwale.security_rate_limit_buckets'));
    with expired as (
      select b.key_hash from public.security_rate_limit_buckets b
      where b.reset_at < v_now - interval '1 minute'
      order by b.reset_at limit 1000
    )
    delete from public.security_rate_limit_buckets b using expired e
    where b.key_hash = e.key_hash;

    if (select count(*) from public.security_rate_limit_buckets) >= 100000 then
      v_key := encode(
        digest('overflow:' || p_limit::text || ':' || p_window_seconds::text, 'sha256'),
        'hex'
      );
    end if;
  end if;

  insert into public.security_rate_limit_buckets as b
    (key_hash, request_count, reset_at, updated_at)
  values (v_key, 1, v_now + make_interval(secs => p_window_seconds), v_now)
  on conflict (key_hash) do update
  set request_count = case when b.reset_at <= v_now then 1 else least(b.request_count + 1, p_limit + 1) end,
      reset_at = case when b.reset_at <= v_now then v_now + make_interval(secs => p_window_seconds) else b.reset_at end,
      updated_at = v_now
  returning b.request_count, b.reset_at into v_count, v_reset;

  allowed := v_count <= p_limit;
  remaining := greatest(0, p_limit - v_count);
  retry_after_seconds := case
    when allowed then 0
    else greatest(1, ceil(extract(epoch from (v_reset - v_now)))::integer)
  end;
  reset_at := v_reset;
  return next;
end
$$;

-- Password changes/recovery revoke every existing session atomically.
create or replace function public.change_email_user_password(
  p_user_id uuid, p_current_password text, p_new_password text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_hash text;
  v_provider text;
begin
  if p_user_id is null or p_new_password is null
     or char_length(p_new_password) < 8 or char_length(p_new_password) > 128
     or p_new_password !~ '[A-Za-z]' or p_new_password !~ '[0-9]' then
    raise exception 'invalid_password' using errcode = '22023';
  end if;

  select u.password_hash, u.provider into v_hash, v_provider
  from public.users u where u.id = p_user_id for update;
  if not found or v_provider <> 'email' or v_hash is null
     or v_hash <> crypt(coalesce(p_current_password, ''), v_hash) then
    return false;
  end if;

  update public.users set password_hash = crypt(p_new_password, gen_salt('bf'))
  where id = p_user_id;
  update public.app_sessions set revoked_at = now()
  where user_id = p_user_id and revoked_at is null;
  insert into public.user_security_state
    (user_id, sessions_valid_after, legacy_sessions_accepted_until, updated_at)
  values (p_user_id, now(), now(), now())
  on conflict (user_id) do update
  set sessions_valid_after = excluded.sessions_valid_after,
      legacy_sessions_accepted_until = excluded.legacy_sessions_accepted_until,
      updated_at = excluded.updated_at;
  return true;
end
$$;

create or replace function public.consume_password_recovery_token(
  p_token_hash text, p_new_password text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_user_id uuid;
begin
  if lower(trim(coalesce(p_token_hash, ''))) !~ '^[0-9a-f]{64}$'
     or p_new_password is null
     or char_length(p_new_password) < 8 or char_length(p_new_password) > 128
     or p_new_password !~ '[A-Za-z]' or p_new_password !~ '[0-9]' then
    raise exception 'invalid_recovery_input' using errcode = '22023';
  end if;

  select t.user_id into v_user_id from public.password_recovery_tokens t
  where t.token_hash = lower(trim(p_token_hash)) and t.used_at is null and t.expires_at > now()
  for update;
  if not found then return null; end if;

  update public.password_recovery_tokens set used_at = now() where user_id = v_user_id;
  update public.users set password_hash = crypt(p_new_password, gen_salt('bf'))
  where id = v_user_id and provider = 'email';
  if not found then return null; end if;

  update public.app_sessions set revoked_at = now()
  where user_id = v_user_id and revoked_at is null;
  insert into public.user_security_state
    (user_id, sessions_valid_after, legacy_sessions_accepted_until, updated_at)
  values (v_user_id, now(), now(), now())
  on conflict (user_id) do update
  set sessions_valid_after = excluded.sessions_valid_after,
      legacy_sessions_accepted_until = excluded.legacy_sessions_accepted_until,
      updated_at = excluded.updated_at;
  return v_user_id;
end
$$;

create or replace function public.consume_email_verification_token(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_user_id uuid;
begin
  if lower(trim(coalesce(p_token_hash, ''))) !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_verification_input' using errcode = '22023';
  end if;
  select t.user_id into v_user_id from public.email_verification_tokens t
  where t.token_hash = lower(trim(p_token_hash)) and t.used_at is null and t.expires_at > now()
  for update;
  if not found then return null; end if;
  update public.email_verification_tokens set used_at = now() where user_id = v_user_id;
  update public.users set email_verified_at = now() where id = v_user_id;
  return v_user_id;
end
$$;

-- Least privilege for every sensitive table/view, including optional objects
-- introduced by later QuestionWale migrations when present.
do $$
declare
  v_name text;
  v_tables constant text[] := array[
    'users', 'contact_us', 'map_locations', 'map_questions',
    'history_questions', 'science_questions', 'polity_questions',
    'economics_questions', 'geography_questions', 'general_knowledge_questions',
    'math_questions', 'current_affairs_questions', 'reasoning_questions',
    'user_profiles', 'user_bookmarks', 'user_notes', 'user_attempts',
    'user_question_attempts', 'question_reports', 'user_practice_scope_state',
    'user_exam_preferences', 'question_exam_profile_mappings', 'practice_server_secrets',
    'user_security_state', 'app_sessions', 'password_recovery_tokens',
    'email_verification_tokens', 'security_rate_limit_buckets'
  ];
  v_views constant text[] := array[
    'user_subject_progress', 'user_topic_progress', 'user_subtopic_progress'
  ];
begin
  foreach v_name in array v_tables loop
    if to_regclass(format('public.%I', v_name)) is not null then
      execute format('alter table public.%I enable row level security', v_name);
      execute format('revoke all privileges on table public.%I from public, anon, authenticated', v_name);
      execute format('grant select, insert, update, delete on table public.%I to service_role', v_name);
    end if;
  end loop;
  foreach v_name in array v_views loop
    if to_regclass(format('public.%I', v_name)) is not null then
      execute format('revoke all privileges on table public.%I from public, anon, authenticated', v_name);
      execute format('grant select on table public.%I to service_role', v_name);
    end if;
  end loop;
end
$$;

drop policy if exists "Allow anon insert users" on public.users;
drop policy if exists "Allow anon update users" on public.users;
drop policy if exists "Public insert contact_us" on public.contact_us;
drop policy if exists "Allow anon insert contact_us" on public.contact_us;
drop policy if exists "Public read map_locations" on public.map_locations;
drop policy if exists "Public read map_questions" on public.map_questions;

-- Cover exact overloads in the live schema without guessing signatures.
do $$
declare
  v_function record;
begin
  for v_function in
    select p.oid::regprocedure as signature
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef is true
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', v_function.signature);
    execute format('grant execute on function %s to service_role', v_function.signature);
    execute format('alter function %s set search_path = pg_catalog, public, pg_temp', v_function.signature);
  end loop;
end
$$;

notify pgrst, 'reload schema';
commit;
