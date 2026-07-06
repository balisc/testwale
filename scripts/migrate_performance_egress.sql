-- =============================================================================
-- QuestionWale: egress/performance migration (production-safe, hardened)
-- =============================================================================
-- Run in Supabase SQL Editor AFTER:
--   scripts/create_users_table.sql
--   scripts/migrate_user_question_attempts.sql
--
-- Safe to run multiple times (create or replace / if not exists only).
-- Does NOT delete data automatically.
--
-- =============================================================================
-- PREFLIGHT — run these manually BEFORE applying this migration
-- =============================================================================
--
-- A) Check ID column types (expect uuid in this project):
--
--   select table_name, column_name, data_type, udt_name
--   from information_schema.columns
--   where table_schema = 'public'
--     and table_name in ('questions','subjects','topics','subtopics',
--                        'user_question_attempts','user_attempts','users')
--     and column_name in ('id','subject_id','topic_id','subtopic_id',
--                         'user_id','question_id')
--   order by table_name, column_name;
--
-- B) Check public.users exists:
--
--   select exists (
--     select 1 from information_schema.tables
--     where table_schema = 'public' and table_name = 'users'
--   ) as users_table_exists;
--
-- C) Check calc_attempt_accuracy exists (migration creates if missing):
--
--   select exists (
--     select 1 from pg_proc p
--     join pg_namespace n on n.oid = p.pronamespace
--     where n.nspname = 'public' and p.proname = 'calc_attempt_accuracy'
--   ) as calc_attempt_accuracy_exists;
--
-- D) Check duplicate user_attempts rows (must be 0 before unique index):
--
--   select user_id, question_id, count(*) as row_count
--   from public.user_attempts
--   group by user_id, question_id
--   having count(*) > 1
--   order by row_count desc
--   limit 20;
--
-- E) Check legacy per-subject tables/columns for optional indexes:
--
--   select table_name, column_name
--   from information_schema.columns
--   where table_schema = 'public'
--     and table_name in (
--       'history_questions','science_questions','polity_questions',
--       'economics_questions','geography_questions','general_knowledge_questions',
--       'math_questions','current_affairs_questions','reasoning_questions'
--     )
--     and column_name in ('id','topic')
--   order by table_name, column_name;
--
-- F) Check existing unique constraint/index on user_attempts(user_id, question_id):
--
--   select indexname, indexdef
--   from pg_indexes
--   where schemaname = 'public'
--     and tablename = 'user_attempts'
--     and indexdef ilike '%unique%';
--
-- =============================================================================
-- GOALS
-- =============================================================================
--   1. submit_question_answer() returns progress JSON (no immediate progress refetch).
--   2. Repeat / concurrent submits do NOT inflate progress or question counters.
--   3. Progress views use user_attempts (one row per user + question).
--   4. submit_question_answer: service_role only (direct).
--      Without service role, Next.js /api/practice/submit uses
--      submit_question_answer_verified() (security definer wrapper — see
--      scripts/migrate_practice_signed_submit.sql). That wrapper delegates here
--      and returns the same JSON keys including progress fields.
--   5. Progress views/dashboard read via Next.js API + service role, not anon client.
-- =============================================================================

-- =============================================================================
-- Dependency: calc_attempt_accuracy (idempotent)
-- =============================================================================

-- Uses same parameter names as migrate_user_question_attempts.sql (p_correct, p_total)
-- so CREATE OR REPLACE works without DROP FUNCTION (PostgreSQL 42P13).
create or replace function public.calc_attempt_accuracy(
  p_correct bigint,
  p_total bigint
)
returns numeric
language sql
immutable
as $$
  select case
    when coalesce(p_total, 0) = 0 then 0
    else round((coalesce(p_correct, 0)::numeric * 100) / p_total::numeric, 2)
  end;
$$;

-- =============================================================================
-- Unique constraint on user_attempts(user_id, question_id)
-- Required for ON CONFLICT concurrency safety in submit_question_answer().
-- Skips creation if duplicates exist — clean manually first (see OPTIONAL below).
-- =============================================================================

do $$
declare
  v_has_constraint boolean;
  v_has_unique_index boolean;
  v_has_duplicates boolean;
begin
  select exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_attempts'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) ilike '%user_id%question_id%'
  ) into v_has_constraint;

  select exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and tablename = 'user_attempts'
      and indexdef ilike '%unique%'
      and indexdef ilike '%user_id%'
      and indexdef ilike '%question_id%'
  ) into v_has_unique_index;

  select exists (
    select 1
    from public.user_attempts
    group by user_id, question_id
    having count(*) > 1
  ) into v_has_duplicates;

  if v_has_constraint or v_has_unique_index then
    raise notice 'user_attempts(user_id, question_id) unique enforcement already present';
  elsif v_has_duplicates then
    raise warning
      'SKIPPED unique index: duplicate rows in user_attempts. '
      'Run preflight query D, clean manually (OPTIONAL block at file end), then re-run migration.';
  else
    create unique index if not exists idx_user_attempts_user_question_unique
      on public.user_attempts (user_id, question_id);
    raise notice 'Created idx_user_attempts_user_question_unique';
  end if;
end;
$$;

-- =============================================================================
-- Progress views — source of truth: user_attempts (unique user_id + question_id)
-- Read via server API + service role only (user_attempts RLS blocks anon client).
-- =============================================================================

create or replace view public.user_subject_progress as
select
  user_id,
  subject_id,
  count(*)::bigint as attempts_count,
  count(*)::bigint as unique_questions_count,
  coalesce(sum(case when is_correct then 1 else 0 end), 0)::bigint as correct_count,
  coalesce(sum(case when not is_correct then 1 else 0 end), 0)::bigint as wrong_count,
  public.calc_attempt_accuracy(
    coalesce(sum(case when is_correct then 1 else 0 end), 0)::bigint,
    count(*)::bigint
  ) as accuracy_percent
from public.user_attempts
where subject_id is not null
group by user_id, subject_id;

create or replace view public.user_topic_progress as
select
  user_id,
  subject_id,
  topic_id,
  count(*)::bigint as attempts_count,
  count(*)::bigint as unique_questions_count,
  coalesce(sum(case when is_correct then 1 else 0 end), 0)::bigint as correct_count,
  coalesce(sum(case when not is_correct then 1 else 0 end), 0)::bigint as wrong_count,
  public.calc_attempt_accuracy(
    coalesce(sum(case when is_correct then 1 else 0 end), 0)::bigint,
    count(*)::bigint
  ) as accuracy_percent
from public.user_attempts
where topic_id is not null
group by user_id, subject_id, topic_id;

create or replace view public.user_subtopic_progress as
select
  user_id,
  subject_id,
  topic_id,
  subtopic_id,
  count(*)::bigint as attempts_count,
  count(*)::bigint as unique_questions_count,
  coalesce(sum(case when is_correct then 1 else 0 end), 0)::bigint as correct_count,
  coalesce(sum(case when not is_correct then 1 else 0 end), 0)::bigint as wrong_count,
  public.calc_attempt_accuracy(
    coalesce(sum(case when is_correct then 1 else 0 end), 0)::bigint,
    count(*)::bigint
  ) as accuracy_percent
from public.user_attempts
where subtopic_id is not null
group by user_id, subject_id, topic_id, subtopic_id;

-- =============================================================================
-- Dashboard RPC — overview + recent from user_attempts
-- coalesce() on all aggregates so new users get 0, not null.
-- =============================================================================

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
    'total_attempts', coalesce(count(*), 0)::bigint,
    'unique_questions_attempted', coalesce(count(*), 0)::bigint,
    'correct_count', coalesce(sum(case when is_correct then 1 else 0 end), 0)::bigint,
    'wrong_count', coalesce(sum(case when not is_correct then 1 else 0 end), 0)::bigint,
    'accuracy_percent', public.calc_attempt_accuracy(
      coalesce(sum(case when is_correct then 1 else 0 end), 0)::bigint,
      coalesce(count(*), 0)::bigint
    )
  )
  into v_overview
  from public.user_attempts
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
      q.correct_option,
      a.is_correct,
      a.attempted_at
    from public.user_attempts a
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
    'by_subject', coalesce(v_by_subject, '[]'::jsonb),
    'by_topic', coalesce(v_by_topic, '[]'::jsonb),
    'by_subtopic', coalesce(v_by_subtopic, '[]'::jsonb),
    'recent_attempts', coalesce(v_recent, '[]'::jsonb)
  );
end;
$$;

-- =============================================================================
-- Helper: scoped progress JSON for submit RPC response
-- Returns zero objects (not null) when scope ID is set but no view row yet.
-- Frontend types allow null, but zero objects are safer for UI rendering.
-- =============================================================================

create or replace function public.build_scoped_progress_snapshot(
  p_user_id uuid,
  p_subject_id uuid,
  p_topic_id uuid,
  p_subtopic_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_zero jsonb := jsonb_build_object(
    'attempted', 0,
    'correct', 0,
    'wrong', 0,
    'accuracy', 0
  );
  v_subtopic jsonb;
  v_topic jsonb;
  v_subject jsonb;
  v_scoped jsonb;
begin
  if p_subtopic_id is not null then
    select jsonb_build_object(
      'attempted', coalesce(attempts_count, 0),
      'correct', coalesce(correct_count, 0),
      'wrong', coalesce(wrong_count, 0),
      'accuracy', coalesce(accuracy_percent, 0)
    )
    into v_subtopic
    from public.user_subtopic_progress
    where user_id = p_user_id and subtopic_id = p_subtopic_id;

    v_subtopic := coalesce(v_subtopic, v_zero);
  end if;

  if p_topic_id is not null then
    select jsonb_build_object(
      'attempted', coalesce(attempts_count, 0),
      'correct', coalesce(correct_count, 0),
      'wrong', coalesce(wrong_count, 0),
      'accuracy', coalesce(accuracy_percent, 0)
    )
    into v_topic
    from public.user_topic_progress
    where user_id = p_user_id and topic_id = p_topic_id;

    v_topic := coalesce(v_topic, v_zero);
  end if;

  if p_subject_id is not null then
    select jsonb_build_object(
      'attempted', coalesce(attempts_count, 0),
      'correct', coalesce(correct_count, 0),
      'wrong', coalesce(wrong_count, 0),
      'accuracy', coalesce(accuracy_percent, 0)
    )
    into v_subject
    from public.user_subject_progress
    where user_id = p_user_id and subject_id = p_subject_id;

    v_subject := coalesce(v_subject, v_zero);
  end if;

  v_scoped := coalesce(v_subtopic, v_topic, v_subject, v_zero);

  return jsonb_build_object(
    'progress', v_scoped,
    'subtopic_progress', v_subtopic,
    'topic_progress', v_topic,
    'subject_progress', v_subject
  );
end;
$$;

-- =============================================================================
-- submit_question_answer
--
-- CONCURRENCY SAFETY:
--   INSERT INTO user_attempts ... ON CONFLICT (user_id, question_id) DO NOTHING
--   RETURNING id. If NULL → another request won the race or user already attempted.
--   No duplicate key error on double-click; no user_question_attempts insert;
--   no questions.attempt_count bump on repeat/concurrent submit.
--
-- LOCKING:
--   Question row read without FOR UPDATE. Counter UPDATE locks only on new attempt.
--
-- PROGRESS IN RESPONSE:
--   Returns progress / subtopic_progress / topic_progress / subject_progress.
--
-- PERMISSIONS:
--   service_role only (direct). Anon path: submit_question_answer_verified() in API.
-- =============================================================================

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
  v_progress jsonb;
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

  -- Read question without row lock (FOR UPDATE only needed on counter UPDATE below)
  select *
  into v_question
  from public.questions
  where id = p_question_id
    and is_active = true
    and is_verified = true;

  if not found then
    raise exception 'question_not_found' using errcode = '22023';
  end if;

  v_correct_option := upper(trim(coalesce(v_question.correct_option, '')));
  v_is_correct := v_correct_option = v_option;
  v_returned_option := v_option;

  -- Atomic first-attempt insert; safe under double-click / concurrent requests
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

  -- -------------------------------------------------------------------------
  -- Repeat or concurrent submit: return stored result, no side effects
  -- -------------------------------------------------------------------------
  if v_new_attempt_id is null then
    select *
    into v_existing
    from public.user_attempts
    where user_id = p_user_id
      and question_id = p_question_id;

    if not found then
      raise exception 'attempt_conflict_retry' using errcode = '40001';
    end if;

    v_is_correct := v_existing.is_correct;
    v_returned_option := v_existing.selected_option;

    select attempt_count, correct_count
    into v_attempt_count, v_correct_count
    from public.questions
    where id = p_question_id;

    v_progress := public.build_scoped_progress_snapshot(
      p_user_id,
      v_question.subject_id,
      v_question.topic_id,
      v_question.subtopic_id
    );

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
      'is_new_attempt', false,
      'already_attempted', true,
      'selected_option', v_returned_option
    ) || v_progress;
  end if;

  -- -------------------------------------------------------------------------
  -- Confirmed new attempt
  -- -------------------------------------------------------------------------
  insert into public.user_question_attempts (
    user_id, question_id, subject_id, topic_id, subtopic_id,
    selected_option, correct_option, is_correct, time_spent_seconds
  )
  values (
    p_user_id, p_question_id,
    v_question.subject_id, v_question.topic_id, v_question.subtopic_id,
    v_option, v_correct_option, v_is_correct, p_time_taken_seconds
  );

  update public.questions
  set
    attempt_count = coalesce(attempt_count, 0) + 1,
    correct_count = coalesce(correct_count, 0) + case when v_is_correct then 1 else 0 end
  where id = p_question_id
  returning attempt_count, correct_count into v_attempt_count, v_correct_count;

  v_progress := public.build_scoped_progress_snapshot(
    p_user_id,
    v_question.subject_id,
    v_question.topic_id,
    v_question.subtopic_id
  );

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
    'is_new_attempt', true,
    'already_attempted', false,
    'selected_option', v_returned_option
  ) || v_progress;
end;
$$;

-- =============================================================================
-- Permissions
-- submit_question_answer + dashboard: service_role only (Next.js API after cookie auth).
-- submit_question_answer_verified: granted in migrate_practice_signed_submit.sql
--   (anon/authenticated) — security definer wrapper calls submit_question_answer.
-- Progress views: not granted to anon; read via service role in API routes.
-- =============================================================================

revoke all on function public.build_scoped_progress_snapshot(uuid, uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.build_scoped_progress_snapshot(uuid, uuid, uuid, uuid) to service_role;

revoke all on function public.submit_question_answer(uuid, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.submit_question_answer(uuid, uuid, text, integer) to service_role;

revoke all on function public.get_user_progress_dashboard(uuid) from public, anon, authenticated;
grant execute on function public.get_user_progress_dashboard(uuid) to service_role;

-- =============================================================================
-- Indexes (idempotent)
-- =============================================================================

create index if not exists idx_questions_subtopic_active_verified
  on public.questions (subtopic_id, is_active, is_verified, id desc);

create index if not exists idx_questions_topic_active_verified
  on public.questions (topic_id, is_active, is_verified, id desc);

create index if not exists idx_questions_subject_active_verified
  on public.questions (subject_id, is_active, is_verified, id desc);

create index if not exists idx_topics_subject_slug_active
  on public.topics (subject_id, slug, is_active);

create index if not exists idx_subtopics_topic_slug_active
  on public.subtopics (topic_id, slug, is_active);

create index if not exists idx_user_attempts_progress
  on public.user_attempts (user_id, subject_id, topic_id, subtopic_id);

create index if not exists idx_user_question_attempts_progress
  on public.user_question_attempts (user_id, subject_id, topic_id, subtopic_id);

-- Legacy per-subject tables: create index only if table + topic + id columns exist
do $$
declare
  t text;
  tables text[] := array[
    'history_questions', 'science_questions', 'polity_questions', 'economics_questions',
    'geography_questions', 'general_knowledge_questions', 'math_questions',
    'current_affairs_questions', 'reasoning_questions'
  ];
  v_has_topic boolean;
  v_has_id boolean;
begin
  foreach t in array tables loop
    if not exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      continue;
    end if;

    select exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'topic'
    ) into v_has_topic;

    select exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'id'
    ) into v_has_id;

    if v_has_topic and v_has_id then
      execute format(
        'create index if not exists idx_%I_topic_active on public.%I (topic, id desc)',
        t, t
      );
      raise notice 'Legacy index ensured for %', t;
    else
      raise notice 'Skipped legacy index for % (missing topic or id column)', t;
    end if;
  end loop;
end;
$$;

-- =============================================================================
-- OPTIONAL: manual cleanup (uncomment ONLY after reviewing duplicates)
-- Does NOT run automatically. No data deleted by default.
-- =============================================================================
--
-- 1) Remove duplicate user_attempts (keep earliest per user+question):
--
-- delete from public.user_attempts a
-- using (
--   select id
--   from (
--     select id,
--       row_number() over (
--         partition by user_id, question_id
--         order by attempted_at asc, id asc
--       ) as rn
--     from public.user_attempts
--   ) ranked
--   where rn > 1
-- ) dups
-- where a.id = dups.id;
--
-- 2) Then re-run unique index block or:
-- create unique index if not exists idx_user_attempts_user_question_unique
--   on public.user_attempts (user_id, question_id);
--
-- 3) Remove duplicate user_question_attempts history rows (optional):
--
-- delete from public.user_question_attempts a
-- using (
--   select id
--   from (
--     select id,
--       row_number() over (
--         partition by user_id, question_id
--         order by attempted_at asc, id asc
--       ) as rn
--     from public.user_question_attempts
--   ) ranked
--   where rn > 1
-- ) dups
-- where a.id = dups.id;
