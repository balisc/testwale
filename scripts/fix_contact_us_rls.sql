-- Restrict contact submissions to the server-side application client.
-- Run in Supabase SQL Editor if contact form save fails.

alter table public.contact_us enable row level security;

revoke all privileges on table public.contact_us from anon, authenticated;
grant select, insert, update, delete on table public.contact_us to service_role;

drop policy if exists "Public insert contact_us" on public.contact_us;
drop policy if exists "Allow anon insert contact_us" on public.contact_us;

-- Optional: notify PostgREST to reload schema (Supabase usually picks this up automatically)
notify pgrst, 'reload schema';
