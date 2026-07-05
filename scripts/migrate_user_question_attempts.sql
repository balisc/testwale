-- QuestionWale: user attempt analytics (run once in Supabase SQL Editor)
-- Adds raw attempt history table + dashboard RPCs.
-- Requires: public.users, public.questions, public.subjects, public.topics, public.subtopics
-- Custom auth uses public.users (cookie session verified in Next.js API, not auth.uid()).

-- ===========================================================================
-- PREREQUISITES (safe to re-run — creates tables the practice RPC depends on)
-- Run this block first if you never ran scripts/migrate_practice_counters.sql
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
create index if not exists idx_user_attempts_subject_id on public.user_attempts (subject_id);
create index if not exists idx_user_attempts_topic_id on public.user_attempts (topic_id);
create index if not exists idx_user_attempts_subtopic_id on public.user_attempts (subtopic_id);
create index if not exists idx_user_attempts_attempted_at on public.user_attempts (attempted_at desc);

alter table public.questions add column if not exists attempt_count integer not null default 0;
alter table public.questions add column if not exists correct_count integer not null default 0;
alter table public.questions add column if not exists report_count integer not null default 0;

update public.questions set attempt_count = 0 where attempt_count is null;
update public.questions set correct_count = 0 where correct_count is null;
update public.questions set report_count = 0 where report_count is null;

alter table public.user_attempts enable row level security;

drop policy if exists "user_attempts_select_own" on public.user_attempts;
create policy "user_attempts_select_own"
  on public.user_attempts for select to authenticated
  using (false);

drop policy if exists "user_attempts_insert_own" on public.user_attempts;
create policy "user_attempts_insert_own"
  on public.user_attempts for insert to authenticated
  with check (false);

drop policy if exists "user_attempts_no_update" on public.user_attempts;
create policy "user_attempts_no_update"
  on public.user_attempts for update to authenticated
  using (false);

drop policy if exists "user_attempts_no_delete" on public.user_attempts;
create policy "user_attempts_no_delete"
  on public.user_attempts for delete to authenticated
  using (false);

-- ===========================================================================
-- TABLE: user_question_attempts (every submit = one row)
-- ===========================================================================

create table if not exists public.user_question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  subject_id uuid,
  topic_id uuid,
  subtopic_id uuid,
  selected_option text not null check (selected_option in ('A', 'B', 'C', 'D')),
  correct_option text not null check (correct_option in ('A', 'B', 'C', 'D')),
  is_correct boolean not null,
  time_spent_seconds integer check (time_spent_seconds is null or time_spent_seconds >= 0),
  attempted_at timestamptz not null default now()
);

create index if not exists idx_uqa_user_id on public.user_question_attempts (user_id);
create index if not exists idx_uqa_question_id on public.user_question_attempts (question_id);
create index if not exists idx_uqa_subject_id on public.user_question_attempts (subject_id);
create index if not exists idx_uqa_topic_id on public.user_question_attempts (topic_id);
create index if not exists idx_uqa_subtopic_id on public.user_question_attempts (subtopic_id);
create index if not exists idx_uqa_attempted_at on public.user_question_attempts (attempted_at desc);
create index if not exists idx_uqa_user_subject on public.user_question_attempts (user_id, subject_id);
create index if not exists idx_uqa_user_topic on public.user_question_attempts (user_id, topic_id);
create index if not exists idx_uqa_user_subtopic on public.user_question_attempts (user_id, subtopic_id);

-- ===========================================================================
-- RLS: block direct client access; Next.js API uses service role after cookie auth
-- ===========================================================================

alter table public.user_question_attempts enable row level security;

drop policy if exists "uqa_select_own" on public.user_question_attempts;
create policy "uqa_select_own"
  on public.user_question_attempts for select to authenticated
  using (false);

drop policy if exists "uqa_insert_own" on public.user_question_attempts;
create policy "uqa_insert_own"
  on public.user_question_attempts for insert to authenticated
  with check (false);

drop policy if exists "uqa_no_update" on public.user_question_attempts;
create policy "uqa_no_update"
  on public.user_question_attempts for update to authenticated
  using (false);

drop policy if exists "uqa_no_delete" on public.user_question_attempts;
create policy "uqa_no_delete"
  on public.user_question_attempts for delete to authenticated
  using (false);

-- ===========================================================================
-- Helper: accuracy percent from counts
-- ===========================================================================

create or replace function public.calc_attempt_accuracy(p_correct bigint, p_total bigint)
returns numeric
language sql
immutable
as $$
  select case
    when coalesce(p_total, 0) = 0 then 0
    else round((p_correct::numeric / p_total::numeric) * 100, 2)
  end;
$$;

-- ===========================================================================
-- Views (scoped by user_id column; API always filters by p_user_id)
-- ===========================================================================

create or replace view public.user_subject_progress as
select
  user_id,
  subject_id,
  count(*)::bigint as attempts_count,
  count(distinct question_id)::bigint as unique_questions_count,
  sum(case when is_correct then 1 else 0 end)::bigint as correct_count,
  sum(case when not is_correct then 1 else 0 end)::bigint as wrong_count,
  public.calc_attempt_accuracy(
    sum(case when is_correct then 1 else 0 end)::bigint,
    count(*)::bigint
  ) as accuracy_percent
from public.user_question_attempts
group by user_id, subject_id;

create or replace view public.user_topic_progress as
select
  user_id,
  subject_id,
  topic_id,
  count(*)::bigint as attempts_count,
  count(distinct question_id)::bigint as unique_questions_count,
  sum(case when is_correct then 1 else 0 end)::bigint as correct_count,
  sum(case when not is_correct then 1 else 0 end)::bigint as wrong_count,
  public.calc_attempt_accuracy(
    sum(case when is_correct then 1 else 0 end)::bigint,
    count(*)::bigint
  ) as accuracy_percent
from public.user_question_attempts
group by user_id, subject_id, topic_id;

create or replace view public.user_subtopic_progress as
select
  user_id,
  subject_id,
  topic_id,
  subtopic_id,
  count(*)::bigint as attempts_count,
  count(distinct question_id)::bigint as unique_questions_count,
  sum(case when is_correct then 1 else 0 end)::bigint as correct_count,
  sum(case when not is_correct then 1 else 0 end)::bigint as wrong_count,
  public.calc_attempt_accuracy(
    sum(case when is_correct then 1 else 0 end)::bigint,
    count(*)::bigint
  ) as accuracy_percent
from public.user_question_attempts
group by user_id, subject_id, topic_id, subtopic_id;

-- ===========================================================================
-- RPC: dashboard payload (overview + breakdowns + recent attempts)
-- ===========================================================================

create or replace function public.get_user_progress_dashboard(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_overview jsonb;
  v_by_subject jsonb;
  v_by_topic jsonb;
  v_by_subtopic jsonb;
  v_recent jsonb;
begin
  if p_user_id is null then
    raise exception 'unauthenticated' using errcode = '42501';
  end if;

  if not exists (select 1 from public.users where id = p_user_id) then
    raise exception 'invalid_user' using errcode = '22023';
  end if;

  select jsonb_build_object(
    'total_attempts', count(*)::bigint,
    'unique_questions_attempted', count(distinct question_id)::bigint,
    'correct_count', sum(case when is_correct then 1 else 0 end)::bigint,
    'wrong_count', sum(case when not is_correct then 1 else 0 end)::bigint,
    'accuracy_percent', public.calc_attempt_accuracy(
      sum(case when is_correct then 1 else 0 end)::bigint,
      count(*)::bigint
    )
  )
  into v_overview
  from public.user_question_attempts
  where user_id = p_user_id;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.attempts_count desc), '[]'::jsonb)
  into v_by_subject
  from (
    select
      p.subject_id,
      s.title as subject_title,
      s.slug as subject_slug,
      p.attempts_count,
      p.unique_questions_count,
      p.correct_count,
      p.wrong_count,
      p.accuracy_percent
    from public.user_subject_progress p
    left join public.subjects s on s.id = p.subject_id
    where p.user_id = p_user_id
  ) t;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.attempts_count desc), '[]'::jsonb)
  into v_by_topic
  from (
    select
      p.topic_id,
      p.subject_id,
      tp.title as topic_title,
      tp.slug as topic_slug,
      s.title as subject_title,
      s.slug as subject_slug,
      p.attempts_count,
      p.unique_questions_count,
      p.correct_count,
      p.wrong_count,
      p.accuracy_percent
    from public.user_topic_progress p
    left join public.topics tp on tp.id = p.topic_id
    left join public.subjects s on s.id = p.subject_id
    where p.user_id = p_user_id
  ) t;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.attempts_count desc), '[]'::jsonb)
  into v_by_subtopic
  from (
    select
      p.subtopic_id,
      p.topic_id,
      p.subject_id,
      st.title as subtopic_title,
      st.slug as subtopic_slug,
      tp.title as topic_title,
      tp.slug as topic_slug,
      s.title as subject_title,
      s.slug as subject_slug,
      p.attempts_count,
      p.unique_questions_count,
      p.correct_count,
      p.wrong_count,
      p.accuracy_percent
    from public.user_subtopic_progress p
    left join public.subtopics st on st.id = p.subtopic_id
    left join public.topics tp on tp.id = p.topic_id
    left join public.subjects s on s.id = p.subject_id
    where p.user_id = p_user_id
  ) t;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.attempted_at desc), '[]'::jsonb)
  into v_recent
  from (
    select
      a.id,
      a.question_id,
      q.question_text,
      a.subject_id,
      s.title as subject_title,
      a.topic_id,
      tp.title as topic_title,
      a.subtopic_id,
      st.title as subtopic_title,
      a.selected_option,
      a.correct_option,
      a.is_correct,
      a.attempted_at
    from public.user_question_attempts a
    join public.questions q on q.id = a.question_id
    left join public.subjects s on s.id = a.subject_id
    left join public.topics tp on tp.id = a.topic_id
    left join public.subtopics st on st.id = a.subtopic_id
    where a.user_id = p_user_id
    order by a.attempted_at desc
    limit 50
  ) t;

  return jsonb_build_object(
    'overview', coalesce(v_overview, jsonb_build_object(
      'total_attempts', 0,
      'unique_questions_attempted', 0,
      'correct_count', 0,
      'wrong_count', 0,
      'accuracy_percent', 0
    )),
    'by_subject', v_by_subject,
    'by_topic', v_by_topic,
    'by_subtopic', v_by_subtopic,
    'recent_attempts', v_recent
  );
end;
$$;

-- ===========================================================================
-- Update submit_question_answer: log every attempt in user_question_attempts
-- Keeps user_attempts upsert for practice UI "already attempted" state.
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
  v_correct_option text;
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

  v_correct_option := upper(trim(coalesce(v_question.correct_option, '')));
  v_is_correct := v_correct_option = v_option;

  -- Raw history: always insert (supports total_attempts > unique questions)
  insert into public.user_question_attempts (
    user_id, question_id, subject_id, topic_id, subtopic_id,
    selected_option, correct_option, is_correct, time_spent_seconds
  )
  values (
    p_user_id, p_question_id,
    v_question.subject_id, v_question.topic_id, v_question.subtopic_id,
    v_option, v_correct_option, v_is_correct, p_time_taken_seconds
  );

  -- Practice snapshot: one row per user+question (first attempt only increments counters)
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

revoke all on function public.get_user_progress_dashboard(uuid) from public;
grant execute on function public.get_user_progress_dashboard(uuid) to service_role;

revoke all on function public.submit_question_answer(uuid, uuid, text, integer) from public;
grant execute on function public.submit_question_answer(uuid, uuid, text, integer) to service_role;
