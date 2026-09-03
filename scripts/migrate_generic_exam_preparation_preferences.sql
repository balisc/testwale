-- QuestionWale: generic exact-exam preparation tracks and preferences.
-- Run after migrate_exam_selector_content_readiness.sql and
-- migrate_user_exam_preferences.sql. Safe to rerun; never deletes user data.

begin;

do $$
declare
  v_missing text;
begin
  select string_agg(required_name, ', ' order by required_name)
  into v_missing
  from unnest(array[
    'public.users',
    'public.user_profiles',
    'public.exam_profiles',
    'public.exam_profile_stages',
    'public.exam_syllabus_versions',
    'public.exam_syllabus_nodes',
    'public.exam_syllabus_node_stage_mappings',
    'public.subtopics',
    'public.questions',
    'public.question_exam_profile_mappings',
    'public.exam_selector_options',
    'public.ssc_cgl_tier_availability',
    'public.user_exam_preferences'
  ]) as required(required_name)
  where to_regclass(required_name) is null;

  if v_missing is not null then
    raise exception 'generic preparation preflight failed; missing relations: %', v_missing;
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
      ('exam_profile_stages', 'exam_profile_id'),
      ('exam_profile_stages', 'stage_code'),
      ('exam_profile_stages', 'stage_title'),
      ('exam_profile_stages', 'paper_or_section'),
      ('exam_profile_stages', 'is_objective'),
      ('exam_profile_stages', 'is_scope_stage'),
      ('exam_profile_stages', 'sort_order'),
      ('exam_profile_stages', 'metadata'),
      ('exam_syllabus_node_stage_mappings', 'exam_profile_id'),
      ('exam_syllabus_node_stage_mappings', 'syllabus_version_id'),
      ('exam_syllabus_node_stage_mappings', 'node_id'),
      ('exam_syllabus_node_stage_mappings', 'stage_code'),
      ('exam_syllabus_node_stage_mappings', 'is_active'),
      ('exam_syllabus_nodes', 'metadata'),
      ('exam_syllabus_nodes', 'is_qualifying'),
      ('exam_selector_options', 'active_subject_count'),
      ('exam_selector_options', 'active_topic_count'),
      ('exam_selector_options', 'active_subtopic_count'),
      ('exam_selector_options', 'verified_question_count'),
      ('questions', 'subtopic_id'),
      ('question_exam_profile_mappings', 'stage_codes')
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
    raise exception 'generic preparation preflight failed; missing columns: %', v_missing;
  end if;

  with expected(table_name, column_name, udt_name) as (
    values
      ('exam_profiles', 'id', 'uuid'),
      ('exam_profile_stages', 'exam_profile_id', 'uuid'),
      ('exam_syllabus_versions', 'id', 'uuid'),
      ('exam_syllabus_nodes', 'id', 'uuid'),
      ('exam_syllabus_nodes', 'metadata', 'jsonb'),
      ('questions', 'id', 'uuid'),
      ('questions', 'subtopic_id', 'uuid'),
      ('question_exam_profile_mappings', 'exam_profile_id', 'uuid'),
      ('question_exam_profile_mappings', 'question_id', 'uuid'),
      ('question_exam_profile_mappings', 'stage_codes', '_text')
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
    raise exception 'generic preparation preflight failed; incompatible types: %', v_wrong;
  end if;
end;
$$;

-- These indexes support selector/track reads without changing ownership data.
create index if not exists idx_qepm_profile_active
  on public.question_exam_profile_mappings (exam_profile_id, is_active, question_id);
create index if not exists idx_qepm_stage_codes_gin
  on public.question_exam_profile_mappings using gin (stage_codes);
create index if not exists idx_current_published_syllabus_profile
  on public.exam_syllabus_versions (exam_profile_id, id)
  where publication_status = 'published' and is_current is true;
create index if not exists idx_syllabus_nodes_version_type_active
  on public.exam_syllabus_nodes (syllabus_version_id, node_type, is_active, parent_node_id);
create index if not exists idx_node_stage_mapping_profile_stage
  on public.exam_syllabus_node_stage_mappings (
    exam_profile_id, stage_code, syllabus_version_id, node_id
  ) where is_active is true;
create index if not exists idx_verified_questions_subtopic
  on public.questions (subtopic_id, id)
  where is_active is true and is_verified is true;

create or replace view public.exam_preparation_track_options as
with ready_profiles as (
  select
    o.exam_profile_id,
    o.content_exam_id,
    o.exam_code,
    o.exam_slug,
    o.short_name,
    o.display_title,
    o.official_title
  from public.exam_selector_options o
  where o.can_select is true
    and o.is_coming_soon is false
    and o.active_subject_count > 0
    and o.active_topic_count > 0
    and o.active_subtopic_count > 0
    and o.verified_question_count > 0
), current_versions as (
  select v.id, v.exam_profile_id
  from public.exam_syllabus_versions v
  join ready_profiles p on p.exam_profile_id = v.exam_profile_id
  where v.publication_status = 'published'
    and v.is_current is true
), stage_definitions as (
  select
    p.*,
    s.stage_code,
    s.stage_title,
    s.paper_or_section,
    s.is_objective,
    s.sort_order as stage_sort_order,
    s.metadata as stage_metadata,
    case
      when p.exam_code = 'SSC_CGL' and s.stage_code = 'TIER_I' then 'TIER_I'
      when p.exam_code = 'SSC_CGL' and s.stage_code in (
        'TIER_II_PAPER_I', 'TIER_II_PAPER_II', 'TIER_II_PAPER_III'
      ) then 'TIER_II'
      else null
    end as tier_code
  from ready_profiles p
  join public.exam_profile_stages s on s.exam_profile_id = p.exam_profile_id
  where s.is_scope_stage is true
), active_stage_nodes as (
  select distinct
    m.exam_profile_id,
    m.stage_code,
    n.id as node_id,
    n.node_type,
    n.is_qualifying
  from public.exam_syllabus_node_stage_mappings m
  join current_versions v
    on v.id = m.syllabus_version_id
   and v.exam_profile_id = m.exam_profile_id
  join public.exam_syllabus_nodes n
    on n.id = m.node_id
   and n.syllabus_version_id = v.id
   and n.is_active is true
  where m.is_active is true
), operational_content_subtopics as (
  select distinct
    v.exam_profile_id,
    content.id as content_subtopic_id
  from current_versions v
  join public.exam_syllabus_nodes n
    on n.syllabus_version_id = v.id
   and n.node_type = 'subtopic'
   and n.is_active is true
  join public.subtopics content
    on content.id::text = coalesce(
      nullif(trim(to_jsonb(n.metadata) ->> 'content_subtopic_id'), ''),
      nullif(trim(to_jsonb(n.metadata) ->> 'catalog_subtopic_id'), '')
    )
   and content.is_active is true
  where lower(trim(coalesce(to_jsonb(n.metadata) ->> 'operational', 'true')))
        not in ('false', 'f', '0', 'no', 'n', 'off')
), stage_content_subtopics as (
  select distinct
    n.exam_profile_id,
    n.stage_code,
    content.id as content_subtopic_id
  from active_stage_nodes n
  join public.exam_syllabus_nodes syllabus_node
    on syllabus_node.id = n.node_id
   and syllabus_node.node_type = 'subtopic'
  join public.subtopics content
    on content.id::text = coalesce(
      nullif(trim(to_jsonb(syllabus_node.metadata) ->> 'content_subtopic_id'), ''),
      nullif(trim(to_jsonb(syllabus_node.metadata) ->> 'catalog_subtopic_id'), '')
    )
   and content.is_active is true
  join operational_content_subtopics operational
    on operational.exam_profile_id = n.exam_profile_id
   and operational.content_subtopic_id = content.id
), question_counts as (
  select
    s.exam_profile_id,
    s.stage_code,
    count(distinct q.id)::bigint as verified_question_count
  from stage_definitions s
  join public.question_exam_profile_mappings m
    on m.exam_profile_id = s.exam_profile_id
   and m.is_active is true
   and s.stage_code = any(coalesce(m.stage_codes, '{}'::text[]))
  join public.questions q
    on q.id = m.question_id
   and q.is_active is true
   and q.is_verified is true
  join stage_content_subtopics st
    on st.exam_profile_id = s.exam_profile_id
   and st.stage_code = s.stage_code
   and st.content_subtopic_id = q.subtopic_id
  group by s.exam_profile_id, s.stage_code
), skill_counts as (
  select
    n.exam_profile_id,
    n.stage_code,
    count(distinct n.node_id) filter (
      where n.node_type = 'skill_test' and n.is_qualifying is true
    )::bigint as qualifying_skill_test_count
  from active_stage_nodes n
  group by n.exam_profile_id, n.stage_code
), cgl_tier_availability as (
  select a.exam_profile_id, a.tier_code, a.is_available
  from public.ssc_cgl_tier_availability a
)
select
  s.exam_profile_id,
  s.content_exam_id,
  s.exam_code,
  s.exam_slug,
  s.short_name,
  s.display_title,
  s.official_title,
  s.tier_code,
  s.stage_code,
  s.stage_title,
  s.paper_or_section,
  'MCQ'::text as preparation_mode,
  s.is_objective,
  s.stage_sort_order as sort_order,
  coalesce(q.verified_question_count, 0::bigint) as verified_question_count,
  coalesce(k.qualifying_skill_test_count, 0::bigint) as qualifying_skill_test_count,
  coalesce(q.verified_question_count, 0::bigint) > 0 as is_available
from stage_definitions s
left join question_counts q
  on q.exam_profile_id = s.exam_profile_id and q.stage_code = s.stage_code
left join skill_counts k
  on k.exam_profile_id = s.exam_profile_id and k.stage_code = s.stage_code
left join cgl_tier_availability cgl
  on cgl.exam_profile_id = s.exam_profile_id and cgl.tier_code = s.tier_code
where coalesce(q.verified_question_count, 0::bigint) > 0
  and (s.exam_code <> 'SSC_CGL' or cgl.is_available is true);

comment on view public.exam_preparation_track_options is
  'Server-read exact exam/stage MCQ availability. Qualifying skill tests are counted separately and never exposed as MCQ subtopics.';
revoke all on public.exam_preparation_track_options from public, anon, authenticated;
grant select on public.exam_preparation_track_options to service_role;

alter table public.user_exam_preferences
  add column if not exists preparation_mode text;

update public.user_exam_preferences
set preparation_mode = 'MCQ'
where preparation_mode is null;

alter table public.user_exam_preferences
  alter column preferred_tier_code drop not null,
  alter column preparation_mode set default 'MCQ',
  alter column preparation_mode set not null;

-- Releases may temporarily persist SSC CHSL in the older CGL-constrained
-- table by using TIER_II_PAPER_I as a Tier 2 storage marker. Canonicalize
-- those exact-profile rows before installing the generic stage constraint.
update public.user_exam_preferences p
set preferred_tier_code = null,
    preferred_stage_code = case p.preferred_tier_code
      when 'TIER_I' then 'TIER_I'
      else 'TIER_II'
    end,
    updated_at = now()
from public.exam_profiles ep
where ep.id = p.exam_profile_id
  and ep.code = 'SSC_CHSL'
  and (
    (p.preferred_tier_code = 'TIER_I' and p.preferred_stage_code = 'TIER_I')
    or
    (p.preferred_tier_code = 'TIER_II' and p.preferred_stage_code = 'TIER_II_PAPER_I')
  );

-- Replace only the two known earlier CGL-only checks. Unknown definitions
-- abort instead of being silently weakened.
do $$
declare
  v_constraint record;
begin
  select c.* into v_constraint
  from pg_constraint c
  where c.conrelid = 'public.user_exam_preferences'::regclass
    and c.conname = 'user_exam_preferences_tier_code_check';
  if found then
    if v_constraint.contype <> 'c'
       or pg_get_constraintdef(v_constraint.oid, true) not ilike '%preferred_tier_code%TIER_I%TIER_II%' then
      raise exception 'cannot reconcile user_exam_preferences_tier_code_check: %',
        pg_get_constraintdef(v_constraint.oid, true);
    end if;
    alter table public.user_exam_preferences
      drop constraint user_exam_preferences_tier_code_check;
  end if;

  alter table public.user_exam_preferences
    add constraint user_exam_preferences_tier_code_check
    check (preferred_tier_code is null or preferred_tier_code in ('TIER_I', 'TIER_II'));

  select c.* into v_constraint
  from pg_constraint c
  where c.conrelid = 'public.user_exam_preferences'::regclass
    and c.conname = 'user_exam_preferences_stage_code_check';
  if found then
    if v_constraint.contype <> 'c'
       or pg_get_constraintdef(v_constraint.oid, true) not ilike '%preferred_tier_code%preferred_stage_code%' then
      raise exception 'cannot reconcile user_exam_preferences_stage_code_check: %',
        pg_get_constraintdef(v_constraint.oid, true);
    end if;
    alter table public.user_exam_preferences
      drop constraint user_exam_preferences_stage_code_check;
  end if;

  alter table public.user_exam_preferences
    add constraint user_exam_preferences_stage_code_check
    check (
      (preferred_tier_code = 'TIER_I' and preferred_stage_code = 'TIER_I')
      or
      (preferred_tier_code = 'TIER_II' and preferred_stage_code in (
        'TIER_II_PAPER_I', 'TIER_II_PAPER_II', 'TIER_II_PAPER_III'
      ))
      or
      (preferred_tier_code is null and length(trim(preferred_stage_code)) > 0)
    );
end;
$$;

do $$
declare
  v_constraint record;
begin
  select c.* into v_constraint
  from pg_constraint c
  where c.conrelid = 'public.user_exam_preferences'::regclass
    and c.conname = 'user_exam_preferences_preparation_mode_check';
  if found then
    if v_constraint.contype <> 'c'
       or pg_get_constraintdef(v_constraint.oid, true) not ilike '%preparation_mode%MCQ%WRITTEN%' then
      raise exception 'cannot reconcile user_exam_preferences_preparation_mode_check: %',
        pg_get_constraintdef(v_constraint.oid, true);
    end if;
  else
    alter table public.user_exam_preferences
      add constraint user_exam_preferences_preparation_mode_check
      check (preparation_mode in ('MCQ', 'WRITTEN'));
  end if;
end;
$$;

create or replace function public.update_user_exam_preparation_preference(
  p_user_id uuid,
  p_exam_profile_id uuid,
  p_preferred_stage_code text,
  p_preparation_mode text,
  p_preferred_tier_code text default null
)
returns table (
  exam_profile_id uuid,
  preferred_tier_code text,
  preferred_stage_code text,
  preparation_mode text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_track record;
  v_exam_name text;
begin
  if p_user_id is null or not exists (
    select 1 from public.users u where u.id = p_user_id
  ) then
    raise exception 'invalid_user' using errcode = '22023';
  end if;

  if p_preferred_stage_code is null or length(trim(p_preferred_stage_code)) = 0 then
    raise exception 'invalid_stage' using errcode = '22023';
  end if;
  if p_preparation_mode is null or p_preparation_mode not in ('MCQ', 'WRITTEN') then
    raise exception 'invalid_preparation_mode' using errcode = '22023';
  end if;

  select t.*
  into v_track
  from public.exam_preparation_track_options t
  where t.exam_profile_id = p_exam_profile_id
    and t.stage_code = trim(p_preferred_stage_code)
    and t.preparation_mode = p_preparation_mode
    and t.is_available is true;

  if not found then
    raise exception 'preparation_track_unavailable' using errcode = '22023';
  end if;

  if v_track.exam_code = 'SSC_CGL' then
    if p_preferred_tier_code is distinct from v_track.tier_code then
      raise exception 'invalid_tier_stage' using errcode = '22023';
    end if;
  elsif p_preferred_tier_code is not null then
    raise exception 'tier_not_supported_for_exam' using errcode = '22023';
  end if;

  v_exam_name := coalesce(
    nullif(v_track.short_name, ''),
    nullif(to_jsonb(v_track.display_title) ->> 'en', ''),
    nullif(to_jsonb(v_track.official_title) ->> 'en', ''),
    v_track.exam_code
  );

  insert into public.user_profiles (
    user_id, target_exam_profile_id, target_exam_id, target_exam, updated_at
  ) values (
    p_user_id, p_exam_profile_id, v_track.content_exam_id, v_exam_name, now()
  )
  on conflict (user_id) do update
  set target_exam_profile_id = excluded.target_exam_profile_id,
      target_exam_id = excluded.target_exam_id,
      target_exam = excluded.target_exam,
      updated_at = excluded.updated_at;

  return query
  insert into public.user_exam_preferences (
    user_id,
    exam_profile_id,
    preferred_tier_code,
    preferred_stage_code,
    preparation_mode
  ) values (
    p_user_id,
    p_exam_profile_id,
    p_preferred_tier_code,
    trim(p_preferred_stage_code),
    p_preparation_mode
  )
  on conflict (user_id, exam_profile_id) do update
  set preferred_tier_code = excluded.preferred_tier_code,
      preferred_stage_code = excluded.preferred_stage_code,
      preparation_mode = excluded.preparation_mode,
      updated_at = now()
  returning
    user_exam_preferences.exam_profile_id,
    user_exam_preferences.preferred_tier_code,
    user_exam_preferences.preferred_stage_code,
    user_exam_preferences.preparation_mode,
    user_exam_preferences.updated_at;
end;
$$;

revoke all on function public.update_user_exam_preparation_preference(uuid, uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.update_user_exam_preparation_preference(uuid, uuid, text, text, text)
  to service_role;

create or replace function public.complete_exam_onboarding_with_preference(
  p_user_id uuid,
  p_exam_profile_id uuid,
  p_exam_date date,
  p_preferred_stage_code text,
  p_preparation_mode text,
  p_preferred_tier_code text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_exam_date is null
     or p_exam_date <= (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'invalid_exam_date' using errcode = '22007';
  end if;

  perform public.update_user_exam_preparation_preference(
    p_user_id,
    p_exam_profile_id,
    p_preferred_stage_code,
    p_preparation_mode,
    p_preferred_tier_code
  );

  update public.user_profiles
  set exam_date = p_exam_date,
      exam_onboarding_required = false,
      exam_onboarding_completed_at = now(),
      updated_at = now()
  where user_id = p_user_id;
end;
$$;

revoke all on function public.complete_exam_onboarding_with_preference(uuid, uuid, date, text, text, text)
  from public, anon, authenticated;
grant execute on function public.complete_exam_onboarding_with_preference(uuid, uuid, date, text, text, text)
  to service_role;

notify pgrst, 'reload schema';

commit;
