-- Read-only post-migration verification for SSC CGL Tier 1 mock tests.
-- Run in the intended Supabase database before enabling either rollout flag.

begin transaction read only;

do $verify$
declare
  v_missing text;
  v_count integer;
  v_blueprint_id uuid;
begin
  select string_agg(name, ', ' order by name) into v_missing
  from unnest(array[
    'public.mock_test_blueprints',
    'public.mock_test_blueprint_cells',
    'public.question_mock_groups',
    'public.question_mock_facets',
    'public.mock_test_generation_requests',
    'public.mock_tests',
    'public.mock_test_group_snapshots',
    'public.mock_test_items',
    'public.mock_test_item_answers',
    'public.mock_test_responses',
    'public.mock_test_section_attempts',
    'public.mock_test_generation_audit'
  ]) required(name)
  where to_regclass(required.name) is null;
  if v_missing is not null then raise exception 'Mock migration objects missing: %', v_missing; end if;

  select id into strict v_blueprint_id
  from public.mock_test_blueprints
  where code = 'ssc-cgl-tier1-2026-v1';

  select count(*) into v_count from public.mock_test_blueprint_cells where blueprint_id = v_blueprint_id;
  if v_count <> 39 then raise exception 'Expected 39 cells; found %', v_count; end if;

  select count(*) into v_count from (
    select section_key from public.mock_test_blueprint_cells
    where blueprint_id = v_blueprint_id
    group by section_key
    having sum(target_count) <> 25
  ) invalid;
  if v_count <> 0 then raise exception 'A section target does not total 25'; end if;

  if (select is_production_ready from public.mock_test_blueprints where id = v_blueprint_id) then
    raise exception 'The provisional bootstrap blueprint was unexpectedly marked production-ready';
  end if;

  select count(*) into v_count
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in (
      'mock_test_blueprints','mock_test_blueprint_cells','question_mock_groups','question_mock_facets',
      'mock_test_generation_requests','mock_tests','mock_test_group_snapshots','mock_test_items','mock_test_item_answers',
      'mock_test_responses','mock_test_section_attempts','mock_test_generation_audit'
    )
    and c.relrowsecurity is not true;
  if v_count <> 0 then raise exception 'One or more mock tables do not have RLS enabled'; end if;

  if has_table_privilege('anon', 'public.mock_test_item_answers', 'select')
     or has_table_privilege('authenticated', 'public.mock_test_item_answers', 'select') then
    raise exception 'Browser roles can select the private answer table';
  end if;

  if has_function_privilege('anon', 'public.create_mock_test_from_selection(uuid,text,text,text,jsonb,jsonb,jsonb,boolean)', 'execute')
     or has_function_privilege('authenticated', 'public.create_mock_test_from_selection(uuid,text,text,text,jsonb,jsonb,jsonb,boolean)', 'execute') then
    raise exception 'Browser roles can execute the private generation RPC';
  end if;
  if has_function_privilege('anon', 'public.get_mock_test_candidates(text,boolean)', 'execute')
     or has_function_privilege('authenticated', 'public.get_mock_test_candidates(text,boolean)', 'execute') then
    raise exception 'Browser roles can enumerate private candidates or answer keys';
  end if;

  select count(*) into v_count from public.mock_tests
  where correct_count + wrong_count <> attempted_count
     or attempted_count + unanswered_count <> 100
     or (final_score is not null and final_score <> positive_marks - negative_marks);
  if v_count <> 0 then raise exception 'Persisted mock-test score invariants are invalid'; end if;

  select count(*) into v_count from (
    select test_id, section_key from public.mock_test_items
    group by test_id, section_key having count(*) <> 25
  ) invalid_sections;
  if v_count <> 0 then raise exception 'A persisted mock section does not contain 25 items'; end if;

  select count(*) into v_count from (
    select test_id from public.mock_test_items
    group by test_id having count(*) <> 100 or count(distinct original_question_id) <> 100
  ) invalid_tests;
  if v_count <> 0 then raise exception 'A persisted mock is incomplete or contains duplicate questions'; end if;
end
$verify$;

-- Readiness gap report. Production-ready remains false until a reviewed data
-- migration promotes eligible facets/groups and every returned bucket passes.
select * from public.get_mock_test_readiness('ssc-cgl-tier1-2026-v1');

-- Candidate-pool plan: should use question_mock_facets_candidate_idx and PK/FK indexes.
explain (costs, verbose)
select f.question_id, f.section_key, f.bucket_key, f.difficulty_band, f.group_id
from public.question_mock_facets f
join public.questions q on q.id = f.question_id and q.is_active is true and q.is_verified is true
where f.blueprint_code = 'ssc-cgl-tier1-2026-v1'
  and f.section_key = 'reasoning'
  and f.bucket_key = 'series'
  and f.reviewer_status = 'verified'
  and f.is_active is true
limit 200;

-- User-history plan: should use mock_tests_user_history_idx.
explain (costs, verbose)
select id, test_number, status, created_at, final_score
from public.mock_tests
where user_id = (select user_id from public.mock_tests order by created_at desc limit 1)
order by created_at desc, id desc
limit 20;

rollback;
