-- Read-only SSC CHSL logged-in ecosystem verification.
-- Run after publish_ssc_chsl_for_learners.sql and
-- migrate_generic_exam_preparation_preferences.sql.

do $verify$
declare
  v_profile_id uuid;
  v_version_id uuid;
  v_expected bigint;
  v_actual bigint;
  v_count bigint;
begin
  if to_regclass('public.exam_preparation_track_options') is null then
    raise exception 'SSC CHSL verification failed: exam_preparation_track_options is missing';
  end if;

  select p.id into strict v_profile_id
  from public.exam_profiles p
  where p.code = 'SSC_CHSL'
    and p.slug = 'ssc-combined-higher-secondary-level-examination'
    and p.is_active is true
    and p.is_selectable is true;

  select v.id into strict v_version_id
  from public.exam_syllabus_versions v
  where v.exam_profile_id = v_profile_id
    and v.version_code = 'SSC_CHSL_2025_OPERATIONAL_V1'
    and v.publication_status = 'published'
    and v.is_current is true;

  select count(*) into v_expected
  from public.exam_syllabus_nodes n
  where n.syllabus_version_id = v_version_id
    and n.is_active is true
    and n.node_type in ('subject', 'topic', 'subtopic')
    and n.is_qualifying is false;

  select count(*) into v_actual
  from public.exam_syllabus_node_stage_mappings m
  where m.exam_profile_id = v_profile_id
    and m.syllabus_version_id = v_version_id
    and m.stage_code = 'TIER_I'
    and m.stage_tag = 'SSC_CHSL_TIER_1'
    and m.is_active is true;
  if v_actual <> v_expected then
    raise exception 'SSC CHSL Tier I mapping mismatch: expected %, found %', v_expected, v_actual;
  end if;

  select count(*) into v_expected
  from public.exam_syllabus_nodes n
  where n.syllabus_version_id = v_version_id
    and n.is_active is true;

  select count(*) into v_actual
  from public.exam_syllabus_node_stage_mappings m
  where m.exam_profile_id = v_profile_id
    and m.syllabus_version_id = v_version_id
    and m.stage_code = 'TIER_II'
    and m.stage_tag = 'SSC_CHSL_TIER_2'
    and m.is_active is true;
  if v_actual <> v_expected then
    raise exception 'SSC CHSL Tier II mapping mismatch: expected %, found %', v_expected, v_actual;
  end if;

  select count(*) into v_count
  from public.exam_preparation_track_options t
  where t.exam_profile_id = v_profile_id
    and t.stage_code in ('TIER_I', 'TIER_II')
    and t.preparation_mode = 'MCQ'
    and t.verified_question_count > 0
    and t.is_available is true;
  if v_count <> 2 then
    raise exception 'SSC CHSL expected two available MCQ tracks, found %', v_count;
  end if;

  select count(*) into v_count
  from public.exam_preparation_track_options t
  where t.exam_profile_id = v_profile_id
    and (
      t.tier_code is not null
      or t.stage_code not in ('TIER_I', 'TIER_II')
      or t.preparation_mode <> 'MCQ'
    );
  if v_count <> 0 then
    raise exception 'SSC CHSL track contract contains % invalid rows', v_count;
  end if;

  select count(*) into v_count
  from public.question_exam_profile_mappings m
  join public.questions q
    on q.id = m.question_id
   and q.is_active is true
   and q.is_verified is true
  where m.exam_profile_id = v_profile_id
    and m.is_active is true
    and (
      coalesce(cardinality(m.stage_codes), 0) = 0
      or (m.stage_codes && array['TIER_I', 'TIER_II']::text[]) is not true
      or exists (
        select 1
        from unnest(m.stage_codes) supplied(stage_code)
        where supplied.stage_code not in ('TIER_I', 'TIER_II')
      )
    );
  if v_count <> 0 then
    raise exception 'SSC CHSL has % invalid verified question stage mappings', v_count;
  end if;

  if not exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'user_exam_preferences'
      and c.column_name = 'preparation_mode'
      and c.is_nullable = 'NO'
  ) then
    raise exception 'SSC CHSL verification failed: generic preference schema is missing';
  end if;
end
$verify$;

select
  t.stage_code,
  t.stage_title,
  t.paper_or_section,
  t.verified_question_count,
  t.qualifying_skill_test_count,
  t.is_available
from public.exam_preparation_track_options t
join public.exam_profiles p on p.id = t.exam_profile_id
where p.code = 'SSC_CHSL'
order by t.sort_order;
