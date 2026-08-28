-- Server-only auth RPC functions for QuestionWale.
-- Run in Supabase SQL Editor after create_users_table.sql

create extension if not exists pgcrypto;

create or replace function public.register_email_user(
  p_full_name text,
  p_email text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row users%rowtype;
begin
  insert into public.users (full_name, email, password_hash, provider)
  values (
    trim(p_full_name),
    lower(trim(p_email)),
    crypt(p_password, gen_salt('bf')),
    'email'
  )
  returning * into v_row;

  return jsonb_build_object(
    'id', v_row.id,
    'full_name', v_row.full_name,
    'email', v_row.email,
    'provider', v_row.provider,
    'avatar_url', v_row.avatar_url
  );
exception
  when unique_violation then
    raise exception 'duplicate_email' using errcode = '23505';
end;
$$;

create or replace function public.login_email_user(
  p_email text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row users%rowtype;
begin
  select *
  into v_row
  from public.users
  where email = lower(trim(p_email))
  limit 1;

  if not found then
    return null;
  end if;

  if v_row.provider <> 'email' or v_row.password_hash is null then
    raise exception 'use_google' using errcode = 'P0001';
  end if;

  if v_row.password_hash <> crypt(p_password, v_row.password_hash) then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_row.id,
    'full_name', v_row.full_name,
    'email', v_row.email,
    'provider', v_row.provider,
    'avatar_url', v_row.avatar_url
  );
end;
$$;

create or replace function public.upsert_google_user(
  p_full_name text,
  p_email text,
  p_google_id text,
  p_avatar_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing users%rowtype;
  v_row users%rowtype;
begin
  select *
  into v_existing
  from public.users
  where email = lower(trim(p_email))
  limit 1;

  if found and v_existing.provider = 'email' then
    raise exception 'use_password' using errcode = 'P0001';
  end if;

  insert into public.users (full_name, email, password_hash, provider, google_id, avatar_url)
  values (
    trim(p_full_name),
    lower(trim(p_email)),
    null,
    'google',
    p_google_id,
    p_avatar_url
  )
  on conflict (email) do update
  set
    full_name = excluded.full_name,
    provider = 'google',
    google_id = excluded.google_id,
    avatar_url = excluded.avatar_url
  returning * into v_row;

  return jsonb_build_object(
    'id', v_row.id,
    'full_name', v_row.full_name,
    'email', v_row.email,
    'provider', v_row.provider,
    'avatar_url', v_row.avatar_url
  );
end;
$$;

revoke all on function public.register_email_user(text, text, text) from public;
revoke all on function public.login_email_user(text, text) from public;
revoke all on function public.upsert_google_user(text, text, text, text) from public;
revoke all on function public.register_email_user(text, text, text) from anon, authenticated;
revoke all on function public.login_email_user(text, text) from anon, authenticated;
revoke all on function public.upsert_google_user(text, text, text, text) from anon, authenticated;

grant execute on function public.register_email_user(text, text, text) to service_role;
grant execute on function public.login_email_user(text, text) to service_role;
grant execute on function public.upsert_google_user(text, text, text, text) to service_role;
