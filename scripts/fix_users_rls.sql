-- Tighten users table RLS: block direct client updates (auth goes through RPC + API)
-- Run once in Supabase SQL Editor AFTER create_users_table.sql

drop policy if exists "Allow anon update users" on public.users;

-- Optional: keep insert blocked too if all signups go through RPC only
-- drop policy if exists "Allow anon insert users" on public.users;

-- If you need to allow insert only via RPC (security definer), revoke direct insert:
-- drop policy if exists "Allow anon insert users" on public.users;
-- create policy "users_no_direct_client_insert"
--   on public.users for insert to anon, authenticated with check (false);

revoke update on table public.users from anon, authenticated;
