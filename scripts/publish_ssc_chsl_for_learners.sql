-- Publish the reviewed SSC CHSL hierarchy and make it selectable.
-- Safe to rerun: all updates are deterministic and guarded by exact identities.

begin;

do $publish$
declare
  v_profile_id uuid;
  v_version_id uuid;
  v_count bigint;
  v_subjects bigint;
  v_topics bigint;
  v_subtopics bigint;
  v_questions bigint;
  v_can_select boolean;
  v_reason text;
begin
  select p.id
    into strict v_profile_id
  from public.exam_profiles p
  where p.code = 'SSC_CHSL'
    and p.slug = 'ssc-combined-higher-secondary-level-examination'
    and p.is_active is true;

  select v.id
    into strict v_version_id
  from public.exam_syllabus_versions v
  where v.exam_profile_id = v_profile_id
    and v.version_code = 'SSC_CHSL_2025_OPERATIONAL_V1'
    and v.publication_status in ('in_review', 'published');

  select count(*) into v_count
  from public.exam_syllabus_versions v
  where v.exam_profile_id = v_profile_id
    and v.id <> v_version_id
    and v.publication_status = 'published'
    and v.is_current is true;
  if v_count <> 0 then
    raise exception 'SSC CHSL publish blocked: another current published version exists';
  end if;

  select
    count(*) filter (where n.node_type = 'subject' and n.parent_node_id is null),
    count(*) filter (where n.node_type = 'topic'),
    count(*) filter (where n.node_type = 'subtopic')
  into v_subjects, v_topics, v_subtopics
  from public.exam_syllabus_nodes n
  where n.syllabus_version_id = v_version_id
    and n.is_active is true;
  if (v_subjects, v_topics, v_subtopics) <> (5::bigint, 38::bigint, 251::bigint) then
    raise exception 'SSC CHSL hierarchy expected 5/38/251, found %/%/%',
      v_subjects, v_topics, v_subtopics;
  end if;

  select count(*) into v_count
  from public.exam_syllabus_nodes n
  left join public.subtopics content
    on content.id::text = nullif(trim(n.metadata ->> 'canonical_subtopic_id'), '')
   and content.is_active is true
  where n.syllabus_version_id = v_version_id
    and n.node_type = 'subtopic'
    and n.is_active is true
    and content.id is null;
  if v_count <> 0 then
    raise exception 'SSC CHSL publish blocked: % active subtopics lack a valid canonical catalog link', v_count;
  end if;

  select count(*) into v_count
  from (
    select n.metadata ->> 'canonical_subtopic_id' as content_subtopic_id
    from public.exam_syllabus_nodes n
    where n.syllabus_version_id = v_version_id
      and n.node_type = 'subtopic'
      and n.is_active is true
    group by n.metadata ->> 'canonical_subtopic_id'
    having count(*) > 1
  ) duplicates;
  if v_count <> 0 then
    raise exception 'SSC CHSL publish blocked: % canonical catalog links are duplicated', v_count;
  end if;

  select count(*) into v_count
  from (
    select distinct q.subtopic_id
    from public.question_exam_profile_mappings m
    join public.questions q
      on q.id = m.question_id
     and q.is_active is true
     and q.is_verified is true
    where m.exam_profile_id = v_profile_id
      and m.is_active is true
  ) question_content
  left join public.exam_syllabus_nodes n
    on n.syllabus_version_id = v_version_id
   and n.node_type = 'subtopic'
   and n.is_active is true
   and n.metadata ->> 'canonical_subtopic_id' = question_content.subtopic_id::text
  where n.id is null;
  if v_count <> 0 then
    raise exception 'SSC CHSL publish blocked: % question subtopics are outside the reviewed hierarchy', v_count;
  end if;

  update public.exam_syllabus_nodes n
  set metadata = coalesce(n.metadata, '{}'::jsonb) || jsonb_build_object(
        'content_subtopic_id', n.metadata ->> 'canonical_subtopic_id',
        'catalog_subtopic_id', n.metadata ->> 'canonical_subtopic_id',
        'content_mapping_status', 'linked',
        'content_mapping_source', 'canonical_subtopic_id',
        'content_mapping_version', 'SSC_CHSL_2025_OPERATIONAL_V1'
      )
  where n.syllabus_version_id = v_version_id
    and n.node_type = 'subtopic'
    and n.is_active is true;

  select count(*) into v_count
  from public.exam_syllabus_nodes n
  join public.subtopics content
    on content.id::text = n.metadata ->> 'content_subtopic_id'
   and content.is_active is true
  where n.syllabus_version_id = v_version_id
    and n.node_type = 'subtopic'
    and n.is_active is true
    and n.metadata ->> 'catalog_subtopic_id' = content.id::text;
  if v_count <> 251 then
    raise exception 'SSC CHSL link verification expected 251, found %', v_count;
  end if;

  -- Materialize the exact learner-visible hierarchy for both CHSL stages.
  -- Tier 1 contains the four non-qualifying CBT subjects. Tier 2 contains
  -- the complete objective hierarchy plus the separately rendered qualifying
  -- Skill/Typing Test nodes. This avoids title-based filtering at request time.
  insert into public.exam_syllabus_node_stage_mappings (
    exam_profile_id,
    syllabus_version_id,
    node_id,
    stage_code,
    tier_code,
    paper_code,
    stage_tag,
    is_active,
    metadata,
    updated_at
  )
  select
    v_profile_id,
    v_version_id,
    n.id,
    stage.stage_code,
    stage.stage_code,
    null,
    stage.stage_tag,
    true,
    jsonb_build_object(
      'managed_by', 'SSC_CHSL_2025_OPERATIONAL_V1',
      'scope_rule', stage.scope_rule
    ),
    now()
  from public.exam_syllabus_nodes n
  cross join (
    values
      ('TIER_I'::text, 'SSC_CHSL_TIER_1'::text, 'non_qualifying_objective_hierarchy'::text),
      ('TIER_II'::text, 'SSC_CHSL_TIER_2'::text, 'complete_objective_and_qualifying_scope'::text)
  ) as stage(stage_code, stage_tag, scope_rule)
  where n.syllabus_version_id = v_version_id
    and n.is_active is true
    and (
      stage.stage_code = 'TIER_II'
      or (
        stage.stage_code = 'TIER_I'
        and n.node_type in ('subject', 'topic', 'subtopic')
        and n.is_qualifying is false
      )
    )
  on conflict (syllabus_version_id, node_id, stage_code) do update
  set exam_profile_id = excluded.exam_profile_id,
      tier_code = excluded.tier_code,
      paper_code = excluded.paper_code,
      stage_tag = excluded.stage_tag,
      is_active = true,
      metadata = excluded.metadata,
      updated_at = now();

  select count(*) into v_count
  from public.exam_syllabus_node_stage_mappings m
  where m.exam_profile_id = v_profile_id
    and m.syllabus_version_id = v_version_id
    and m.stage_code = 'TIER_I'
    and m.is_active is true;
  if v_count <> (
    select count(*)
    from public.exam_syllabus_nodes n
    where n.syllabus_version_id = v_version_id
      and n.is_active is true
      and n.node_type in ('subject', 'topic', 'subtopic')
      and n.is_qualifying is false
  ) then
    raise exception 'SSC CHSL Tier 1 node-stage mapping audit failed';
  end if;

  select count(*) into v_count
  from public.exam_syllabus_node_stage_mappings m
  where m.exam_profile_id = v_profile_id
    and m.syllabus_version_id = v_version_id
    and m.stage_code = 'TIER_II'
    and m.is_active is true;
  if v_count <> (
    select count(*)
    from public.exam_syllabus_nodes n
    where n.syllabus_version_id = v_version_id
      and n.is_active is true
  ) then
    raise exception 'SSC CHSL Tier 2 node-stage mapping audit failed';
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
        from unnest(m.stage_codes) as supplied(stage_code)
        where supplied.stage_code not in ('TIER_I', 'TIER_II')
      )
    );
  if v_count <> 0 then
    raise exception 'SSC CHSL publish blocked: % verified question mappings have invalid stage codes', v_count;
  end if;

  update public.exam_syllabus_versions
  set publication_status = 'published',
      is_current = true
  where id = v_version_id;

  update public.exam_profiles
  set scope_status = 'scope_ready',
      is_selectable = true,
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'frontend_visibility', 'enabled',
        'content_mapping_status', 'syllabus_navigation_ready',
        'syllabus_hierarchy_status', 'published_for_learners',
        'syllabus_database_version', 'SSC_CHSL_2025_OPERATIONAL_V1',
        'unique_content_subjects', 5,
        'topics', 38,
        'subtopics', 251
      )
  where id = v_profile_id;

  select active_subject_count, active_topic_count, active_subtopic_count,
         verified_question_count, can_select, availability_reason
  into v_subjects, v_topics, v_subtopics, v_questions, v_can_select, v_reason
  from public.exam_selector_options
  where exam_profile_id = v_profile_id;

  if (v_subjects, v_topics, v_subtopics) <> (5::bigint, 38::bigint, 251::bigint) then
    raise exception 'SSC CHSL selector expected 5/38/251, found %/%/%',
      v_subjects, v_topics, v_subtopics;
  end if;
  if v_questions < 2300 then
    raise exception 'SSC CHSL selector expected at least 2300 verified questions, found %', v_questions;
  end if;
  if v_can_select is not true or v_reason <> 'ready' then
    raise exception 'SSC CHSL selector is not ready: can_select %, reason %',
      v_can_select, coalesce(v_reason, '<null>');
  end if;
end
$publish$;

notify pgrst, 'reload schema';

commit;
