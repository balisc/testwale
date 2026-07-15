-- QuestionWale: practice counters migration (run once in Supabase SQL Editor)
-- Order: 1) this file's table section if tables missing, 2) RPC section at bottom
-- Requires: public.users, public.questions tables already exist

-- ===========================================================================
-- TABLES (safe to re-run)
-- ===========================================================================

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

create index if not exists idx_user_attempts_user_id on public.user_attempts (user_id);
create index if not exists idx_user_attempts_question_id on public.user_attempts (question_id);

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

create index if not exists idx_question_reports_question_id on public.question_reports (question_id);
create index if not exists idx_question_reports_user_id on public.question_reports (user_id);

alter table public.questions add column if not exists attempt_count integer not null default 0;
alter table public.questions add column if not exists correct_count integer not null default 0;
alter table public.questions add column if not exists report_count integer not null default 0;

-- Backfill null counters on existing rows
update public.questions set attempt_count = 0 where attempt_count is null;
update public.questions set correct_count = 0 where correct_count is null;
update public.questions set report_count = 0 where report_count is null;

-- ===========================================================================
-- RLS (block direct client counter updates; API uses service role + RPC)
-- ===========================================================================

alter table public.user_attempts enable row level security;
alter table public.question_reports enable row level security;
alter table public.questions enable row level security;

drop policy if exists "user_attempts_select_own" on public.user_attempts;
create policy "user_attempts_select_own" on public.user_attempts for select to authenticated using (false);

drop policy if exists "user_attempts_insert_own" on public.user_attempts;
create policy "user_attempts_insert_own" on public.user_attempts for insert to authenticated with check (false);

drop policy if exists "question_reports_select_own" on public.question_reports;
create policy "question_reports_select_own" on public.question_reports for select to authenticated using (false);

drop policy if exists "question_reports_insert_own" on public.question_reports;
create policy "question_reports_insert_own" on public.question_reports for insert to authenticated with check (false);

drop policy if exists "questions_public_read_active_verified" on public.questions;
create policy "questions_public_read_active_verified"
  on public.questions for select to anon, authenticated
  using (is_active = true and is_verified = true);

drop policy if exists "questions_no_client_update" on public.questions;
create policy "questions_no_client_update" on public.questions for update to anon, authenticated using (false);

drop policy if exists "questions_no_client_insert" on public.questions;
create policy "questions_no_client_insert" on public.questions for insert to anon, authenticated with check (false);

drop policy if exists "questions_no_client_delete" on public.questions;
create policy "questions_no_client_delete" on public.questions for delete to anon, authenticated using (false);

-- ===========================================================================
-- RPC: submit_question_answer + report_question
-- Custom auth: p_user_id from public.users (cookie session verified in Next.js API)
-- ===========================================================================

create or replace function public.submit_question_answer(
  p_user_id uuid,
  p_question_id uuid,
  p_selected_option text,
  p_time_taken_seconds integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_question public.questions%rowtype;
  v_option text;
  v_is_correct boolean;
  v_new_attempt_id uuid;
  v_attempt_count integer;
  v_correct_count integer;
  v_existing public.user_attempts%rowtype;
  v_returned_option text;
begin
  if p_user_id is null then
    raise exception 'unauthenticated' using errcode = '42501';
  end if;

  if not exists (select 1 from public.users where id = p_user_id) then
    raise exception 'invalid_user' using errcode = '22023';
  end if;

  v_option := upper(trim(coalesce(p_selected_option, '')));
  if v_option not in ('A', 'B', 'C', 'D') then
    raise exception 'invalid_option' using errcode = '22023';
  end if;

  select *
  into v_question
  from public.questions
  where id = p_question_id
    and is_active = true
    and is_verified = true
  for update;

  if not found then
    raise exception 'question_not_found' using errcode = '22023';
  end if;

  v_is_correct := upper(trim(coalesce(v_question.correct_option, ''))) = v_option;

  insert into public.user_attempts (
    user_id, question_id, selected_option, is_correct, time_taken_seconds,
    subject_id, topic_id, subtopic_id
  )
  values (
    p_user_id, p_question_id, v_option, v_is_correct, p_time_taken_seconds,
    v_question.subject_id, v_question.topic_id, v_question.subtopic_id
  )
  on conflict (user_id, question_id) do nothing
  returning id into v_new_attempt_id;

  if v_new_attempt_id is not null then
    update public.questions
    set
      attempt_count = coalesce(attempt_count, 0) + 1,
      correct_count = coalesce(correct_count, 0) + case when v_is_correct then 1 else 0 end
    where id = p_question_id
    returning attempt_count, correct_count into v_attempt_count, v_correct_count;
    v_returned_option := v_option;
  else
    select * into v_existing
    from public.user_attempts
    where user_id = p_user_id and question_id = p_question_id;

    v_is_correct := v_existing.is_correct;
    v_returned_option := v_existing.selected_option;

    select attempt_count, correct_count
    into v_attempt_count, v_correct_count
    from public.questions
    where id = p_question_id;
  end if;

  return jsonb_build_object(
    'is_correct', v_is_correct,
    'correct_option', v_question.correct_option,
    'explanation', v_question.explanation,
    'attempt_count', coalesce(v_attempt_count, 0),
    'correct_count', coalesce(v_correct_count, 0),
    'correct_percentage', case
      when coalesce(v_attempt_count, 0) = 0 then null
      else round((coalesce(v_correct_count, 0) * 100.0) / v_attempt_count, 2)
    end,
    'is_new_attempt', v_new_attempt_id is not null,
    'already_attempted', v_new_attempt_id is null,
    'selected_option', v_returned_option
  );
end;
$$;

create or replace function public.report_question(
  p_user_id uuid,
  p_question_id uuid,
  p_reason text,
  p_details text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allowed_reasons constant text[] := array[
    'Wrong answer', 'Incorrect explanation', 'Translation issue',
    'Duplicate question', 'Typing error', 'Other'
  ];
  v_new_report_id uuid;
  v_report_count integer;
begin
  if p_user_id is null then raise exception 'unauthenticated' using errcode = '42501'; end if;
  if not exists (select 1 from public.users where id = p_user_id) then
    raise exception 'invalid_user' using errcode = '22023';
  end if;
  if not (p_reason = any (v_allowed_reasons)) then
    raise exception 'invalid_reason' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.questions
    where id = p_question_id and is_active = true and is_verified = true
  ) then
    raise exception 'question_not_found' using errcode = '22023';
  end if;

  insert into public.question_reports (user_id, question_id, reason, details)
  values (p_user_id, p_question_id, p_reason, nullif(trim(coalesce(p_details, '')), ''))
  on conflict (user_id, question_id) do nothing
  returning id into v_new_report_id;

  if v_new_report_id is not null then
    update public.questions
    set report_count = coalesce(report_count, 0) + 1
    where id = p_question_id
    returning report_count into v_report_count;

    return jsonb_build_object(
      'success', true, 'is_new_report', true, 'already_reported', false,
      'report_count', coalesce(v_report_count, 0)
    );
  end if;

  select report_count into v_report_count from public.questions where id = p_question_id;

  return jsonb_build_object(
    'success', true, 'is_new_report', false, 'already_reported', true,
    'report_count', coalesce(v_report_count, 0), 'message', 'already_reported'
  );
end;
$$;

revoke all on function public.submit_question_answer(uuid, uuid, text, integer) from public;
revoke all on function public.report_question(uuid, uuid, text, text) from public;
grant execute on function public.submit_question_answer(uuid, uuid, text, integer) to service_role;
grant execute on function public.report_question(uuid, uuid, text, text) to service_role;
