-- QuestionWale: read-only post-migration verification.
-- Run after all three corrected migrations, and save every result grid.

begin transaction read only;

select
  to_regclass('public.exam_selector_options') as exam_selector_options,
  to_regclass('public.exam_preparation_track_options') as exam_preparation_track_options,
  to_regclass('public.ssc_cgl_tier_availability') as ssc_cgl_tier_availability,
  to_regclass('public.question_exam_profile_mappings') as exact_question_mappings,
  to_regclass('public.user_exam_preferences') as user_exam_preferences,
  case when to_regclass('public.user_exam_preferences') is not null then 'PASS' else 'FAIL' end as postgrest_relation_precheck;

-- Diagnostic selector rows. The actual application query is the second query.
select
  exam_code, exam_slug, can_select, is_coming_soon, availability_reason,
  active_subject_count, active_topic_count, active_subtopic_count,
  verified_question_count
from public.exam_selector_options
order by sort_order nulls last, exam_code;

select
  exam_profile_id, content_exam_id, exam_code, exam_slug, short_name,
  active_subject_count, active_topic_count, active_subtopic_count,
  verified_question_count
from public.exam_selector_options
where can_select is true
  and is_coming_soon is false
  and active_subject_count > 0
  and active_topic_count > 0
  and active_subtopic_count > 0
  and verified_question_count > 0
order by sort_order nulls last, exam_code;

-- This is the exact server-only Step 2 catalogue. WRITTEN must remain absent
-- until a real written-question model and mapped content exist.
select
  exam_profile_id, exam_code, tier_code, stage_code, preparation_mode,
  verified_question_count, qualifying_skill_test_count, is_available
from public.exam_preparation_track_options
order by exam_code, sort_order, stage_code;

select
  count(*) filter (
    where preparation_mode <> 'MCQ'
       or verified_question_count <= 0
       or is_available is not true
  )::bigint as invalid_selectable_tracks,
  count(*) filter (where preparation_mode = 'WRITTEN')::bigint as unsupported_written_tracks,
  not has_table_privilege('anon', 'public.exam_preparation_track_options', 'SELECT')
    and not has_table_privilege('authenticated', 'public.exam_preparation_track_options', 'SELECT')
    and has_table_privilege('service_role', 'public.exam_preparation_track_options', 'SELECT')
      as track_view_is_server_only
from public.exam_preparation_track_options;

-- Selector counts must exactly equal active verified rows in the authoritative
-- profile map whose question subtopic has an explicit active link from the
-- current published hierarchy. questions.exam_tags is intentionally absent.
with version_counts as (
  select v.exam_profile_id, count(*)::bigint as current_published_count
  from public.exam_syllabus_versions v
  where v.publication_status = 'published'
    and v.is_current is true
  group by v.exam_profile_id
), current_versions as (
  select v.id, v.exam_profile_id
  from public.exam_syllabus_versions v
  join version_counts vc
    on vc.exam_profile_id = v.exam_profile_id
   and vc.current_published_count = 1
  where v.publication_status = 'published'
    and v.is_current is true
), valid_subjects as (
  select n.id, n.syllabus_version_id
  from public.exam_syllabus_nodes n
  join current_versions v on v.id = n.syllabus_version_id
  where n.is_active is true
    and n.node_type = 'subject'
    and n.parent_node_id is null
), valid_topics as (
  select n.id, n.syllabus_version_id
  from public.exam_syllabus_nodes n
  join valid_subjects s
    on s.id = n.parent_node_id
   and s.syllabus_version_id = n.syllabus_version_id
  where n.is_active is true
    and n.node_type = 'topic'
), valid_subtopics as (
  select n.syllabus_version_id, content.id as content_subtopic_id
  from public.exam_syllabus_nodes n
  join valid_topics t
    on t.id = n.parent_node_id
   and t.syllabus_version_id = n.syllabus_version_id
  join public.subtopics content
    on content.id::text = coalesce(
      nullif(trim(to_jsonb(n.metadata) ->> 'content_subtopic_id'), ''),
      nullif(trim(to_jsonb(n.metadata) ->> 'catalog_subtopic_id'), '')
    )
   and content.is_active is true
  where n.is_active is true
    and n.node_type = 'subtopic'
    and lower(trim(coalesce(to_jsonb(n.metadata) ->> 'operational', 'true')))
        not in ('false', 'f', '0', 'no', 'n', 'off')
), exact_counts as (
  select m.exam_profile_id, count(distinct q.id)::bigint as exact_mapping_count
  from public.question_exam_profile_mappings m
  join current_versions v on v.exam_profile_id = m.exam_profile_id
  join public.questions q
    on q.id = m.question_id
   and q.is_active is true
   and q.is_verified is true
  join valid_subtopics st
    on st.syllabus_version_id = v.id
   and st.content_subtopic_id = q.subtopic_id
  where m.is_active is true
  group by m.exam_profile_id
)
select
  o.exam_code,
  o.verified_question_count as selector_count,
  coalesce(c.exact_mapping_count, 0::bigint) as exact_mapping_count,
  o.verified_question_count = coalesce(c.exact_mapping_count, 0::bigint) as counts_match
from public.exam_selector_options o
left join exact_counts c on c.exam_profile_id = o.exam_profile_id
order by o.exam_code;

-- Broad SSC-only questions are a diagnostic, never exact SSC CGL evidence.
select
  count(distinct q.id) filter (
    where q.exam_tags @> array['SSC']::text[]
  )::bigint as broad_ssc_verified_questions,
  count(distinct q.id) filter (
    where m.question_id is not null
  )::bigint as exact_ssc_cgl_verified_questions,
  'Broad count is not used by exam_selector_options'::text as assertion
from public.questions q
left join public.exam_profiles ep
  on ep.code = 'SSC_CGL'
 and ep.slug = 'ssc-combined-graduate-level-examination'
 and ep.is_active is true
left join public.question_exam_profile_mappings m
  on m.question_id = q.id
 and m.exam_profile_id = ep.id
 and m.is_active is true
where q.is_active is true
  and q.is_verified is true;

select
  a.tier_code, a.default_stage_code, a.verified_question_count, a.is_available,
  case
    when a.tier_code = 'TIER_I' and a.default_stage_code <> 'TIER_I' then 'FAIL'
    when a.tier_code = 'TIER_II' and a.default_stage_code <> 'TIER_II_PAPER_I' then 'FAIL'
    when a.is_available <> (o.can_select and a.verified_question_count > 0) then 'FAIL'
    else 'PASS'
  end as status
from public.ssc_cgl_tier_availability a
join public.exam_selector_options o on o.exam_profile_id = a.exam_profile_id
order by a.tier_code;

-- Current SSC CGL strict hierarchy regression.
with cgl_version as (
  select v.id
  from public.exam_syllabus_versions v
  join public.exam_profiles ep on ep.id = v.exam_profile_id
  where ep.code = 'SSC_CGL'
    and ep.slug = 'ssc-combined-graduate-level-examination'
    and ep.is_active is true
    and v.publication_status = 'published'
    and v.is_current is true
), paths as (
  select stage_code, subject_id, topic_id, subtopic_id
  from public.ssc_cgl_tier_taxonomy_paths_v2
  where navigation_visible is true
), audit as (
  select
    count(distinct (p.stage_code, p.subject_id))::bigint as subject_placements,
    count(distinct (p.stage_code, p.topic_id))::bigint as topic_placements,
    count(distinct (p.stage_code, p.subtopic_id))::bigint as subtopic_paths,
    count(*) filter (
      where s.id is null or t.id is null or st.id is null
         or t.parent_node_id is distinct from p.subject_id
         or st.parent_node_id is distinct from p.topic_id
    )::bigint as broken_mappings,
    count(*) filter (
      where s.is_active is not true or t.is_active is not true or st.is_active is not true
    )::bigint as inactive_wrappers_returned
  from paths p
  left join public.exam_syllabus_nodes s on s.id = p.subject_id
  left join public.exam_syllabus_nodes t on t.id = p.topic_id
  left join public.exam_syllabus_nodes st on st.id = p.subtopic_id
)
select
  (select count(*)::bigint from public.exam_syllabus_nodes n join cgl_version v on v.id = n.syllabus_version_id where n.is_active is true) as active_current_nodes,
  a.subject_placements,
  a.topic_placements,
  a.subtopic_paths as frontend_subtopic_stage_paths,
  (select count(*)::bigint from public.ssc_cgl_tier_skill_tests_v2) as skill_tests,
  a.subject_placements + a.topic_placements + a.subtopic_paths
    + (select count(*)::bigint from public.ssc_cgl_tier_skill_tests_v2) as node_stage_rows,
  a.broken_mappings,
  a.inactive_wrappers_returned,
  case when
    (select count(*) from public.exam_syllabus_nodes n join cgl_version v on v.id = n.syllabus_version_id where n.is_active is true) = 430
    and a.subject_placements = 11
    and a.topic_placements = 85
    and a.subtopic_paths = 493
    and (select count(*) from public.ssc_cgl_tier_skill_tests_v2) = 1
    and a.broken_mappings = 0
    and a.inactive_wrappers_returned = 0
  then 'PASS' else 'FAIL' end as status
from audit a;

-- Every operational SSC CGL subtopic must resolve by an explicit metadata ID.
-- A matching title is deliberately irrelevant.
with cgl_version as (
  select v.id
  from public.exam_syllabus_versions v
  join public.exam_profiles ep on ep.id = v.exam_profile_id
  where ep.code = 'SSC_CGL'
    and ep.slug = 'ssc-combined-graduate-level-examination'
    and ep.is_active is true
    and v.publication_status = 'published'
    and v.is_current is true
), links as (
  select distinct
    p.subtopic_id,
    content.id as content_subtopic_id
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
)
select
  count(*)::bigint as operational_subtopics,
  count(*) filter (where content_subtopic_id is not null)::bigint as explicitly_linked_subtopics,
  count(*) filter (where content_subtopic_id is null)::bigint as missing_explicit_links,
  case when count(*) filter (where content_subtopic_id is null) = 0
    then 'PASS' else 'FAIL'
  end as status
from links;

select *
from public.ssc_cgl_tier_scope_summary_v2
order by stage_code;

-- Preference columns, constraints, policies, grants, functions and overloads.
select
  c.column_name, c.data_type, c.is_nullable, c.column_default
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'user_exam_preferences'
order by c.ordinal_position;

select
  c.conname,
  c.contype,
  pg_get_constraintdef(c.oid, true) as definition
from pg_constraint c
where c.conrelid in (
  'public.user_exam_preferences'::regclass,
  'public.user_profiles'::regclass
)
and (
  c.conrelid = 'public.user_exam_preferences'::regclass
  or c.conname = 'user_profiles_target_exam_profile_id_fkey'
)
order by c.conrelid::regclass::text, c.contype, c.conname;

select
  c.relrowsecurity as rls_enabled,
  not has_table_privilege('anon', 'public.user_exam_preferences', 'SELECT')
    and not has_table_privilege('anon', 'public.user_exam_preferences', 'INSERT')
    and not has_table_privilege('anon', 'public.user_exam_preferences', 'UPDATE')
    and not has_table_privilege('anon', 'public.user_exam_preferences', 'DELETE')
    and not has_table_privilege('authenticated', 'public.user_exam_preferences', 'SELECT')
    and not has_table_privilege('authenticated', 'public.user_exam_preferences', 'INSERT')
    and not has_table_privilege('authenticated', 'public.user_exam_preferences', 'UPDATE')
    and not has_table_privilege('authenticated', 'public.user_exam_preferences', 'DELETE')
      as browser_roles_blocked
from pg_class c
where c.oid = 'public.user_exam_preferences'::regclass;

select
  p.oid::regprocedure::text as function_signature,
  p.prosecdef as security_definer,
  p.proconfig as function_settings,
  has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_can_execute,
  not has_function_privilege('anon', p.oid, 'EXECUTE')
    and not has_function_privilege('authenticated', p.oid, 'EXECUTE')
    and coalesce(array_to_string(p.proacl, ','), '') not like '%=X/%'
      as browser_and_public_blocked
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'complete_exam_onboarding_with_tier',
    'update_user_exam_tier_preference',
    'complete_exam_onboarding_with_preference',
    'update_user_exam_preparation_preference'
  )
order by function_signature;

select count(*)::bigint as unexpected_rpc_overloads
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and (
    (p.proname = 'complete_exam_onboarding_with_tier'
      and oidvectortypes(p.proargtypes) <> 'uuid, uuid, date, text')
    or
    (p.proname = 'update_user_exam_tier_preference'
      and oidvectortypes(p.proargtypes) <> 'uuid, uuid, text, text')
    or
    (p.proname = 'complete_exam_onboarding_with_preference'
      and oidvectortypes(p.proargtypes) <> 'uuid, uuid, date, text, text, text')
    or
    (p.proname = 'update_user_exam_preparation_preference'
      and oidvectortypes(p.proargtypes) <> 'uuid, uuid, text, text, text')
  );

select
  count(*) filter (
    where preparation_mode not in ('MCQ', 'WRITTEN')
       or preferred_stage_code is null
       or length(trim(preferred_stage_code)) = 0
       or (preferred_tier_code is not null and preferred_tier_code not in ('TIER_I', 'TIER_II'))
       or (preferred_tier_code is not null and not (
         (preferred_tier_code = 'TIER_I' and preferred_stage_code = 'TIER_I')
         or (preferred_tier_code = 'TIER_II' and preferred_stage_code in (
           'TIER_II_PAPER_I', 'TIER_II_PAPER_II', 'TIER_II_PAPER_III'
         ))
       ))
  )::bigint as invalid_rows,
  count(*)::bigint - count(distinct (user_id, exam_profile_id))::bigint as duplicate_rows
from public.user_exam_preferences;

select
  count(*) filter (where u.id is null)::bigint as orphan_users,
  count(*) filter (where ep.id is null)::bigint as orphan_exam_profiles
from public.user_exam_preferences p
left join public.users u on u.id = p.user_id
left join public.exam_profiles ep on ep.id = p.exam_profile_id;

-- Save these after-counts and compare them with the staging pre-migration
-- snapshot. No protected table is modified by either migration.
select 'users' as relation, count(*)::bigint as row_count from public.users
union all select 'questions', count(*)::bigint from public.questions
union all select 'user_attempts', count(*)::bigint from public.user_attempts
union all select 'user_question_attempts', count(*)::bigint from public.user_question_attempts
union all select 'exam_syllabus_nodes', count(*)::bigint from public.exam_syllabus_nodes
union all select 'question_exam_profile_mappings', count(*)::bigint from public.question_exam_profile_mappings
union all select 'user_exam_preferences', count(*)::bigint from public.user_exam_preferences
order by relation;

-- Optional unsafe legacy object: catalog-only inspection, never a DROP.
select
  to_regclass('public.exam_syllabus_question_mappings') as legacy_relation,
  count(d.*)::bigint as dependency_rows,
  case when to_regclass('public.exam_syllabus_question_mappings') is null
    then 'not present; no cleanup needed'
    else 'present; archive/cleanup requires a separate reviewed change'
  end as cleanup_status
from pg_depend d
where d.refobjid = to_regclass('public.exam_syllabus_question_mappings');

rollback;
