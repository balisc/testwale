-- QuestionWale: exact exam-selector readiness and SSC CGL Tier availability.
-- Safe to rerun. This file never creates or populates a competing question map.

begin;

-- Fail before changing objects when the deployed schema does not match the
-- exact-exam architecture this migration depends on.
do $$
declare
  v_missing text;
begin
  select string_agg(required_name, ', ' order by required_name)
  into v_missing
  from unnest(array[
    'public.exams',
    'public.exam_profiles',
    'public.exam_profile_stages',
    'public.exam_syllabus_versions',
    'public.exam_syllabus_nodes',
    'public.exam_syllabus_node_stage_mappings',
    'public.subtopics',
    'public.questions',
    'public.question_exam_profile_mappings',
    'public.ssc_cgl_stage_catalog_v2',
    'public.ssc_cgl_tier_subjects_v2',
    'public.ssc_cgl_tier_taxonomy_paths_v2',
    'public.ssc_cgl_tier_1_subjects_v2',
    'public.ssc_cgl_tier_1_taxonomy_v2',
    'public.ssc_cgl_tier_2_subjects_v2',
    'public.ssc_cgl_tier_2_taxonomy_v2',
    'public.ssc_cgl_tier_2_paper_1_taxonomy_v2',
    'public.ssc_cgl_tier_2_paper_2_taxonomy_v2',
    'public.ssc_cgl_tier_2_paper_3_taxonomy_v2',
    'public.ssc_cgl_tier_skill_tests_v2',
    'public.ssc_cgl_tier_scope_summary_v2',
    'public.ssc_cgl_tier_tag_audit_v2'
  ]) as required(required_name)
  where to_regclass(required_name) is null;

  if v_missing is not null then
    raise exception 'exam selector preflight failed; missing required relations: %', v_missing;
  end if;
end;
$$;

do $$
declare
  v_missing text;
  v_wrong text;
begin
  with required_columns(table_name, column_name) as (
    values
      ('exams', 'id'), ('exams', 'code'), ('exams', 'is_active'),
      ('exam_profiles', 'id'), ('exam_profiles', 'code'),
      ('exam_profiles', 'slug'), ('exam_profiles', 'title'),
      ('exam_profiles', 'short_name'), ('exam_profiles', 'family_code'),
      ('exam_profiles', 'legacy_exam_tag'), ('exam_profiles', 'conducting_body'),
      ('exam_profiles', 'profile_category'), ('exam_profiles', 'product_group'),
      ('exam_profiles', 'recurrence_status'), ('exam_profiles', 'scope_status'),
      ('exam_profiles', 'is_active'), ('exam_profiles', 'metadata'),
      ('exam_profiles', 'sort_order'),
      ('exam_syllabus_versions', 'id'), ('exam_syllabus_versions', 'exam_profile_id'),
      ('exam_syllabus_versions', 'publication_status'), ('exam_syllabus_versions', 'is_current'),
      ('exam_syllabus_nodes', 'id'), ('exam_syllabus_nodes', 'syllabus_version_id'),
      ('exam_syllabus_nodes', 'parent_node_id'), ('exam_syllabus_nodes', 'node_type'),
      ('exam_syllabus_nodes', 'is_active'), ('exam_syllabus_nodes', 'metadata'),
      ('questions', 'id'), ('questions', 'is_active'), ('questions', 'is_verified'),
      ('questions', 'subtopic_id'),
      ('subtopics', 'id'), ('subtopics', 'is_active'),
      ('question_exam_profile_mappings', 'question_id'),
      ('question_exam_profile_mappings', 'exam_profile_id'),
      ('question_exam_profile_mappings', 'stage_codes'),
      ('question_exam_profile_mappings', 'is_active')
  )
  select string_agg(format('public.%I.%I', r.table_name, r.column_name), ', ' order by 1)
  into v_missing
  from required_columns r
  left join information_schema.columns c
    on c.table_schema = 'public'
   and c.table_name = r.table_name
   and c.column_name = r.column_name
  where c.column_name is null;

  if v_missing is not null then
    raise exception 'exam selector preflight failed; missing required columns: %', v_missing;
  end if;

  with expected(table_name, column_name, udt_name) as (
    values
      ('exams', 'id', 'uuid'),
      ('exam_profiles', 'id', 'uuid'),
      ('exam_profiles', 'metadata', 'jsonb'),
      ('exam_syllabus_versions', 'id', 'uuid'),
      ('exam_syllabus_versions', 'exam_profile_id', 'uuid'),
      ('exam_syllabus_nodes', 'id', 'uuid'),
      ('exam_syllabus_nodes', 'syllabus_version_id', 'uuid'),
      ('exam_syllabus_nodes', 'parent_node_id', 'uuid'),
      ('exam_syllabus_nodes', 'metadata', 'jsonb'),
      ('questions', 'id', 'uuid'),
      ('questions', 'subtopic_id', 'uuid'),
      ('questions', 'is_active', 'bool'),
      ('questions', 'is_verified', 'bool'),
      ('subtopics', 'id', 'uuid'),
      ('subtopics', 'is_active', 'bool'),
      ('question_exam_profile_mappings', 'question_id', 'uuid'),
      ('question_exam_profile_mappings', 'exam_profile_id', 'uuid'),
      ('question_exam_profile_mappings', 'stage_codes', '_text'),
      ('question_exam_profile_mappings', 'is_active', 'bool')
  )
  select string_agg(
    format('public.%I.%I expected %s, found %s', e.table_name, e.column_name, e.udt_name, coalesce(c.udt_name, '<missing>')),
    '; ' order by e.table_name, e.column_name
  )
  into v_wrong
  from expected e
  left join information_schema.columns c
    on c.table_schema = 'public'
   and c.table_name = e.table_name
   and c.column_name = e.column_name
  where c.udt_name is distinct from e.udt_name;

  if v_wrong is not null then
    raise exception 'exam selector preflight failed; incompatible column types: %', v_wrong;
  end if;
end;
$$;

-- Stable identities must be unambiguous. Multiple current published versions
-- are deliberately not aborted here: the selector reports that state using
-- multiple_current_published_syllabi and keeps the profile unavailable.
do $$
declare
  v_duplicates text;
  v_cgl_count integer;
begin
  select string_agg(format('%s (%s rows)', value, row_count), ', ' order by value)
  into v_duplicates
  from (
    select ep.code as value, count(*)::integer as row_count
    from public.exam_profiles ep
    where ep.is_active is true
    group by ep.code
    having count(*) > 1
  ) d;
  if v_duplicates is not null then
    raise exception 'exam selector preflight failed; duplicate active exam profile codes: %', v_duplicates;
  end if;

  select string_agg(format('%s (%s rows)', value, row_count), ', ' order by value)
  into v_duplicates
  from (
    select ep.slug as value, count(*)::integer as row_count
    from public.exam_profiles ep
    where ep.is_active is true
    group by ep.slug
    having count(*) > 1
  ) d;
  if v_duplicates is not null then
    raise exception 'exam selector preflight failed; duplicate active exam profile slugs: %', v_duplicates;
  end if;

  select count(*)::integer into v_cgl_count
  from public.exam_profiles ep
  where ep.code = 'SSC_CGL'
    and ep.slug = 'ssc-combined-graduate-level-examination'
    and ep.is_active is true;
  if v_cgl_count <> 1 then
    raise exception 'exam selector preflight failed; expected exactly one active SSC_CGL profile, found %', v_cgl_count;
  end if;
end;
$$;

-- Preserve any previously-applied unsafe proposal for an explicit archive
-- decision. Report its size and dependencies without reading it for readiness.
do $$
declare
  v_rows bigint;
  v_dependencies bigint;
begin
  if to_regclass('public.exam_syllabus_question_mappings') is not null then
    execute 'select count(*)::bigint from public.exam_syllabus_question_mappings' into v_rows;
    select count(*)::bigint into v_dependencies
    from pg_depend d
    where d.refobjid = to_regclass('public.exam_syllabus_question_mappings');
    raise notice 'legacy public.exam_syllabus_question_mappings detected: % rows, % catalog dependencies. It was not read, written, or dropped.',
      v_rows, v_dependencies;
  end if;
end;
$$;

-- Current-version SSC CGL regression audit. Resolve by stable code and slug;
-- never hardcode a database UUID.
do $$
declare
  v_version_count bigint;
  v_active_nodes bigint;
  v_subjects bigint;
  v_topics bigint;
  v_subtopics bigint;
  v_skills bigint;
  v_broken bigint;
  v_inactive bigint;
  v_unlinked_operational_subtopics bigint;
begin
  select count(*)::bigint into v_version_count
  from public.exam_syllabus_versions v
  join public.exam_profiles ep on ep.id = v.exam_profile_id
  where ep.code = 'SSC_CGL'
    and ep.slug = 'ssc-combined-graduate-level-examination'
    and ep.is_active is true
    and v.publication_status = 'published'
    and v.is_current is true;
  if v_version_count <> 1 then
    raise exception 'SSC CGL audit failed; expected exactly one current published version, found %', v_version_count;
  end if;

  with cgl_version as (
    select v.id
    from public.exam_syllabus_versions v
    join public.exam_profiles ep on ep.id = v.exam_profile_id
    where ep.code = 'SSC_CGL'
      and ep.slug = 'ssc-combined-graduate-level-examination'
      and ep.is_active is true
      and v.publication_status = 'published'
      and v.is_current is true
  ), stage_paths as (
    select stage_code, subject_id, topic_id, subtopic_id
    from public.ssc_cgl_tier_taxonomy_paths_v2
    where navigation_visible is true
  ), audit as (
    select
      count(distinct (p.stage_code, p.subject_id))::bigint as subjects,
      count(distinct (p.stage_code, p.topic_id))::bigint as topics,
      count(distinct (p.stage_code, p.subtopic_id))::bigint as subtopics,
      count(*) filter (
        where s.id is null or t.id is null or st.id is null
           or t.parent_node_id is distinct from p.subject_id
           or st.parent_node_id is distinct from p.topic_id
      )::bigint as broken,
      count(*) filter (
        where s.is_active is not true or t.is_active is not true or st.is_active is not true
      )::bigint as inactive
    from stage_paths p
    left join public.exam_syllabus_nodes s on s.id = p.subject_id
    left join public.exam_syllabus_nodes t on t.id = p.topic_id
    left join public.exam_syllabus_nodes st on st.id = p.subtopic_id
  )
  select
    (select count(*)::bigint from public.exam_syllabus_nodes n join cgl_version v on v.id = n.syllabus_version_id where n.is_active is true),
    a.subjects, a.topics, a.subtopics,
    (select count(*)::bigint from public.ssc_cgl_tier_skill_tests_v2),
    a.broken, a.inactive
  into v_active_nodes, v_subjects, v_topics, v_subtopics, v_skills, v_broken, v_inactive
  from audit a;

  if (v_active_nodes, v_subjects, v_topics, v_subtopics, v_skills, v_broken, v_inactive)
     <> (430::bigint, 11::bigint, 85::bigint, 493::bigint, 1::bigint, 0::bigint, 0::bigint) then
    raise exception 'SSC CGL audit failed; expected nodes/subjects/topics/subtopics/skills/broken/inactive = 430/11/85/493/1/0/0, found %/%/%/%/%/%/%',
      v_active_nodes, v_subjects, v_topics, v_subtopics, v_skills, v_broken, v_inactive;
  end if;
  if v_subjects + v_topics + v_subtopics + v_skills <> 590 then
    raise exception 'SSC CGL audit failed; expected 590 node-stage placements, found %',
      v_subjects + v_topics + v_subtopics + v_skills;
  end if;

  with cgl_version as (
    select v.id
    from public.exam_syllabus_versions v
    join public.exam_profiles ep on ep.id = v.exam_profile_id
    where ep.code = 'SSC_CGL'
      and ep.slug = 'ssc-combined-graduate-level-examination'
      and ep.is_active is true
      and v.publication_status = 'published'
      and v.is_current is true
  )
  select count(distinct p.subtopic_id)::bigint
  into v_unlinked_operational_subtopics
  from public.ssc_cgl_tier_taxonomy_paths_v2 p
  join public.exam_syllabus_nodes n
    on n.id = p.subtopic_id
   and n.syllabus_version_id = (select id from cgl_version)
   and n.is_active is true
  left join public.subtopics content
    on content.id::text = coalesce(
      nullif(trim(to_jsonb(n.metadata) ->> 'content_subtopic_id'), ''),
      nullif(trim(to_jsonb(n.metadata) ->> 'catalog_subtopic_id'), '')
    )
   and content.is_active is true
  where p.navigation_visible is true
    and lower(trim(coalesce(to_jsonb(n.metadata) ->> 'operational', 'true')))
        not in ('false', 'f', '0', 'no', 'n', 'off')
    and content.id is null;

  if v_unlinked_operational_subtopics > 0 then
    raise exception 'SSC CGL audit failed; % operational subtopics lack an explicit active content_subtopic_id/catalog_subtopic_id link',
      v_unlinked_operational_subtopics;
  end if;
end;
$$;

create or replace view public.exam_selector_options as
with version_counts as (
  select v.exam_profile_id, count(*)::bigint as current_published_count
  from public.exam_syllabus_versions v
  where v.publication_status = 'published' and v.is_current is true
  group by v.exam_profile_id
), single_current_versions as (
  select v.id, v.exam_profile_id
  from public.exam_syllabus_versions v
  join version_counts vc
    on vc.exam_profile_id = v.exam_profile_id and vc.current_published_count = 1
  where v.publication_status = 'published' and v.is_current is true
), active_nodes as (
  select n.id, n.syllabus_version_id, n.parent_node_id, n.node_type, n.metadata
  from public.exam_syllabus_nodes n
  join single_current_versions v on v.id = n.syllabus_version_id
  where n.is_active is true
), valid_subjects as (
  select n.id, n.syllabus_version_id
  from active_nodes n
  where n.node_type = 'subject' and n.parent_node_id is null
), valid_topics as (
  select n.id, n.syllabus_version_id, n.parent_node_id as subject_id
  from active_nodes n
  join valid_subjects s
    on s.id = n.parent_node_id and s.syllabus_version_id = n.syllabus_version_id
  where n.node_type = 'topic'
), valid_subtopics as (
  select
    n.id,
    n.syllabus_version_id,
    n.parent_node_id as topic_id,
    content.id as content_subtopic_id
  from active_nodes n
  join valid_topics t
    on t.id = n.parent_node_id and t.syllabus_version_id = n.syllabus_version_id
  join public.subtopics content
    on content.id::text = coalesce(
      nullif(trim(to_jsonb(n.metadata) ->> 'content_subtopic_id'), ''),
      nullif(trim(to_jsonb(n.metadata) ->> 'catalog_subtopic_id'), '')
    )
   and content.is_active is true
  where n.node_type = 'subtopic'
    and lower(trim(coalesce(to_jsonb(n.metadata) ->> 'operational', 'true')))
        not in ('false', 'f', '0', 'no', 'n', 'off')
), broken_hierarchy as (
  select n.syllabus_version_id, n.id
  from active_nodes n
  where (n.node_type = 'subject' and n.parent_node_id is not null)
     or (n.node_type = 'topic' and not exists (
       select 1 from valid_topics t where t.id = n.id and t.syllabus_version_id = n.syllabus_version_id
     ))
     or (n.node_type = 'subtopic' and not exists (
       select 1 from valid_subtopics st where st.id = n.id and st.syllabus_version_id = n.syllabus_version_id
     ))
  union
  select s.syllabus_version_id, s.id from valid_subjects s
  where not exists (
    select 1 from valid_topics t where t.subject_id = s.id and t.syllabus_version_id = s.syllabus_version_id
  )
  union
  select t.syllabus_version_id, t.id from valid_topics t
  where not exists (
    select 1 from valid_subtopics st where st.topic_id = t.id and st.syllabus_version_id = t.syllabus_version_id
  )
), hierarchy_counts as (
  select
    v.id as syllabus_version_id,
    (select count(*)::bigint from valid_subjects s where s.syllabus_version_id = v.id) as active_subject_count,
    (select count(*)::bigint from valid_topics t where t.syllabus_version_id = v.id) as active_topic_count,
    (select count(*)::bigint from valid_subtopics st where st.syllabus_version_id = v.id) as active_subtopic_count,
    (select count(*)::bigint from broken_hierarchy b where b.syllabus_version_id = v.id) as broken_hierarchy_count
  from single_current_versions v
), exact_question_counts as (
  select
    m.exam_profile_id,
    count(distinct q.id)::bigint as verified_question_count,
    count(distinct q.id) filter (
      where coalesce(m.stage_codes, '{}'::text[]) && array[
        'TIER_I', 'TIER_II_PAPER_I', 'TIER_II_PAPER_II', 'TIER_II_PAPER_III'
      ]::text[]
    )::bigint as supported_stage_question_count
  from public.question_exam_profile_mappings m
  join single_current_versions v on v.exam_profile_id = m.exam_profile_id
  join public.questions q
    on q.id = m.question_id and q.is_active is true and q.is_verified is true
  join valid_subtopics st
    on st.syllabus_version_id = v.id
   and st.content_subtopic_id = q.subtopic_id
  where m.is_active is true
  group by m.exam_profile_id
), cgl_stage_status as (
  select
    count(distinct (p.stage_code, p.subject_id)) = 11
    and count(distinct (p.stage_code, p.topic_id)) = 85
    and count(distinct (p.stage_code, p.subtopic_id)) = 493
    and count(*) filter (where p.stage_code = 'TIER_I') > 0
    and count(*) filter (where p.stage_code = 'TIER_II_PAPER_I') > 0
    and count(*) filter (where p.stage_code = 'TIER_II_PAPER_II') > 0
    and count(*) filter (where p.stage_code = 'TIER_II_PAPER_III') > 0
      as mapping_complete
  from public.ssc_cgl_tier_taxonomy_paths_v2 p
  where p.navigation_visible is true
), profile_state as (
  select
    ep.*,
    e.id as content_exam_id,
    e.code as content_family_code,
    coalesce(vc.current_published_count, 0::bigint) as current_published_count,
    v.id as syllabus_version_id,
    coalesce(h.active_subject_count, 0::bigint) as active_subject_count,
    coalesce(h.active_topic_count, 0::bigint) as active_topic_count,
    coalesce(h.active_subtopic_count, 0::bigint) as active_subtopic_count,
    coalesce(h.broken_hierarchy_count, 0::bigint) as broken_hierarchy_count,
    coalesce(q.verified_question_count, 0::bigint) as verified_question_count,
    coalesce(q.supported_stage_question_count, 0::bigint) as supported_stage_question_count,
    case
      when to_jsonb(ep) ? 'is_selectable' then
        lower(trim(coalesce(to_jsonb(ep) ->> 'is_selectable', 'false'))) in ('true', 't', '1', 'yes', 'y', 'on')
      else true
    end as profile_is_selectable,
    lower(trim(coalesce(to_jsonb(ep.metadata) ->> 'admin_disabled', 'false'))) in ('true', 't', '1', 'yes', 'y', 'on') as admin_disabled,
    case
      when ep.code = 'SSC_CGL' then
        coalesce((select mapping_complete from cgl_stage_status), false)
        and coalesce(q.supported_stage_question_count, 0::bigint) > 0
      else true
    end as stage_mapping_complete
  from public.exam_profiles ep
  left join public.exams e on e.code = ep.legacy_exam_tag and e.is_active is true
  left join version_counts vc on vc.exam_profile_id = ep.id
  left join single_current_versions v on v.exam_profile_id = ep.id
  left join hierarchy_counts h on h.syllabus_version_id = v.id
  left join exact_question_counts q on q.exam_profile_id = ep.id
), resolved as (
  select
    p.*,
    case
      when p.is_active is not true then 'profile_inactive'
      when p.profile_is_selectable is not true then 'profile_not_selectable'
      when p.admin_disabled is true then 'administratively_disabled'
      when lower(trim(coalesce(p.scope_status::text, ''))) <> 'ready' then 'scope_not_ready'
      when p.content_exam_id is null then 'content_family_unmapped'
      when p.current_published_count = 0 then 'current_published_syllabus_missing'
      when p.current_published_count > 1 then 'multiple_current_published_syllabi'
      when p.active_subject_count = 0 then 'subject_mapping_missing'
      when p.active_topic_count = 0 then 'topic_mapping_missing'
      when p.active_subtopic_count = 0 then 'subtopic_mapping_missing'
      when p.broken_hierarchy_count > 0 then 'broken_hierarchy'
      when p.stage_mapping_complete is not true then 'stage_mapping_incomplete'
      when p.verified_question_count = 0 then 'verified_questions_missing'
      else 'ready'
    end as readiness_reason
  from profile_state p
)
select
  r.id as exam_profile_id,
  r.content_exam_id,
  r.code as exam_code,
  r.slug as exam_slug,
  r.title as official_title,
  r.short_name,
  jsonb_build_object(
    'en', concat_ws(' — ', nullif(r.short_name, ''), nullif(to_jsonb(r.title) ->> 'en', '')),
    'hi', concat_ws(' — ', nullif(r.short_name, ''), nullif(to_jsonb(r.title) ->> 'hi', ''))
  ) as display_title,
  r.family_code,
  r.content_family_code,
  r.conducting_body,
  r.profile_category,
  r.product_group,
  r.recurrence_status,
  r.scope_status,
  r.readiness_reason = 'ready' as can_select,
  r.readiness_reason <> 'ready' as is_coming_soon,
  r.readiness_reason as availability_reason,
  r.sort_order,
  r.active_subject_count,
  r.active_topic_count,
  r.active_subtopic_count,
  r.verified_question_count
from resolved r;

comment on view public.exam_selector_options is
  'Exact-profile selector readiness. Question evidence comes only from active question_exam_profile_mappings joined to active verified questions.';
grant select on public.exam_selector_options to anon, authenticated, service_role;

create or replace view public.ssc_cgl_tier_availability as
with tier_definition(tier_code, default_stage_code) as (
  values ('TIER_I'::text, 'TIER_I'::text),
         ('TIER_II'::text, 'TIER_II_PAPER_I'::text)
), cgl as (
  select o.exam_profile_id, o.can_select
  from public.exam_selector_options o
  where o.exam_code = 'SSC_CGL'
    and o.exam_slug = 'ssc-combined-graduate-level-examination'
    and o.availability_reason <> 'profile_inactive'
), cgl_version as (
  select v.id as syllabus_version_id, c.exam_profile_id, c.can_select
  from cgl c
  join public.exam_syllabus_versions v
    on v.exam_profile_id = c.exam_profile_id
   and v.publication_status = 'published'
   and v.is_current is true
), operational_stage_subtopics as (
  select distinct
    p.stage_code,
    content.id as content_subtopic_id
  from cgl_version v
  join public.ssc_cgl_tier_taxonomy_paths_v2 p
    on p.navigation_visible is true
  join public.exam_syllabus_nodes n
    on n.id = p.subtopic_id
   and n.syllabus_version_id = v.syllabus_version_id
   and n.is_active is true
  join public.subtopics content
    on content.id::text = coalesce(
      nullif(trim(to_jsonb(n.metadata) ->> 'content_subtopic_id'), ''),
      nullif(trim(to_jsonb(n.metadata) ->> 'catalog_subtopic_id'), '')
    )
   and content.is_active is true
  where lower(trim(coalesce(to_jsonb(n.metadata) ->> 'operational', 'true')))
        not in ('false', 'f', '0', 'no', 'n', 'off')
), counts as (
  select
    c.exam_profile_id,
    d.tier_code,
    d.default_stage_code,
    c.can_select,
    count(distinct q.id) filter (
      where exists (
        select 1
        from operational_stage_subtopics st
        where st.content_subtopic_id = q.subtopic_id
          and st.stage_code = any(coalesce(m.stage_codes, '{}'::text[]))
          and (
            (d.tier_code = 'TIER_I' and st.stage_code = 'TIER_I')
            or (d.tier_code = 'TIER_II' and st.stage_code in (
              'TIER_II_PAPER_I', 'TIER_II_PAPER_II', 'TIER_II_PAPER_III'
            ))
          )
      )
    )::bigint as verified_question_count
  from cgl_version c
  cross join tier_definition d
  left join public.question_exam_profile_mappings m
    on m.exam_profile_id = c.exam_profile_id and m.is_active is true
  left join public.questions q
    on q.id = m.question_id and q.is_active is true and q.is_verified is true
  group by c.exam_profile_id, d.tier_code, d.default_stage_code, c.can_select
)
select exam_profile_id, tier_code, default_stage_code, verified_question_count,
       can_select and verified_question_count > 0 as is_available
from counts;

comment on view public.ssc_cgl_tier_availability is
  'Read-only SSC CGL Tier availability from exact profile mappings, stage_codes, and explicitly linked operational subtopics in the current published syllabus.';
grant select on public.ssc_cgl_tier_availability to anon, authenticated, service_role;

do $$
declare
  v_subjects bigint;
  v_topics bigint;
  v_subtopics bigint;
  v_questions bigint;
  v_can_select boolean;
  v_reason text;
begin
  select active_subject_count, active_topic_count, active_subtopic_count,
         verified_question_count, can_select, availability_reason
  into v_subjects, v_topics, v_subtopics, v_questions, v_can_select, v_reason
  from public.exam_selector_options
  where exam_code = 'SSC_CGL'
    and exam_slug = 'ssc-combined-graduate-level-examination'
    and availability_reason <> 'profile_inactive';

  if not found then
    raise exception 'SSC CGL selector assertion failed; stable profile row is missing';
  end if;
  if (v_subjects, v_topics, v_subtopics) <> (7::bigint, 60::bigint, 362::bigint) then
    raise exception 'SSC CGL selector assertion failed; expected unique hierarchy 7/60/362, found %/%/%',
      v_subjects, v_topics, v_subtopics;
  end if;
  if v_questions < 1 then
    raise exception 'SSC CGL selector assertion failed; no active verified exact-profile-mapped questions exist';
  end if;
  if v_can_select is not true or v_reason <> 'ready' then
    raise exception 'SSC CGL selector assertion failed; can_select %, reason %', v_can_select, coalesce(v_reason, '<null>');
  end if;
end;
$$;

commit;
