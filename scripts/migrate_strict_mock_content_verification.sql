-- Audited, transactional apply path for strict SSC CHSL deterministic review.
-- Run only after migrate_ssc_cgl_tier1_mock_tests.sql and
-- migrate_ssc_chsl_tier1_mock_tests.sql. This migration never marks a
-- blueprint production-ready and never enables an application feature flag.
begin;

create table if not exists public.mock_content_verification_runs (
  id uuid primary key default gen_random_uuid(),
  blueprint_code text not null references public.mock_test_blueprints(code) on delete restrict,
  verifier_version text not null,
  plan_hash text not null check (plan_hash ~ '^[0-9a-f]{64}$'),
  verifier_identity text not null check (length(trim(verifier_identity)) between 1 and 120),
  status text not null check (status in ('applied')),
  selected_count integer not null check (selected_count between 1 and 1000),
  applied_count integer not null check (applied_count between 0 and selected_count),
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp(),
  unique (blueprint_code, verifier_version, plan_hash)
);

create table if not exists public.mock_content_verification_run_items (
  run_id uuid not null references public.mock_content_verification_runs(id) on delete restrict,
  facet_id uuid not null references public.question_mock_facets(id) on delete restrict,
  question_id uuid not null references public.questions(id) on delete restrict,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  facet_updated_at timestamptz not null,
  question_updated_at timestamptz not null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp(),
  primary key (run_id, facet_id),
  unique (run_id, question_id)
);

alter table public.mock_content_verification_runs enable row level security;
alter table public.mock_content_verification_run_items enable row level security;
revoke all on table public.mock_content_verification_runs from public, anon, authenticated;
revoke all on table public.mock_content_verification_run_items from public, anon, authenticated;
grant all on table public.mock_content_verification_runs to service_role;
grant all on table public.mock_content_verification_run_items to service_role;

create or replace function public.apply_strict_mock_facet_verification(
  p_blueprint_code text,
  p_verifier_version text,
  p_plan_hash text,
  p_verifier_identity text,
  p_items jsonb,
  p_summary jsonb default '{}'::jsonb
)
returns table (run_id uuid, applied_count integer, reused boolean)
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_run_id uuid;
  v_selected integer;
  v_eligible integer;
  v_applied integer;
  v_blueprint public.mock_test_blueprints%rowtype;
begin
  if p_blueprint_code <> 'ssc-chsl-tier1-2025-v1'
     or p_verifier_version <> 'ssc-chsl-tier1-strict-v2'
     or p_plan_hash !~ '^[0-9a-f]{64}$'
     or length(trim(coalesce(p_verifier_identity, ''))) not between 1 and 120
     or jsonb_typeof(p_items) <> 'array' then
    raise exception 'strict_verification_request_invalid' using errcode = '22023';
  end if;

  v_selected := jsonb_array_length(p_items);
  if v_selected not between 1 and 1000 then
    raise exception 'strict_verification_item_count_invalid' using errcode = '22023';
  end if;

  select * into v_blueprint
  from public.mock_test_blueprints
  where code = p_blueprint_code and is_active is true
  for update;
  if not found then raise exception 'strict_verification_blueprint_unavailable' using errcode = 'P0002'; end if;

  select r.id into v_run_id
  from public.mock_content_verification_runs r
  where r.blueprint_code = p_blueprint_code
    and r.verifier_version = p_verifier_version
    and r.plan_hash = p_plan_hash;
  if v_run_id is not null then
    return query
    select r.id, r.applied_count, true
    from public.mock_content_verification_runs r where r.id = v_run_id;
    return;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) item
    where coalesce(item ->> 'facet_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
       or coalesce(item ->> 'question_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
       or coalesce(item ->> 'content_hash', '') !~ '^[0-9a-f]{64}$'
       or coalesce(item ->> 'facet_updated_at', '') = ''
       or coalesce(item ->> 'question_updated_at', '') = ''
  ) then
    raise exception 'strict_verification_item_invalid' using errcode = '22023';
  end if;

  if (select count(distinct item ->> 'facet_id') from jsonb_array_elements(p_items) item) <> v_selected
     or (select count(distinct item ->> 'question_id') from jsonb_array_elements(p_items) item) <> v_selected then
    raise exception 'strict_verification_duplicate_item' using errcode = '22023';
  end if;

  with proposed as (
    select
      (item ->> 'facet_id')::uuid as facet_id,
      (item ->> 'question_id')::uuid as question_id,
      item ->> 'content_hash' as content_hash,
      (item ->> 'facet_updated_at')::timestamptz as facet_updated_at,
      (item ->> 'question_updated_at')::timestamptz as question_updated_at,
      nullif(trim(item ->> 'question_type'), '') as question_type,
      case when coalesce(item ->> 'event_date', '') ~ '^\d{4}-\d{2}-\d{2}$'
        then (item ->> 'event_date')::date end as event_date
    from jsonb_array_elements(p_items) item
  ), eligible as (
    select p.*
    from proposed p
    join public.question_mock_facets f on f.id = p.facet_id and f.question_id = p.question_id
    join public.mock_test_blueprints b on b.code = f.blueprint_code and b.id = v_blueprint.id
    join public.mock_test_blueprint_cells c on c.blueprint_id = b.id
      and c.section_key = f.section_key and c.bucket_key = f.bucket_key
    join public.questions q on q.id = f.question_id
    join public.question_exam_profile_mappings qm on qm.question_id = q.id
      and qm.exam_profile_id = b.exam_profile_id and qm.is_active is true
      and qm.stage_codes @> array['TIER_I']::text[]
    join public.subjects s on s.id = q.subject_id and s.is_active is true
    join public.topics t on t.id = q.topic_id and t.is_active is true
    join public.subtopics st on st.id = q.subtopic_id and st.is_active is true
    left join public.question_mock_groups g on g.id = f.group_id
    where f.blueprint_code = p_blueprint_code
      and f.is_active is true and f.reviewer_status = 'provisional'
      and f.updated_at = p.facet_updated_at and q.updated_at = p.question_updated_at
      and q.is_active is true and q.is_verified is true and coalesce(q.report_count, 0) = 0
      and q.correct_option in ('A','B','C','D')
      and public.mock_question_has_required_options(q.options, true)
      and (
        select count(distinct lower(regexp_replace(trim(option_text), '\s+', ' ', 'g')))
        from (values
          (coalesce(q.options -> 'A' ->> 'en', q.options -> 'en' ->> 'A')),
          (coalesce(q.options -> 'B' ->> 'en', q.options -> 'en' ->> 'B')),
          (coalesce(q.options -> 'C' ->> 'en', q.options -> 'en' ->> 'C')),
          (coalesce(q.options -> 'D' ->> 'en', q.options -> 'en' ->> 'D'))
        ) english_options(option_text)
      ) = 4
      and (
        select count(distinct lower(regexp_replace(trim(option_text), '\s+', ' ', 'g')))
        from (values
          (coalesce(q.options -> 'A' ->> 'hi', q.options -> 'hi' ->> 'A')),
          (coalesce(q.options -> 'B' ->> 'hi', q.options -> 'hi' ->> 'B')),
          (coalesce(q.options -> 'C' ->> 'hi', q.options -> 'hi' ->> 'C')),
          (coalesce(q.options -> 'D' ->> 'hi', q.options -> 'hi' ->> 'D'))
        ) hindi_options(option_text)
      ) = 4
      and coalesce(length(trim(q.question_text ->> 'en')), 0) >= 12
      and coalesce(length(trim(q.question_text ->> 'hi')), 0) >= 8
      and coalesce(length(trim(q.explanation ->> 'en')), 0) >= 20
      and coalesce(length(trim(q.explanation ->> 'hi')), 0) >= 12
      and coalesce(length(trim(q.source)), 0) >= 8
      and jsonb_typeof(q.source_metadata) = 'object' and q.source_metadata <> '{}'::jsonb
      and coalesce(length(trim(q.source_metadata ->> 'question_key')), 0) >= 8
      and coalesce(length(trim(q.source_metadata ->> 'batch_key')), 0) >= 8
      and coalesce(length(trim(q.source_metadata ->> 'answer_proof')), 0) >= 8
      and q.source_metadata ->> 'content_owner' = 'QuestionWale'
      and q.source_metadata ->> 'exam_profile_code' = 'SSC_CHSL'
      and q.source_metadata ->> 'is_exact_pyq' = 'false'
      and q.source_metadata -> 'originality' ->> 'independently_authored' = 'true'
      and q.source_metadata -> 'originality' ->> 'third_party_question_bank_used' = 'false'
      and q.source_metadata -> 'originality' ->> 'pyq_wording_copied' = 'false'
      and q.source_metadata -> 'originality' ->> 'option_set_copied' = 'false'
      and q.source_metadata -> 'originality' ->> 'copied_explanation' = 'false'
      and q.source_metadata -> 'originality' ->> 'external_asset_used' = 'false'
      and (
        (
          q.source_metadata -> 'originality' ->> 'template_generation' = 'deterministic_rule_and_context_checked'
          and q.source_metadata -> 'originality' ->> 'copied_passage' = 'false'
        )
        or (
          q.source_metadata -> 'originality' ->> 'template_generation' <> 'deterministic_rule_and_context_checked'
          and coalesce(q.source_metadata -> 'originality' ->> 'copied_illustration', 'false') = 'false'
        )
      )
      and (
        (
          f.section_key = 'reasoning'
          and q.source_metadata -> 'originality' ->> 'template_generation' = 'deterministic_rule_checked'
          and coalesce(length(trim(q.source_metadata ->> 'relation_family')), 0) >= 4
        )
        or (
          f.section_key = 'quantitative_aptitude'
          and q.source_metadata -> 'originality' ->> 'template_generation' = 'deterministic_formula_checked'
          and coalesce(length(trim(q.source_metadata ->> 'relation_family')), 0) >= 4
        )
        or (
          f.section_key = 'english'
          and q.source_metadata -> 'originality' ->> 'template_generation' = 'deterministic_rule_and_context_checked'
          and coalesce(length(trim(q.source_metadata ->> 'relation_family')), 0) >= 4
        )
        or (
          q.source_metadata -> 'originality' ->> 'template_generation' = 'source_grounded_deterministic_reauthoring'
          and jsonb_typeof(q.source_metadata -> 'source_registry_keys') = 'array'
          and jsonb_array_length(q.source_metadata -> 'source_registry_keys') > 0
          and q.source_metadata -> 'evidence_locator' ->> 'claim_level_support' = 'true'
          and coalesce(length(trim(q.source_metadata -> 'evidence_locator' ->> 'target_fact')), 0) >= 8
          and coalesce(length(trim(q.source_metadata -> 'evidence_locator' ->> 'source_fact_pool')), 0) >= 4
          and coalesce(q.source_metadata ->> 'source_checked_on', '') ~ '^\d{4}-\d{2}-\d{2}$'
        )
      )
      and q.source_metadata -> 'syllabus_alignment' ->> 'exam_profile_code' = 'SSC_CHSL'
      and (q.source_metadata -> 'syllabus_alignment' -> 'stages') @> '["TIER_I"]'::jsonb
      and q.source_metadata -> 'syllabus_alignment' ->> 'topic_code' = f.metadata ->> 'topic_code'
      and q.source_metadata -> 'syllabus_alignment' ->> 'subtopic_code' = f.metadata ->> 'subtopic_code'
      and not exists (
        select 1
        from public.question_mock_facets duplicate_facet
        join public.questions duplicate_question on duplicate_question.id = duplicate_facet.question_id
        where duplicate_facet.blueprint_code = f.blueprint_code
          and duplicate_facet.is_active is true
          and duplicate_facet.id <> f.id
          and duplicate_question.question_text ->> 'en' = q.question_text ->> 'en'
          and duplicate_question.options = q.options
      )
      and (
        not (coalesce(q.source_metadata, '{}'::jsonb) ? 'media')
        or coalesce(f.metadata ->> 'media_verified', 'false') = 'true'
      )
      and (
        c.bucket_key <> 'current_events'
        or (
          coalesce(f.event_date, p.event_date) is not null
          and coalesce(f.event_date, p.event_date) >= (c.freshness_rules ->> 'earliest')::date
          and coalesce(f.event_date, p.event_date) <= (c.freshness_rules ->> 'latest')::date
        )
      )
      and (
        c.bucket_key <> 'atomic_comprehension'
        or (
          g.id is not null and g.is_active is true and g.reviewer_status = 'verified'
          and g.expected_item_count = 5 and f.group_order between 1 and 5
          and (select count(*) from public.question_mock_facets gf
               where gf.group_id = g.id and gf.is_active is true) = 5
        )
      )
      and (
        select count(*) from jsonb_each(coalesce(q.source_metadata -> 'option_rationales', '{}'::jsonb)) rationale
        where rationale.value ->> 'is_correct' = 'true'
      ) = 1
      and q.source_metadata -> 'option_rationales' -> q.correct_option ->> 'is_correct' = 'true'
  )
  select count(*) into v_eligible from eligible;

  if v_eligible <> v_selected then
    raise exception 'strict_verification_stale_or_ineligible: selected %, eligible %', v_selected, v_eligible using errcode = '55000';
  end if;

  insert into public.mock_content_verification_runs (
    blueprint_code, verifier_version, plan_hash, verifier_identity,
    status, selected_count, applied_count, summary
  ) values (
    p_blueprint_code, p_verifier_version, p_plan_hash, trim(p_verifier_identity),
    'applied', v_selected, 0, coalesce(p_summary, '{}'::jsonb)
  ) returning id into v_run_id;

  insert into public.mock_content_verification_run_items (
    run_id, facet_id, question_id, content_hash, facet_updated_at, question_updated_at, evidence
  )
  select
    v_run_id,
    (item ->> 'facet_id')::uuid,
    (item ->> 'question_id')::uuid,
    item ->> 'content_hash',
    (item ->> 'facet_updated_at')::timestamptz,
    (item ->> 'question_updated_at')::timestamptz,
    jsonb_build_object(
      'question_type', item ->> 'question_type',
      'event_date', item ->> 'event_date',
      'verifier_version', p_verifier_version,
      'plan_hash', p_plan_hash
    )
  from jsonb_array_elements(p_items) item;

  with proposed as (
    select
      (item ->> 'facet_id')::uuid as facet_id,
      (item ->> 'question_id')::uuid as question_id,
      item ->> 'content_hash' as content_hash,
      nullif(trim(item ->> 'question_type'), '') as question_type,
      case when coalesce(item ->> 'event_date', '') ~ '^\d{4}-\d{2}-\d{2}$'
        then (item ->> 'event_date')::date end as event_date
    from jsonb_array_elements(p_items) item
  )
  update public.question_mock_facets f
  set reviewer_status = 'verified',
      question_type = coalesce(p.question_type, f.question_type),
      event_date = coalesce(f.event_date, p.event_date),
      evidence_source = 'strict-automated:' || p_verifier_version,
      metadata = coalesce(f.metadata, '{}'::jsonb)
        || jsonb_build_object(
          'human_review_required', false,
          'automated_verification', jsonb_build_object(
            'method', 'deterministic_strict',
            'verifier_version', p_verifier_version,
            'run_id', v_run_id,
            'plan_hash', p_plan_hash,
            'content_hash', p.content_hash,
            'verified_at', clock_timestamp()
          )
        ),
      updated_at = clock_timestamp()
  from proposed p
  where f.id = p.facet_id and f.question_id = p.question_id
    and f.reviewer_status = 'provisional';
  get diagnostics v_applied = row_count;

  if v_applied <> v_selected then
    raise exception 'strict_verification_atomic_update_failed' using errcode = '55000';
  end if;

  update public.mock_content_verification_runs
  set applied_count = v_applied where id = v_run_id;

  return query select v_run_id, v_applied, false;
end
$function$;

revoke all on function public.apply_strict_mock_facet_verification(text,text,text,text,jsonb,jsonb)
  from public, anon, authenticated;
grant execute on function public.apply_strict_mock_facet_verification(text,text,text,text,jsonb,jsonb)
  to service_role;

commit;
