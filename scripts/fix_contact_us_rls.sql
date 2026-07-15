-- Fix RLS + grants for contact_us so the website can insert form submissions.
-- Run in Supabase SQL Editor if contact form save fails.

alter table public.contact_us enable row level security;

grant usage on schema public to anon, authenticated;
grant insert on table public.contact_us to anon, authenticated;

drop policy if exists "Public insert contact_us" on public.contact_us;
drop policy if exists "Allow anon insert contact_us" on public.contact_us;

create policy "Allow anon insert contact_us"
  on public.contact_us
  for insert
  to anon, authenticated
  with check (true);

-- Optional: notify PostgREST to reload schema (Supabase usually picks this up automatically)
notify pgrst, 'reload schema';
