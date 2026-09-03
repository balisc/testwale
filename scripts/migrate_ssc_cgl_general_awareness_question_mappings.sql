-- Repair the independently authored SSC CGL General Awareness V6.1 pack.
-- The 1,340 questions already carry an authoritative pack code and stable
-- syllabus node code. General Awareness is shared by Tier 1 and Tier 2
-- Paper I, so every exact profile mapping must include both stage codes.
-- Safe to re-run: all writes are idempotent and guarded by strict assertions.

begin;

do $migration$
declare
  v_profile_id uuid;
  v_version_id uuid;
  v_version_code text;
  v_count integer;
begin
  select p.id
    into strict v_profile_id
  from public.exam_profiles p
  where p.code = 'SSC_CGL'
    and p.slug = 'ssc-combined-graduate-level-examination'
    and p.is_active is true;

  select v.id, v.version_code
    into strict v_version_id, v_version_code
  from public.exam_syllabus_versions v
  where v.exam_profile_id = v_profile_id
    and v.publication_status = 'published'
    and v.is_current is true;

  if v_version_code <> 'SSC_CGL_2026_OPERATIONAL_V6_1' then
    raise exception 'Expected SSC CGL version %, found %',
      'SSC_CGL_2026_OPERATIONAL_V6_1', v_version_code;
  end if;

  select count(*) into v_count
  from public.questions q
  where q.is_active is true
    and q.is_verified is true
    and q.exam_tags @> array['SSC']::text[]
    and q.source = 'QW_GA_V6_1_ORIGINAL'
    and q.source_metadata ->> 'pack_code' = 'SSC_CGL_GA_V6_1_1340'
    and q.source_metadata ->> 'syllabus_version_code' = v_version_code
    and nullif(trim(q.source_metadata ->> 'subtopic_code'), '') is not null;
  if v_count <> 1340 then
    raise exception 'Expected 1340 SSC CGL General Awareness questions, found %', v_count;
  end if;

  with links as (
    select
      q.source_metadata ->> 'subtopic_code' as node_code,
      count(*)::integer as question_count,
      count(distinct q.subtopic_id)::integer as content_subtopics
    from public.questions q
    where q.is_active is true
      and q.is_verified is true
      and q.exam_tags @> array['SSC']::text[]
      and q.source = 'QW_GA_V6_1_ORIGINAL'
      and q.source_metadata ->> 'pack_code' = 'SSC_CGL_GA_V6_1_1340'
      and q.source_metadata ->> 'syllabus_version_code' = v_version_code
    group by q.source_metadata ->> 'subtopic_code'
  )
  select count(*) into v_count
  from links
  where question_count = 20 and content_subtopics = 1;
  if v_count <> 67 then
    raise exception 'Expected 67 one-to-one General Awareness subtopic groups, found %', v_count;
  end if;

  with links as (
    select distinct
      q.source_metadata ->> 'subtopic_code' as node_code,
      q.subtopic_id as content_subtopic_id
    from public.questions q
    where q.is_active is true
      and q.is_verified is true
      and q.exam_tags @> array['SSC']::text[]
      and q.source = 'QW_GA_V6_1_ORIGINAL'
      and q.source_metadata ->> 'pack_code' = 'SSC_CGL_GA_V6_1_1340'
      and q.source_metadata ->> 'syllabus_version_code' = v_version_code
  )
  select count(*) into v_count
  from links l
  join public.subtopics s
    on s.id = l.content_subtopic_id
   and s.is_active is true
  join public.exam_syllabus_nodes n
    on n.syllabus_version_id = v_version_id
   and n.node_type = 'subtopic'
   and n.node_code = l.node_code
   and n.is_active is true;
  if v_count <> 67 then
    raise exception 'Expected 67 active catalog-to-syllabus General Awareness links, found %', v_count;
  end if;

  with links as (
    select distinct
      q.source_metadata ->> 'subtopic_code' as node_code,
      q.subtopic_id as content_subtopic_id
    from public.questions q
    where q.is_active is true
      and q.is_verified is true
      and q.exam_tags @> array['SSC']::text[]
      and q.source = 'QW_GA_V6_1_ORIGINAL'
      and q.source_metadata ->> 'pack_code' = 'SSC_CGL_GA_V6_1_1340'
      and q.source_metadata ->> 'syllabus_version_code' = v_version_code
  )
  update public.exam_syllabus_nodes n
  set metadata = coalesce(n.metadata, '{}'::jsonb) || jsonb_build_object(
        'content_subtopic_id', l.content_subtopic_id::text,
        'catalog_subtopic_id', l.content_subtopic_id::text,
        'content_mapping_status', 'linked',
        'content_mapping_source', 'question_pack_subtopic_code_v1',
        'content_mapping_version', 'SSC_CGL_GA_V6_1_1340'
      ),
      updated_at = now()
  from links l
  where n.syllabus_version_id = v_version_id
    and n.node_type = 'subtopic'
    and n.node_code = l.node_code
    and n.is_active is true;

  insert into public.question_exam_profile_mappings (
    question_id,
    exam_profile_id,
    stage_codes,
    mapping_source,
    is_active,
    metadata
  )
  select
    q.id,
    v_profile_id,
    array['TIER_I', 'TIER_II_PAPER_I']::text[],
    'source_metadata.pack_code',
    true,
    jsonb_build_object(
      'managed_by', 'SSC_CGL_GA_V6_1_MAPPING_REPAIR',
      'exact_exam_profile_code', 'SSC_CGL',
      'pack_code', 'SSC_CGL_GA_V6_1_1340',
      'subtopic_code', q.source_metadata ->> 'subtopic_code'
    )
  from public.questions q
  where q.is_active is true
    and q.is_verified is true
    and q.exam_tags @> array['SSC']::text[]
    and q.source = 'QW_GA_V6_1_ORIGINAL'
    and q.source_metadata ->> 'pack_code' = 'SSC_CGL_GA_V6_1_1340'
    and q.source_metadata ->> 'syllabus_version_code' = v_version_code
  on conflict (question_id, exam_profile_id) do update
  set stage_codes = (
        select array_agg(distinct code order by code)
        from unnest(
          coalesce(public.question_exam_profile_mappings.stage_codes, '{}'::text[])
          || excluded.stage_codes
        ) as code
      ),
      mapping_source = excluded.mapping_source,
      is_active = true,
      metadata = coalesce(public.question_exam_profile_mappings.metadata, '{}'::jsonb)
        || excluded.metadata,
      updated_at = now();

  select count(*) into v_count
  from public.questions q
  join public.question_exam_profile_mappings m
    on m.question_id = q.id
   and m.exam_profile_id = v_profile_id
   and m.is_active is true
   and m.stage_codes @> array['TIER_I', 'TIER_II_PAPER_I']::text[]
  where q.is_active is true
    and q.is_verified is true
    and q.source = 'QW_GA_V6_1_ORIGINAL'
    and q.source_metadata ->> 'pack_code' = 'SSC_CGL_GA_V6_1_1340';
  if v_count <> 1340 then
    raise exception 'Expected 1340 exact Tier 1 + Tier 2 Paper I General Awareness mappings, found %', v_count;
  end if;
end
$migration$;

notify pgrst, 'reload schema';

commit;
