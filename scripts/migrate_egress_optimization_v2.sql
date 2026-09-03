-- =============================================================================
-- QuestionWale: compact database egress paths (production-safe, idempotent)
-- =============================================================================
-- Run after:
--   scripts/migrate_performance_egress.sql
--   scripts/migrate_ssc_cgl_tier1_mock_tests.sql
--
-- This migration does not rewrite or delete application data. It moves two
-- high-volume aggregations into Postgres so only compact results cross the
-- Supabase network boundary.

begin;

-- Supports recent-test lookup without scanning a user's history for other
-- blueprints, and covers the original-question lookup for those tests.
create index if not exists mock_tests_user_blueprint_history_idx
  on public.mock_tests (user_id, blueprint_code, created_at desc, id desc);

create index if not exists mock_test_items_test_question_created_idx
  on public.mock_test_items (test_id, original_question_id, created_at);

-- Return one aggregate row per requested subtopic instead of transferring
-- every matching question ID to the Next.js server and counting in JavaScript.
create or replace function public.get_exam_question_counts_compact(
  p_exam_profile_id uuid,
  p_content_subtopic_ids uuid[],
  p_stage_codes text[] default array[]::text[]
)
returns table (
  subtopic_id uuid,
  question_count bigint
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  select q.subtopic_id, count(distinct q.id)::bigint
  from public.exam_profiles ep
  join public.question_exam_profile_mappings qm
    on qm.exam_profile_id = ep.id
   and qm.is_active is true
  join public.questions q
    on q.id = qm.question_id
   and q.is_active is true
   and q.is_verified is true
  where ep.id = p_exam_profile_id
    and ep.is_active is true
    and q.subtopic_id = any(coalesce(p_content_subtopic_ids, array[]::uuid[]))
    and (
      coalesce(cardinality(p_stage_codes), 0) = 0
      or qm.stage_codes && p_stage_codes
    )
  group by q.subtopic_id
$function$;

revoke all on function public.get_exam_question_counts_compact(uuid, uuid[], text[])
  from public, anon, authenticated;
grant execute on function public.get_exam_question_counts_compact(uuid, uuid[], text[])
  to service_role;

-- Enrich the already-compact candidate inventory inside Postgres. Previously
-- the application downloaded up to 10,000 attempt rows plus recent test rows
-- on every generation merely to mark candidate preferences.
create or replace function public.get_mock_test_candidates_for_user(
  p_blueprint_code text,
  p_user_id uuid,
  p_allow_provisional boolean default false,
  p_recent_test_limit integer default 5
)
returns table (
  question_id uuid,
  section_key text,
  bucket_key text,
  difficulty_band text,
  correct_option text,
  event_date date,
  group_id uuid,
  group_order smallint,
  group_size smallint,
  recently_used boolean,
  previously_attempted boolean,
  last_seen_at timestamptz
)
language sql
security definer
set search_path = pg_catalog, public
as $function$
  with eligible as materialized (
    select candidate.*
    from public.get_mock_test_candidates(
      p_blueprint_code,
      coalesce(p_allow_provisional, false)
    ) candidate
  ), recent_tests as materialized (
    select test.id
    from public.mock_tests test
    where test.user_id = p_user_id
      and test.blueprint_code = p_blueprint_code
    order by test.created_at desc, test.id desc
    limit least(greatest(coalesce(p_recent_test_limit, 5), 0), 20)
  ), recent_questions as (
    select
      item.original_question_id as question_id,
      min(item.created_at) as last_seen_at
    from public.mock_test_items item
    join recent_tests test on test.id = item.test_id
    group by item.original_question_id
  )
  select
    candidate.question_id,
    candidate.section_key,
    candidate.bucket_key,
    candidate.difficulty_band,
    candidate.correct_option,
    candidate.event_date,
    candidate.group_id,
    candidate.group_order,
    candidate.group_size,
    recent.question_id is not null as recently_used,
    exists (
      select 1
      from public.user_attempts attempt
      where attempt.user_id = p_user_id
        and attempt.question_id = candidate.question_id
    ) as previously_attempted,
    recent.last_seen_at
  from eligible candidate
  left join recent_questions recent on recent.question_id = candidate.question_id
  order by
    candidate.section_key,
    candidate.bucket_key,
    candidate.difficulty_band,
    candidate.question_id
$function$;

revoke all on function public.get_mock_test_candidates_for_user(text, uuid, boolean, integer)
  from public, anon, authenticated;
grant execute on function public.get_mock_test_candidates_for_user(text, uuid, boolean, integer)
  to service_role;

notify pgrst, 'reload schema';

commit;
