-- Read-only verification after both generic base and SSC CHSL migrations.
begin read only;

do $verify$
declare
  v_blueprint public.mock_test_blueprints%rowtype;
  v_count integer;
begin
  select b.* into strict v_blueprint
  from public.mock_test_blueprints b
  join public.exam_profiles ep on ep.id = b.exam_profile_id
  where b.code = 'ssc-chsl-tier1-2025-v1'
    and ep.code = 'SSC_CHSL'
    and ep.slug = 'ssc-combined-higher-secondary-level-examination'
    and ep.is_active is true;

  if v_blueprint.rules ->> 'timing_strategy' <> 'global'
     or (v_blueprint.rules ->> 'standard_total_seconds')::integer <> 3600
     or (v_blueprint.rules ->> 'scribe_total_seconds')::integer <> 4800
     or v_blueprint.rules ? 'standard_section_seconds' then
    raise exception 'SSC CHSL frozen timing rules are not global 60/80 minute rules';
  end if;
  if v_blueprint.is_production_ready then raise exception 'Unreviewed SSC CHSL blueprint is unexpectedly production ready'; end if;

  select count(*) into v_count from public.mock_test_blueprint_cells where blueprint_id = v_blueprint.id;
  if v_count <> 40 then raise exception 'Expected 40 CHSL cells; found %', v_count; end if;
  select count(*) into v_count from (
    select section_key from public.mock_test_blueprint_cells where blueprint_id = v_blueprint.id
    group by section_key having count(*) < 1 or sum(target_count) <> 25
  ) invalid;
  if v_count <> 0 then raise exception 'A CHSL section does not total 25'; end if;

  if has_function_privilege('anon', 'public.get_mock_test_candidates(text,boolean)', 'execute')
     or has_function_privilege('authenticated', 'public.get_mock_test_candidates(text,boolean)', 'execute')
     or has_table_privilege('authenticated', 'public.mock_test_item_answers', 'select') then
    raise exception 'Browser role can access a private mock-test capability';
  end if;

  select count(*) into v_count
  from public.mock_tests t
  where t.blueprint_code = v_blueprint.code
    and (
      t.total_questions <> 100
      or t.correct_count + t.wrong_count <> t.attempted_count
      or t.attempted_count + t.unanswered_count <> 100
      or (t.final_score is not null and t.final_score <> t.positive_marks - t.negative_marks)
    );
  if v_count <> 0 then raise exception 'Persisted CHSL score/count invariant failed'; end if;
end
$verify$;

select * from public.get_mock_test_readiness('ssc-chsl-tier1-2025-v1');

explain (costs, verbose)
select f.question_id, f.section_key, f.bucket_key, f.difficulty_band, f.group_id
from public.question_mock_facets f
where f.blueprint_code = 'ssc-chsl-tier1-2025-v1'
  and f.section_key = 'english'
  and f.bucket_key = 'error_improvement'
  and f.reviewer_status = 'verified'
  and f.is_active is true
order by f.difficulty_band, f.question_id
limit 250;

explain (costs, verbose)
select id, status, created_at, final_score
from public.mock_tests
where user_id = '00000000-0000-0000-0000-000000000000'::uuid
order by created_at desc, id desc
limit 20;

rollback;

