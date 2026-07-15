-- QuestionWale practice: user attempts + question reports
-- Run in Supabase SQL Editor AFTER create_users_table.sql
-- Note: This project uses public.users (custom auth), not auth.users.

-- ---------------------------------------------------------------------------
-- user_attempts
-- ---------------------------------------------------------------------------
create table if not exists public.user_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_option text not null check (selected_option in ('A', 'B', 'C', 'D')),
  is_correct boolean not null,
  attempted_at timestamptz not null default now(),
  time_taken_seconds integer check (time_taken_seconds is null or time_taken_seconds >= 0),
  subject_id uuid,
  topic_id uuid,
  subtopic_id uuid,
  constraint user_attempts_user_question_unique unique (user_id, question_id)
);

create index if not exists idx_user_attempts_user_id
  on public.user_attempts (user_id);

create index if not exists idx_user_attempts_question_id
  on public.user_attempts (question_id);

create index if not exists idx_user_attempts_user_subject
  on public.user_attempts (user_id, subject_id);

create index if not exists idx_user_attempts_user_topic
  on public.user_attempts (user_id, topic_id);

-- ---------------------------------------------------------------------------
-- question_reports
-- ---------------------------------------------------------------------------
create table if not exists public.question_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  reason text not null check (
    reason in (
      'Wrong answer',
      'Incorrect explanation',
      'Translation issue',
      'Duplicate question',
      'Typing error',
      'Other'
    )
  ),
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  constraint question_reports_user_question_unique unique (user_id, question_id)
);

create index if not exists idx_question_reports_question_id
  on public.question_reports (question_id);

create index if not exists idx_question_reports_user_id
  on public.question_reports (user_id);

-- ---------------------------------------------------------------------------
-- questions helper indexes (safe if table already exists)
-- ---------------------------------------------------------------------------
create index if not exists idx_questions_subject_topic_subtopic
  on public.questions (subject_id, topic_id, subtopic_id);

create index if not exists idx_questions_active_verified
  on public.questions (is_active, is_verified);

-- Ensure counter columns exist (no-op if already present)
alter table public.questions
  add column if not exists attempt_count integer not null default 0;

alter table public.questions
  add column if not exists correct_count integer not null default 0;

alter table public.questions
  add column if not exists report_count integer not null default 0;

alter table public.questions
  add column if not exists is_verified boolean not null default false;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.user_attempts enable row level security;
alter table public.question_reports enable row level security;

-- Deny direct client writes; API uses service role after cookie session check.
drop policy if exists "user_attempts_select_own" on public.user_attempts;
create policy "user_attempts_select_own"
  on public.user_attempts
  for select
  to authenticated
  using (false);

drop policy if exists "user_attempts_insert_own" on public.user_attempts;
create policy "user_attempts_insert_own"
  on public.user_attempts
  for insert
  to authenticated
  with check (false);

drop policy if exists "user_attempts_update_none" on public.user_attempts;
create policy "user_attempts_update_none"
  on public.user_attempts
  for update
  to authenticated
  using (false);

drop policy if exists "question_reports_select_own" on public.question_reports;
create policy "question_reports_select_own"
  on public.question_reports
  for select
  to authenticated
  using (false);

drop policy if exists "question_reports_insert_own" on public.question_reports;
create policy "question_reports_insert_own"
  on public.question_reports
  for insert
  to authenticated
  with check (false);

-- questions: public may read active + verified only; no direct counter updates
alter table public.questions enable row level security;

drop policy if exists "questions_public_read_active_verified" on public.questions;
create policy "questions_public_read_active_verified"
  on public.questions
  for select
  to anon, authenticated
  using (is_active = true and is_verified = true);

drop policy if exists "questions_no_client_update" on public.questions;
create policy "questions_no_client_update"
  on public.questions
  for update
  to anon, authenticated
  using (false);

drop policy if exists "questions_no_client_insert" on public.questions;
create policy "questions_no_client_insert"
  on public.questions
  for insert
  to anon, authenticated
  with check (false);

drop policy if exists "questions_no_client_delete" on public.questions;
create policy "questions_no_client_delete"
  on public.questions
  for delete
  to anon, authenticated
  using (false);
