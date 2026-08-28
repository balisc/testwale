-- Tighten users table RLS: block direct client updates (auth goes through RPC + API)
-- Run once in Supabase SQL Editor AFTER create_users_table.sql

drop policy if exists "Allow anon update users" on public.users;
drop policy if exists "Allow anon insert users" on public.users;
revoke all privileges on table public.users from anon, authenticated;
grant select, insert, update, delete on table public.users to service_role;
