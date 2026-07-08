-- =============================================================================
-- QuestionWale: subtopic mastery-loop practice (production-safe, idempotent)
-- =============================================================================
-- Run in Supabase SQL Editor AFTER:
--   scripts/migrate_user_question_attempts.sql
--   scripts/migrate_performance_egress.sql
--
-- Does NOT run automatically from the app.
-- Safe to re-run (IF NOT EXISTS / CREATE OR REPLACE only).
--
-- TRANSACTION SAFETY:
-- All statements below are transaction-safe (no CREATE INDEX CONCURRENTLY,
-- no destructive DROP TABLE). Wrapped in BEGIN/COMMIT for atomic apply.
--
-- SCHEMA COMPATIBILITY (verified from repo migrations):
--   questions.exam_tags          -> text[]  (create_map_practice_tables.sql)
--   user_question_attempts       -> no unique(user_id, question_id); retries allowed
--   user_question_attempts.attempted_at -> timestamptz NOT NULL DEFAULT now()
--   user_question_attempts.time_spent_seconds -> integer nullable
--   subject_id / topic_id / subtopic_id columns exist on user_question_attempts
--   build_scoped_progress_snapshot(uuid, uuid, uuid, uuid) exists (migrate_performance_egress.sql)
--
-- STATISTICS SEMANTICS (preserved intentionally):
--   questions.attempt_count / correct_count increment ONLY on the first stored
--   user_attempts row (new first attempt). Retries log to user_question_attempts
--   but do NOT bump public question counters.
--   Progress views (user_*_progress) read user_attempts = first attempt per question.
--
-- RESET SEMANTICS:
--   reset_subtopic_practice_progress() accepts p_exam_code for caller compatibility
--   but reset is SUBTOPIC-GLOBAL: all exam_code scope rows for that user+subtopic
--   are deleted together with all attempt history in that subtopic.
-- =============================================================================

-- =============================================================================

begin;

-- =============================================================================
-- 1. Practice scope state (phase + revision round)
-- =============================================================================

create table if not exists public.user_practice_scope_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  scope_type text not null check (scope_type in ('subtopic', 'topic')),
  scope_id uuid not null,
  exam_code text not null default 'ALL',
  phase text not null default 'unseen' check (phase in ('unseen', 'revision', 'completed')),
  revision_round integer not null default 0 check (revision_round >= 0),
  round_started_at timestamptz,
  coverage_completed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_practice_scope_state_unique unique (user_id, scope_type, scope_id, exam_code)
);

create index if not exists idx_upss_user_scope
  on public.user_practice_scope_state (user_id, scope_type, scope_id);

create index if not exists idx_upss_user_phase
  on public.user_practice_scope_state (user_id, phase);

alter table public.user_practice_scope_state enable row level security;

drop policy if exists upss_select_none on public.user_practice_scope_state;
create policy upss_select_none
  on public.user_practice_scope_state for select
  using (false);

drop policy if exists upss_insert_none on public.user_practice_scope_state;
create policy upss_insert_none
  on public.user_practice_scope_state for insert
  with check (false);

drop policy if exists upss_update_none on public.user_practice_scope_state;
create policy upss_update_none
  on public.user_practice_scope_state for update
  using (false);

drop policy if exists upss_delete_none on public.user_practice_scope_state;
create policy upss_delete_none
  on public.user_practice_scope_state for delete
  using (false);

create or replace function public.touch_user_practice_scope_state()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_user_practice_scope_state on public.user_practice_scope_state;
create trigger trg_touch_user_practice_scope_state
  before update on public.user_practice_scope_state
  for each row execute function public.touch_user_practice_scope_state();

-- =============================================================================
-- 2. Helpers — exam filter + mastery classification
-- =============================================================================

create or replace function public.normalize_practice_exam_code(p_exam_code text)
returns text
language sql
immutable
as $$
  select case
    when p_exam_code is null or btrim(p_exam_code) = '' then 'ALL'
    else upper(btrim(p_exam_code))
  end;
$$;

-- questions.exam_tags is text[] in this project.
create or replace function public.question_matches_practice_exam(
  p_exam_tags text[],
  p_exam_code text
)
returns boolean
language sql
immutable
as $$
  select
    public.normalize_practice_exam_code(p_exam_code) = 'ALL'
    or coalesce(p_exam_tags, '{}'::text[]) @> array[public.normalize_practice_exam_code(p_exam_code)]::text[];
$$;

create or replace function public.is_question_mastered_for_user(
  p_user_id uuid,
  p_question_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_question_attempts uqa
    where uqa.user_id = p_user_id
      and uqa.question_id = p_question_id
      and uqa.is_correct = true
  );
$$;

create or replace function public.is_question_unresolved_for_user(
  p_user_id uuid,
  p_question_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.user_question_attempts uqa
      where uqa.user_id = p_user_id
        and uqa.question_id = p_question_id
    )
    and not public.is_question_mastered_for_user(p_user_id, p_question_id);
$$;

create or replace function public.is_question_unseen_for_user(
  p_user_id uuid,
  p_question_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.user_question_attempts uqa
    where uqa.user_id = p_user_id
      and uqa.question_id = p_question_id
  );
$$;

create or replace function public.was_question_attempted_in_round(
  p_user_id uuid,
  p_question_id uuid,
  p_round_started_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_round_started_at is not null
    and exists (
      select 1
      from public.user_question_attempts uqa
      where uqa.user_id = p_user_id
        and uqa.question_id = p_question_id
        and uqa.attempted_at >= p_round_started_at
    );
$$;

-- =============================================================================
-- 3. Scope catalog counts (subtopic + exam)
-- =============================================================================

create or replace function public.count_subtopic_catalog_questions(
  p_subtopic_id uuid,
  p_exam_code text
)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.questions q
  where q.subtopic_id = p_subtopic_id
    and q.is_active = true
    and q.is_verified = true
    and public.question_matches_practice_exam(q.exam_tags, p_exam_code);
$$;

create or replace function public.count_subtopic_unseen_questions(
  p_user_id uuid,
  p_subtopic_id uuid,
  p_exam_code text
)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.questions q
  where q.subtopic_id = p_subtopic_id
    and q.is_active = true
    and q.is_verified = true
    and public.question_matches_practice_exam(q.exam_tags, p_exam_code)
    and public.is_question_unseen_for_user(p_user_id, q.id);
$$;

create or replace function public.count_subtopic_unresolved_questions(
  p_user_id uuid,
  p_subtopic_id uuid,
  p_exam_code text
)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.questions q
  where q.subtopic_id = p_subtopic_id
    and q.is_active = true
    and q.is_verified = true
    and public.question_matches_practice_exam(q.exam_tags, p_exam_code)
    and public.is_question_unresolved_for_user(p_user_id, q.id);
$$;

create or replace function public.count_subtopic_revision_round_eligible(
  p_user_id uuid,
  p_subtopic_id uuid,
  p_exam_code text,
  p_round_started_at timestamptz
)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.questions q
  where q.subtopic_id = p_subtopic_id
    and q.is_active = true
    and q.is_verified = true
    and public.question_matches_practice_exam(q.exam_tags, p_exam_code)
    and public.is_question_unresolved_for_user(p_user_id, q.id)
    and not public.was_question_attempted_in_round(p_user_id, q.id, p_round_started_at);
$$;

-- =============================================================================
-- 4. Completed-state reopen helper (shared)
-- =============================================================================

create or replace function public.reopen_subtopic_scope_from_completed(
  p_user_id uuid,
  p_subtopic_id uuid,
  p_exam_code text,
  p_row public.user_practice_scope_state
)
returns public.user_practice_scope_state
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.user_practice_scope_state := p_row;
  v_exam text := public.normalize_practice_exam_code(p_exam_code);
  v_catalog bigint;
  v_unseen bigint;
  v_unresolved bigint;
begin
  if v_row.phase <> 'completed' then
    return v_row;
  end if;

  v_catalog := public.count_subtopic_catalog_questions(p_subtopic_id, v_exam);

  -- Empty catalog is NOT mastery. Reopen as unseen so the app can show "no questions".
  if v_catalog = 0 then
    update public.user_practice_scope_state
    set
      phase = 'unseen',
      revision_round = 0,
      round_started_at = null,
      coverage_completed_at = null,
      completed_at = null
    where id = v_row.id
    returning * into v_row;
    return v_row;
  end if;

  v_unseen := public.count_subtopic_unseen_questions(p_user_id, p_subtopic_id, v_exam);
  if v_unseen > 0 then
    update public.user_practice_scope_state
    set
      phase = 'unseen',
      revision_round = 0,
      round_started_at = null,
      coverage_completed_at = null,
      completed_at = null
    where id = v_row.id
    returning * into v_row;
    return v_row;
  end if;

  v_unresolved := public.count_subtopic_unresolved_questions(p_user_id, p_subtopic_id, v_exam);
  if v_unresolved > 0 then
    update public.user_practice_scope_state
    set
      phase = 'revision',
      revision_round = 1,
      round_started_at = now(),
      coverage_completed_at = coalesce(coverage_completed_at, now()),
      completed_at = null
    where id = v_row.id
    returning * into v_row;
    return v_row;
  end if;

  return v_row;
end;
$$;

-- =============================================================================
-- 5. Get or initialize scope state (concurrency-safe)
-- =============================================================================

create or replace function public.get_or_init_subtopic_practice_scope(
  p_user_id uuid,
  p_subtopic_id uuid,
  p_exam_code text
)
returns public.user_practice_scope_state
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exam text := public.normalize_practice_exam_code(p_exam_code);
  v_row public.user_practice_scope_state%rowtype;
  v_catalog bigint;
  v_unseen bigint;
  v_unresolved bigint;
  v_phase text := 'unseen';
  v_revision_round integer := 0;
  v_round_started_at timestamptz := null;
  v_coverage_completed_at timestamptz := null;
  v_completed_at timestamptz := null;
begin
  if p_user_id is null or p_subtopic_id is null then
    raise exception 'invalid_scope' using errcode = '22023';
  end if;

  v_catalog := public.count_subtopic_catalog_questions(p_subtopic_id, v_exam);
  v_unseen := public.count_subtopic_unseen_questions(p_user_id, p_subtopic_id, v_exam);
  v_unresolved := public.count_subtopic_unresolved_questions(p_user_id, p_subtopic_id, v_exam);

  if v_catalog = 0 then
    v_phase := 'unseen';
    v_revision_round := 0;
  elsif v_unseen > 0 then
    v_phase := 'unseen';
    v_revision_round := 0;
  elsif v_unresolved > 0 then
    v_phase := 'revision';
    v_revision_round := 1;
    v_round_started_at := now();
    v_coverage_completed_at := now();
  else
    v_phase := 'completed';
    v_revision_round := 0;
    v_completed_at := now();
  end if;

  insert into public.user_practice_scope_state (
    user_id,
    scope_type,
    scope_id,
    exam_code,
    phase,
    revision_round,
    round_started_at,
    coverage_completed_at,
    completed_at
  )
  values (
    p_user_id,
    'subtopic',
    p_subtopic_id,
    v_exam,
    v_phase,
    v_revision_round,
    v_round_started_at,
    v_coverage_completed_at,
    v_completed_at
  )
  on conflict on constraint user_practice_scope_state_unique do nothing;

  select *
  into v_row
  from public.user_practice_scope_state
  where user_id = p_user_id
    and scope_type = 'subtopic'
    and scope_id = p_subtopic_id
    and exam_code = v_exam
  for update;

  if not found then
    raise exception 'scope_state_missing' using errcode = '22023';
  end if;

  v_row := public.reopen_subtopic_scope_from_completed(
    p_user_id,
    p_subtopic_id,
    v_exam,
    v_row
  );

  return v_row;
end;
$$;

-- =============================================================================
-- 6. Batch question state for a page of IDs (set-based, catalog-validated)
-- =============================================================================

create or replace function public.get_subtopic_batch_question_state(
  p_user_id uuid,
  p_subtopic_id uuid,
  p_exam_code text,
  p_question_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scope public.user_practice_scope_state%rowtype;
  v_exam text;
  v_catalog_count bigint;
  v_result jsonb;
begin
  if p_user_id is null or p_subtopic_id is null or p_question_ids is null then
    raise exception 'invalid_payload' using errcode = '22023';
  end if;

  v_scope := public.get_or_init_subtopic_practice_scope(p_user_id, p_subtopic_id, p_exam_code);
  v_exam := v_scope.exam_code;
  v_catalog_count := public.count_subtopic_catalog_questions(p_subtopic_id, v_exam);

  if coalesce(cardinality(p_question_ids), 0) = 0 then
    return jsonb_build_object(
      'phase', v_scope.phase,
      'revisionRound', v_scope.revision_round,
      'roundStartedAt', v_scope.round_started_at,
      'catalogQuestionCount', v_catalog_count,
      'eligibleQuestionIds', '[]'::jsonb,
      'masteredQuestionIds', '[]'::jsonb,
      'unresolvedQuestionIds', '[]'::jsonb,
      'attemptedThisRoundQuestionIds', '[]'::jsonb
    );
  end if;

  with catalog as (
    select q.id as question_id
    from public.questions q
    where q.subtopic_id = p_subtopic_id
      and q.is_active = true
      and q.is_verified = true
      and public.question_matches_practice_exam(q.exam_tags, v_exam)
      and q.id = any(p_question_ids)
  ),
  attempt_agg as (
    select
      uqa.question_id,
      bool_or(uqa.is_correct) as is_mastered,
      bool_or(
        v_scope.round_started_at is not null
        and uqa.attempted_at >= v_scope.round_started_at
      ) as attempted_this_round
    from public.user_question_attempts uqa
    inner join catalog c on c.question_id = uqa.question_id
    where uqa.user_id = p_user_id
    group by uqa.question_id
  ),
  classified as (
    select
      c.question_id,
      coalesce(a.is_mastered, false) as is_mastered,
      (a.question_id is not null) as has_attempt,
      coalesce(a.attempted_this_round, false) as attempted_this_round
    from catalog c
    left join attempt_agg a on a.question_id = c.question_id
  )
  select jsonb_build_object(
    'phase', v_scope.phase,
    'revisionRound', v_scope.revision_round,
    'roundStartedAt', v_scope.round_started_at,
    'catalogQuestionCount', v_catalog_count,
    'eligibleQuestionIds', coalesce(
      (
        select jsonb_agg(cl.question_id::text order by cl.question_id)
        from classified cl
        where not cl.is_mastered
          and (
            (v_scope.phase = 'unseen' and not cl.has_attempt)
            or (
              v_scope.phase = 'revision'
              and cl.has_attempt
              and not cl.attempted_this_round
            )
          )
      ),
      '[]'::jsonb
    ),
    'masteredQuestionIds', coalesce(
      (
        select jsonb_agg(cl.question_id::text order by cl.question_id)
        from classified cl
        where cl.is_mastered
      ),
      '[]'::jsonb
    ),
    'unresolvedQuestionIds', coalesce(
      (
        select jsonb_agg(cl.question_id::text order by cl.question_id)
        from classified cl
        where cl.has_attempt and not cl.is_mastered
      ),
      '[]'::jsonb
    ),
    'attemptedThisRoundQuestionIds', coalesce(
      (
        select jsonb_agg(cl.question_id::text order by cl.question_id)
        from classified cl
        where v_scope.phase = 'revision' and cl.attempted_this_round
      ),
      '[]'::jsonb
    )
  )
  into v_result;

  return v_result;
end;
$$;

-- =============================================================================
-- 7. Atomic phase / round advance
-- =============================================================================

create or replace function public.advance_subtopic_practice_cycle(
  p_user_id uuid,
  p_subtopic_id uuid,
  p_exam_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scope public.user_practice_scope_state%rowtype;
  v_exam text;
  v_catalog bigint;
  v_unseen bigint;
  v_unresolved bigint;
  v_round_eligible bigint;
  v_prior_phase text;
begin
  if p_user_id is null or p_subtopic_id is null then
    raise exception 'invalid_scope' using errcode = '22023';
  end if;

  v_scope := public.get_or_init_subtopic_practice_scope(p_user_id, p_subtopic_id, p_exam_code);
  v_exam := v_scope.exam_code;
  v_catalog := public.count_subtopic_catalog_questions(p_subtopic_id, v_exam);

  if v_catalog = 0 then
    return jsonb_build_object(
      'phase', v_scope.phase,
      'revisionRound', v_scope.revision_round,
      'roundStartedAt', v_scope.round_started_at,
      'catalogQuestionCount', v_catalog,
      'transition', 'no_questions'
    );
  end if;

  if v_scope.phase = 'completed' then
    v_prior_phase := v_scope.phase;
    v_scope := public.reopen_subtopic_scope_from_completed(
      p_user_id,
      p_subtopic_id,
      v_exam,
      v_scope
    );

    return jsonb_build_object(
      'phase', v_scope.phase,
      'revisionRound', v_scope.revision_round,
      'roundStartedAt', v_scope.round_started_at,
      'coverageCompletedAt', v_scope.coverage_completed_at,
      'completedAt', v_scope.completed_at,
      'catalogQuestionCount', v_catalog,
      'transition', case
        when v_prior_phase = 'completed' and v_scope.phase = 'unseen' then 'reopened_unseen'
        when v_prior_phase = 'completed' and v_scope.phase = 'revision' then 'reopened_revision'
        else 'noop'
      end
    );
  end if;

  if v_scope.phase = 'unseen' then
    v_unseen := public.count_subtopic_unseen_questions(p_user_id, p_subtopic_id, v_exam);
    if v_unseen > 0 then
      return jsonb_build_object(
        'phase', v_scope.phase,
        'revisionRound', v_scope.revision_round,
        'roundStartedAt', v_scope.round_started_at,
        'catalogQuestionCount', v_catalog,
        'transition', 'remain_unseen'
      );
    end if;

    v_unresolved := public.count_subtopic_unresolved_questions(p_user_id, p_subtopic_id, v_exam);
    if v_unresolved > 0 then
      update public.user_practice_scope_state
      set
        phase = 'revision',
        revision_round = 1,
        round_started_at = now(),
        coverage_completed_at = coalesce(coverage_completed_at, now())
      where id = v_scope.id
      returning * into v_scope;

      return jsonb_build_object(
        'phase', v_scope.phase,
        'revisionRound', v_scope.revision_round,
        'roundStartedAt', v_scope.round_started_at,
        'coverageCompletedAt', v_scope.coverage_completed_at,
        'catalogQuestionCount', v_catalog,
        'transition', 'start_revision'
      );
    end if;

    update public.user_practice_scope_state
    set phase = 'completed', completed_at = now()
    where id = v_scope.id
    returning * into v_scope;

    return jsonb_build_object(
      'phase', v_scope.phase,
      'revisionRound', v_scope.revision_round,
      'completedAt', v_scope.completed_at,
      'catalogQuestionCount', v_catalog,
      'transition', 'complete'
    );
  end if;

  -- revision phase
  v_round_eligible := public.count_subtopic_revision_round_eligible(
    p_user_id, p_subtopic_id, v_exam, v_scope.round_started_at
  );

  if v_round_eligible > 0 then
    return jsonb_build_object(
      'phase', v_scope.phase,
      'revisionRound', v_scope.revision_round,
      'roundStartedAt', v_scope.round_started_at,
      'catalogQuestionCount', v_catalog,
      'transition', 'remain_revision_round'
    );
  end if;

  v_unresolved := public.count_subtopic_unresolved_questions(p_user_id, p_subtopic_id, v_exam);
  if v_unresolved > 0 then
    update public.user_practice_scope_state
    set
      revision_round = revision_round + 1,
      round_started_at = now()
    where id = v_scope.id
    returning * into v_scope;

    return jsonb_build_object(
      'phase', v_scope.phase,
      'revisionRound', v_scope.revision_round,
      'roundStartedAt', v_scope.round_started_at,
      'catalogQuestionCount', v_catalog,
      'transition', 'next_revision_round'
    );
  end if;

  update public.user_practice_scope_state
  set phase = 'completed', completed_at = now()
  where id = v_scope.id
  returning * into v_scope;

  return jsonb_build_object(
    'phase', v_scope.phase,
    'revisionRound', v_scope.revision_round,
    'completedAt', v_scope.completed_at,
    'catalogQuestionCount', v_catalog,
    'transition', 'complete'
  );
end;
$$;

-- =============================================================================
-- 8. submit_question_answer
--    - Always logs user_question_attempts (retries included)
--    - Mastery = any correct row in user_question_attempts
--    - user_attempts remains first-attempt snapshot
--    - questions.attempt_count/correct_count bump only on first attempt
--    - Retry responses still include build_scoped_progress_snapshot: the frontend
--      refetches progress when the RPC omits it, which would cost more overall.
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
  v_returned_option text;
  v_progress jsonb;
  v_is_mastered boolean;
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
    and is_verified = true;

  if not found then
    raise exception 'question_not_found' using errcode = '22023';
  end if;

  v_correct_option := upper(trim(coalesce(v_question.correct_option, '')));
  v_is_correct := v_correct_option = v_option;
  v_returned_option := v_option;

  insert into public.user_question_attempts (
    user_id, question_id, subject_id, topic_id, subtopic_id,
    selected_option, correct_option, is_correct, time_spent_seconds
  )
  values (
    p_user_id, p_question_id,
    v_question.subject_id, v_question.topic_id, v_question.subtopic_id,
    v_option, v_correct_option, v_is_correct, p_time_taken_seconds
  );

  v_is_mastered := public.is_question_mastered_for_user(p_user_id, p_question_id);

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

  if v_new_attempt_id is null then
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
      'selected_option', v_returned_option,
      'is_mastered', v_is_mastered
    ) || v_progress;
  end if;

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
    'selected_option', v_returned_option,
    'is_mastered', v_is_mastered
  ) || v_progress;
end;
$$;

-- =============================================================================
-- 9. Reset subtopic — subtopic-global (all exam_code scope rows)
-- =============================================================================

create or replace function public.reset_subtopic_practice_progress(
  p_user_id uuid,
  p_subtopic_id uuid,
  p_exam_code text default 'ALL'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  -- p_exam_code retained for API compatibility; reset ignores exam filter.
  perform public.normalize_practice_exam_code(p_exam_code);

  delete from public.user_attempts
  where user_id = p_user_id
    and subtopic_id = p_subtopic_id;

  delete from public.user_question_attempts
  where user_id = p_user_id
    and subtopic_id = p_subtopic_id;

  delete from public.user_practice_scope_state
  where user_id = p_user_id
    and scope_type = 'subtopic'
    and scope_id = p_subtopic_id;

  return true;
end;
$$;

-- =============================================================================
-- 10. Indexes (non-redundant)
-- =============================================================================

create index if not exists idx_uqa_user_question_correct
  on public.user_question_attempts (user_id, question_id)
  where is_correct = true;

create index if not exists idx_uqa_user_question_attempted_at
  on public.user_question_attempts (user_id, question_id, attempted_at desc);

-- =============================================================================
-- 11. Permissions — service_role only
--     CREATE OR REPLACE does NOT reset privileges; revoke explicitly.
-- =============================================================================

revoke all on function public.normalize_practice_exam_code(text) from public, anon, authenticated;
revoke all on function public.question_matches_practice_exam(text[], text) from public, anon, authenticated;
revoke all on function public.is_question_mastered_for_user(uuid, uuid) from public, anon, authenticated;
revoke all on function public.is_question_unresolved_for_user(uuid, uuid) from public, anon, authenticated;
revoke all on function public.is_question_unseen_for_user(uuid, uuid) from public, anon, authenticated;
revoke all on function public.was_question_attempted_in_round(uuid, uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.count_subtopic_catalog_questions(uuid, text) from public, anon, authenticated;
revoke all on function public.count_subtopic_unseen_questions(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.count_subtopic_unresolved_questions(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.count_subtopic_revision_round_eligible(uuid, uuid, text, timestamptz) from public, anon, authenticated;
revoke all on function public.reopen_subtopic_scope_from_completed(uuid, uuid, text, public.user_practice_scope_state) from public, anon, authenticated;
revoke all on function public.get_or_init_subtopic_practice_scope(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.get_subtopic_batch_question_state(uuid, uuid, text, uuid[]) from public, anon, authenticated;
revoke all on function public.advance_subtopic_practice_cycle(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.reset_subtopic_practice_progress(uuid, uuid, text) from public, anon, authenticated;

revoke all on function public.submit_question_answer(uuid, uuid, text, integer) from public;
revoke all on function public.submit_question_answer(uuid, uuid, text, integer) from anon;
revoke all on function public.submit_question_answer(uuid, uuid, text, integer) from authenticated;

grant execute on function public.get_or_init_subtopic_practice_scope(uuid, uuid, text) to service_role;
grant execute on function public.get_subtopic_batch_question_state(uuid, uuid, text, uuid[]) to service_role;
grant execute on function public.advance_subtopic_practice_cycle(uuid, uuid, text) to service_role;
grant execute on function public.reset_subtopic_practice_progress(uuid, uuid, text) to service_role;
grant execute on function public.submit_question_answer(uuid, uuid, text, integer) to service_role;

commit;
swda