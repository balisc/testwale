-- Users table for QuestionWale sign-up (email + Google)
-- Run once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 80),
  email text not null unique check (char_length(email) between 5 and 254),
  password_hash text,
  provider text not null check (provider in ('email', 'google')),
  google_id text unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  constraint users_password_for_email check (
    provider <> 'email' or password_hash is not null
  )
);

create index if not exists idx_users_email on public.users (email);
create index if not exists idx_users_provider on public.users (provider);
create index if not exists idx_users_created_at on public.users (created_at desc);

alter table public.users enable row level security;

grant usage on schema public to anon, authenticated;
grant insert, update on table public.users to anon, authenticated;

drop policy if exists "Allow anon insert users" on public.users;
drop policy if exists "Allow anon update users" on public.users;

create policy "Allow anon insert users"
  on public.users
  for insert
  to anon, authenticated
  with check (true);

create policy "Allow anon update users"
  on public.users
  for update
  to anon, authenticated
  using (true)
  with check (true);
