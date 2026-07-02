-- Contact form submissions for QuestionWale (Supabase / PostgreSQL)
-- Run once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.contact_us (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (char_length(email) between 5 and 254),
  mobile text not null check (mobile ~ '^[6-9][0-9]{9}$'),
  subject text not null check (char_length(subject) between 3 and 150),
  message text not null check (char_length(message) between 10 and 2000),
  category text check (
    category is null
    or category in (
      'Technical Issue',
      'General Support',
      'Account Issue',
      'Topic Request',
      'Suggestion',
      'Other'
    )
  ),
  status text not null default 'new' check (status in ('new', 'read', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists idx_contact_us_created_at
  on public.contact_us (created_at desc);

create index if not exists idx_contact_us_status
  on public.contact_us (status);

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
