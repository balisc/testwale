-- QuestionWale: generic full mock-test engine plus SSC CGL Tier 1 blueprint.
--
-- Append-safe and safe to rerun. This migration does not delete or rewrite
-- practice/user_attempt history. It resolves SSC CGL through the exact active
-- exam profile and never writes an invalid CGL value to questions.exam_tags.
--
-- IMPORTANT: run scripts/verify_ssc_cgl_tier1_mock_tests.sql in the same
-- intended Supabase environment before enabling QW_SSC_CGL_MOCKS_ENABLED.

begin;

do $preflight$
declare
  v_missing text;
  v_profile_count integer;
  v_version_count integer;
begin
  select string_agg(name, ', ' order by name)
  into v_missing
  from unnest(array[
    'public.users',
    'public.exam_profiles',
    'public.exam_syllabus_versions',
    'public.exam_syllabus_nodes',
    'public.ssc_cgl_tier_taxonomy_paths_v2',
    'public.question_exam_profile_mappings',
    'public.questions',
    'public.subjects',
    'public.topics',
    'public.subtopics'
  ]) as required(name)
  where to_regclass(required.name) is null;
  if v_missing is not null then
    raise exception 'SSC CGL mock migration prerequisites missing: %', v_missing;
  end if;

  select count(*) into v_profile_count
  from public.exam_profiles
  where code = 'SSC_CGL'
    and slug = 'ssc-combined-graduate-level-examination'
    and is_active is true;
  if v_profile_count <> 1 then
    raise exception 'Expected one active exact SSC_CGL profile; found %', v_profile_count;
  end if;

  select count(*) into v_version_count
  from public.exam_syllabus_versions v
  join public.exam_profiles p on p.id = v.exam_profile_id
  where p.code = 'SSC_CGL'
    and p.slug = 'ssc-combined-graduate-level-examination'
    and p.is_active is true
    and v.publication_status = 'published'
    and v.is_current is true;
  if v_version_count <> 1 then
    raise exception 'Expected one current published exact SSC_CGL syllabus; found %', v_version_count;
  end if;
end
$preflight$;

create table if not exists public.mock_test_blueprints (
  id uuid primary key default gen_random_uuid(),
  exam_profile_id uuid not null references public.exam_profiles(id) on delete restrict,
  code text not null unique,
  tier_code text not null check (tier_code = 'TIER_I'),
  pattern_year integer not null check (pattern_year between 2000 and 2100),
  version integer not null check (version > 0),
  title jsonb not null,
  description jsonb not null default '{}'::jsonb,
  rules jsonb not null,
  research_version text not null,
  research_confidence text not null check (research_confidence in ('very_low', 'low', 'medium', 'high')),
  is_provisional boolean not null default true,
  is_active boolean not null default false,
  is_production_ready boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exam_profile_id, tier_code, pattern_year, version)
);

create unique index if not exists mock_test_blueprints_one_active_per_exam_tier_idx
  on public.mock_test_blueprints (exam_profile_id, tier_code)
  where is_active;

create table if not exists public.mock_test_blueprint_cells (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references public.mock_test_blueprints(id) on delete restrict,
  section_key text not null check (section_key in ('reasoning', 'general_awareness', 'quantitative_aptitude', 'english')),
  section_sort_order smallint not null check (section_sort_order between 1 and 4),
  bucket_key text not null,
  label text not null,
  target_count smallint not null check (target_count between 0 and 25),
  min_count smallint not null check (min_count between 0 and 25),
  max_count smallint not null check (max_count between 0 and 25),
  minimum_inventory integer not null check (minimum_inventory >= 0),
  group_size smallint null check (group_size is null or group_size between 2 and 10),
  minimum_complete_groups smallint null check (minimum_complete_groups is null or minimum_complete_groups > 0),
  difficulty_rules jsonb not null default '{}'::jsonb,
  freshness_rules jsonb not null default '{}'::jsonb,
  fallback_policy jsonb not null default '{}'::jsonb,
  sort_order smallint not null check (sort_order > 0),
  created_at timestamptz not null default now(),
  unique (blueprint_id, bucket_key),
  check (min_count <= target_count and target_count <= max_count),
  check ((group_size is null and minimum_complete_groups is null) or (group_size is not null and minimum_complete_groups is not null))
);

create index if not exists mock_test_blueprint_cells_lookup_idx
  on public.mock_test_blueprint_cells (blueprint_id, section_sort_order, sort_order);

create table if not exists public.question_mock_groups (
  id uuid primary key default gen_random_uuid(),
  exam_profile_id uuid not null references public.exam_profiles(id) on delete restrict,
  group_key text not null,
  group_type text not null check (group_type in ('cloze', 'reading_comprehension', 'shared_stimulus')),
  title jsonb not null default '{}'::jsonb,
  passage jsonb not null,
  media jsonb not null default '[]'::jsonb,
  expected_item_count smallint not null check (expected_item_count between 2 and 10),
  source_metadata jsonb not null default '{}'::jsonb,
  reviewer_status text not null check (reviewer_status in ('provisional', 'verified', 'rejected')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exam_profile_id, group_key)
);

create table if not exists public.question_mock_facets (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete restrict,
  exam_profile_id uuid not null references public.exam_profiles(id) on delete restrict,
  blueprint_code text not null,
  section_key text not null check (section_key in ('reasoning', 'general_awareness', 'quantitative_aptitude', 'english')),
  bucket_key text not null,
  difficulty_band text not null check (difficulty_band in ('basic', 'intermediate', 'advanced')),
  question_type text null,
  event_date date null,
  group_id uuid null references public.question_mock_groups(id) on delete restrict,
  group_order smallint null check (group_order is null or group_order > 0),
  classifier_version text not null,
  evidence_source text not null,
  reviewer_status text not null check (reviewer_status in ('provisional', 'verified', 'rejected')),
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, exam_profile_id, blueprint_code),
  check ((group_id is null and group_order is null) or (group_id is not null and group_order is not null))
);

create index if not exists question_mock_facets_candidate_idx
  on public.question_mock_facets (blueprint_code, section_key, bucket_key, reviewer_status, difficulty_band, question_id)
  where is_active;
create index if not exists question_mock_facets_group_idx
  on public.question_mock_facets (group_id, group_order) where group_id is not null and is_active;
create unique index if not exists question_mock_facets_group_order_unique_idx
  on public.question_mock_facets (group_id, group_order) where group_id is not null;
create index if not exists question_mock_facets_event_idx
  on public.question_mock_facets (event_date desc) where event_date is not null and is_active;

create table if not exists public.mock_test_generation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  idempotency_key text not null check (length(idempotency_key) between 16 and 128),
  status text not null check (status in ('pending', 'succeeded', 'failed')),
  resulting_test_id uuid null,
  safe_failure_code text null,
  failure_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz null,
  unique (user_id, idempotency_key)
);

create index if not exists mock_test_generation_requests_user_created_idx
  on public.mock_test_generation_requests (user_id, created_at desc);

create table if not exists public.mock_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  exam_profile_id uuid not null references public.exam_profiles(id) on delete restrict,
  blueprint_id uuid not null references public.mock_test_blueprints(id) on delete restrict,
  blueprint_code text not null,
  test_number bigint generated always as identity,
  title text not null,
  rules_snapshot jsonb not null,
  blueprint_snapshot jsonb not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'submitted', 'auto_submitted')),
  timing_mode text null check (timing_mode is null or timing_mode in ('standard', 'scribe_simulation')),
  created_at timestamptz not null default now(),
  started_at timestamptz null,
  submitted_at timestamptz null,
  auto_submitted_at timestamptz null,
  deadline_at timestamptz null,
  total_questions smallint not null default 100 check (total_questions = 100),
  attempted_count smallint not null default 0 check (attempted_count between 0 and 100),
  correct_count smallint not null default 0 check (correct_count between 0 and 100),
  wrong_count smallint not null default 0 check (wrong_count between 0 and 100),
  unanswered_count smallint not null default 100 check (unanswered_count between 0 and 100),
  marked_count smallint not null default 0 check (marked_count between 0 and 100),
  positive_marks numeric(6,2) not null default 0,
  negative_marks numeric(6,2) not null default 0,
  final_score numeric(6,2) null check (final_score is null or final_score between -50 and 200),
  max_score numeric(6,2) not null default 200 check (max_score = 200),
  accuracy numeric(6,3) not null default 0 check (accuracy between 0 and 100),
  wall_time_seconds integer not null default 0 check (wall_time_seconds between 0 and 4800),
  active_time_seconds integer not null default 0 check (active_time_seconds between 0 and 4800),
  relaxation_count integer not null default 0 check (relaxation_count >= 0),
  generation_metadata jsonb not null default '{}'::jsonb,
  private_seed_hash text not null check (length(private_seed_hash) between 32 and 128),
  finalized_at timestamptz null,
  updated_at timestamptz not null default now(),
  check (
    (status = 'not_started' and started_at is null and deadline_at is null and timing_mode is null and finalized_at is null)
    or (status = 'in_progress' and started_at is not null and deadline_at is not null and timing_mode is not null and finalized_at is null)
    or (status = 'submitted' and started_at is not null and deadline_at is not null and submitted_at is not null and timing_mode is not null and finalized_at is not null)
    or (status = 'auto_submitted' and started_at is not null and deadline_at is not null and auto_submitted_at is not null and timing_mode is not null and finalized_at is not null)
  ),
  check (correct_count + wrong_count = attempted_count),
  check (attempted_count + unanswered_count = total_questions),
  check (final_score is null or final_score = positive_marks - negative_marks)
);

alter table public.mock_test_generation_requests
  drop constraint if exists mock_test_generation_requests_resulting_test_id_fkey;
alter table public.mock_test_generation_requests
  add constraint mock_test_generation_requests_resulting_test_id_fkey
  foreign key (resulting_test_id) references public.mock_tests(id) on delete restrict;

create index if not exists mock_tests_user_history_idx
  on public.mock_tests (user_id, created_at desc, id desc);
create index if not exists mock_tests_user_active_idx
  on public.mock_tests (user_id, status, deadline_at) where status in ('not_started', 'in_progress');
create index if not exists mock_tests_expiry_idx
  on public.mock_tests (deadline_at, id) where status = 'in_progress';

create table if not exists public.mock_test_group_snapshots (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.mock_tests(id) on delete cascade,
  original_group_id uuid not null references public.question_mock_groups(id) on delete restrict,
  group_type text not null check (group_type in ('cloze', 'reading_comprehension', 'shared_stimulus')),
  passage_snapshot jsonb not null,
  media_snapshot jsonb not null default '[]'::jsonb,
  expected_item_count smallint not null check (expected_item_count between 2 and 10),
  source_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (test_id, original_group_id)
);

create index if not exists mock_test_group_snapshots_test_idx
  on public.mock_test_group_snapshots (test_id, id);

create table if not exists public.mock_test_items (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.mock_tests(id) on delete cascade,
  original_question_id uuid not null references public.questions(id) on delete restrict,
  section_key text not null check (section_key in ('reasoning', 'general_awareness', 'quantitative_aptitude', 'english')),
  bucket_key text not null,
  section_order smallint not null check (section_order between 1 and 25),
  overall_order smallint not null check (overall_order between 1 and 100),
  group_snapshot_id uuid null references public.mock_test_group_snapshots(id) on delete restrict,
  group_order smallint null,
  question_snapshot jsonb not null,
  options_snapshot jsonb not null,
  option_order text[] not null check (cardinality(option_order) = 4),
  taxonomy_snapshot jsonb not null,
  media_snapshot jsonb not null default '[]'::jsonb,
  marks_correct numeric(4,2) not null default 2 check (marks_correct = 2),
  marks_wrong numeric(4,2) not null default -0.5 check (marks_wrong = -0.5),
  created_at timestamptz not null default now(),
  unique (test_id, original_question_id),
  unique (test_id, section_key, section_order),
  unique (test_id, overall_order),
  check ((group_snapshot_id is null and group_order is null) or (group_snapshot_id is not null and group_order is not null))
);

create index if not exists mock_test_items_lookup_idx on public.mock_test_items (test_id, overall_order);

create table if not exists public.mock_test_item_answers (
  item_id uuid primary key references public.mock_test_items(id) on delete cascade,
  correct_option text not null check (correct_option in ('A', 'B', 'C', 'D')),
  explanation_snapshot jsonb not null,
  source_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.mock_test_responses (
  test_id uuid not null references public.mock_tests(id) on delete cascade,
  item_id uuid not null references public.mock_test_items(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  selected_option text null check (selected_option is null or selected_option in ('A', 'B', 'C', 'D')),
  visited boolean not null default false,
  marked_for_review boolean not null default false,
  answer_changed_count integer not null default 0 check (answer_changed_count >= 0),
  first_viewed_at timestamptz null,
  first_answered_at timestamptz null,
  last_saved_at timestamptz not null default now(),
  active_time_seconds integer not null default 0 check (active_time_seconds between 0 and 4800),
  visit_count integer not null default 0 check (visit_count >= 0),
  event_version integer not null check (event_version >= 0),
  primary key (test_id, item_id),
  unique (item_id, user_id)
);

create index if not exists mock_test_responses_user_test_idx on public.mock_test_responses (user_id, test_id);

create table if not exists public.mock_test_section_attempts (
  test_id uuid not null references public.mock_tests(id) on delete cascade,
  section_key text not null check (section_key in ('reasoning', 'general_awareness', 'quantitative_aptitude', 'english')),
  section_order smallint not null check (section_order between 1 and 4),
  window_starts_at timestamptz not null,
  window_ends_at timestamptz not null,
  locked_at timestamptz null,
  attempted_count smallint not null default 0 check (attempted_count between 0 and 25),
  correct_count smallint not null default 0 check (correct_count between 0 and 25),
  wrong_count smallint not null default 0 check (wrong_count between 0 and 25),
  unanswered_count smallint not null default 25 check (unanswered_count between 0 and 25),
  positive_marks numeric(5,2) not null default 0,
  negative_marks numeric(5,2) not null default 0,
  score numeric(5,2) not null default 0,
  active_time_seconds integer not null default 0 check (active_time_seconds between 0 and 4800),
  primary key (test_id, section_key),
  unique (test_id, section_order),
  check (window_ends_at > window_starts_at),
  check (correct_count + wrong_count = attempted_count),
  check (attempted_count + unanswered_count = 25),
  check (score = positive_marks - negative_marks)
);

alter table public.mock_test_section_attempts
  drop constraint if exists mock_test_section_attempts_active_time_seconds_check;
alter table public.mock_test_section_attempts
  add constraint mock_test_section_attempts_active_time_seconds_check
  check (active_time_seconds between 0 and 4800);

create table if not exists public.mock_test_generation_audit (
  id bigint generated always as identity primary key,
  test_id uuid not null references public.mock_tests(id) on delete cascade,
  section_key text null,
  bucket_key text null,
  relaxation_code text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists mock_test_generation_audit_test_idx on public.mock_test_generation_audit (test_id, id);

-- Defense in depth for the repository's custom-cookie auth: the application
-- authenticates in Next.js and calls only service-role RPCs. Browser roles get
-- no direct rows, including after submission. This prevents pre-submit answer
-- keys and cross-user tests from being queried through PostgREST.
alter table public.mock_test_blueprints enable row level security;
alter table public.mock_test_blueprint_cells enable row level security;
alter table public.question_mock_groups enable row level security;
alter table public.question_mock_facets enable row level security;
alter table public.mock_test_generation_requests enable row level security;
alter table public.mock_tests enable row level security;
alter table public.mock_test_group_snapshots enable row level security;
alter table public.mock_test_items enable row level security;
alter table public.mock_test_item_answers enable row level security;
alter table public.mock_test_responses enable row level security;
alter table public.mock_test_section_attempts enable row level security;
alter table public.mock_test_generation_audit enable row level security;

revoke all on table public.mock_test_blueprints from public, anon, authenticated;
revoke all on table public.mock_test_blueprint_cells from public, anon, authenticated;
revoke all on table public.question_mock_groups from public, anon, authenticated;
revoke all on table public.question_mock_facets from public, anon, authenticated;
revoke all on table public.mock_test_generation_requests from public, anon, authenticated;
revoke all on table public.mock_tests from public, anon, authenticated;
revoke all on table public.mock_test_group_snapshots from public, anon, authenticated;
revoke all on table public.mock_test_items from public, anon, authenticated;
revoke all on table public.mock_test_item_answers from public, anon, authenticated;
revoke all on table public.mock_test_responses from public, anon, authenticated;
revoke all on table public.mock_test_section_attempts from public, anon, authenticated;
revoke all on table public.mock_test_generation_audit from public, anon, authenticated;
grant all on table public.mock_test_blueprints to service_role;
grant all on table public.mock_test_blueprint_cells to service_role;
grant all on table public.question_mock_groups to service_role;
grant all on table public.question_mock_facets to service_role;
grant all on table public.mock_test_generation_requests to service_role;
grant all on table public.mock_tests to service_role;
grant all on table public.mock_test_group_snapshots to service_role;
grant all on table public.mock_test_items to service_role;
grant all on table public.mock_test_item_answers to service_role;
grant all on table public.mock_test_responses to service_role;
grant all on table public.mock_test_section_attempts to service_role;
grant all on table public.mock_test_generation_audit to service_role;

create or replace function public.mock_question_has_four_options(p_options jsonb)
returns boolean
language sql
immutable
set search_path = pg_catalog, public
as $function$
  select case
    when jsonb_typeof(p_options) <> 'object' then false
    when jsonb_typeof(p_options -> 'en') = 'object' then
      coalesce(length(trim(p_options -> 'en' ->> 'A')) > 0, false)
      and coalesce(length(trim(p_options -> 'en' ->> 'B')) > 0, false)
      and coalesce(length(trim(p_options -> 'en' ->> 'C')) > 0, false)
      and coalesce(length(trim(p_options -> 'en' ->> 'D')) > 0, false)
    else
      coalesce(length(trim(coalesce(p_options ->> 'A', p_options -> 'A' ->> 'en', p_options -> 'A' ->> 'hi'))) > 0, false)
      and coalesce(length(trim(coalesce(p_options ->> 'B', p_options -> 'B' ->> 'en', p_options -> 'B' ->> 'hi'))) > 0, false)
      and coalesce(length(trim(coalesce(p_options ->> 'C', p_options -> 'C' ->> 'en', p_options -> 'C' ->> 'hi'))) > 0, false)
      and coalesce(length(trim(coalesce(p_options ->> 'D', p_options -> 'D' ->> 'en', p_options -> 'D' ->> 'hi'))) > 0, false)
  end
$function$;
revoke all on function public.mock_question_has_four_options(jsonb) from public, anon, authenticated;
grant execute on function public.mock_question_has_four_options(jsonb) to service_role;

create or replace function public.mock_question_has_required_options(p_options jsonb, p_require_hindi boolean)
returns boolean
language sql
immutable
set search_path = pg_catalog, public
as $function$
  select public.mock_question_has_four_options(p_options)
    and (
      not p_require_hindi
      or (
        case
          when jsonb_typeof(p_options -> 'hi') = 'object' then
            coalesce(length(trim(p_options -> 'hi' ->> 'A')) > 0, false)
            and coalesce(length(trim(p_options -> 'hi' ->> 'B')) > 0, false)
            and coalesce(length(trim(p_options -> 'hi' ->> 'C')) > 0, false)
            and coalesce(length(trim(p_options -> 'hi' ->> 'D')) > 0, false)
          else
            coalesce(length(trim(p_options -> 'A' ->> 'hi')) > 0, false)
            and coalesce(length(trim(p_options -> 'B' ->> 'hi')) > 0, false)
            and coalesce(length(trim(p_options -> 'C' ->> 'hi')) > 0, false)
            and coalesce(length(trim(p_options -> 'D' ->> 'hi')) > 0, false)
        end
      )
    )
$function$;
revoke all on function public.mock_question_has_required_options(jsonb, boolean) from public, anon, authenticated;
grant execute on function public.mock_question_has_required_options(jsonb, boolean) to service_role;

create or replace function public.get_mock_test_readiness(p_blueprint_code text)
returns table (
  blueprint_id uuid,
  blueprint_code text,
  bucket_key text,
  section_key text,
  label text,
  required_count integer,
  verified_eligible_count bigint,
  provisional_eligible_count bigint,
  complete_group_count bigint,
  deficit bigint,
  bucket_ready boolean,
  production_ready boolean
)
language sql
security definer
set search_path = pg_catalog, public
as $function$
  with selected_blueprint as (
    select b.*
    from public.mock_test_blueprints b
    join public.exam_profiles ep on ep.id = b.exam_profile_id
    where b.code = p_blueprint_code
      and b.is_active is true
      and ep.is_active is true
  ), candidate_rows as (
    select
      c.id as cell_id,
      f.reviewer_status,
      f.question_id,
      f.group_id,
      g.expected_item_count,
      count(*) over (partition by f.group_id) as actual_group_items
    from selected_blueprint b
    join public.mock_test_blueprint_cells c on c.blueprint_id = b.id
    left join public.question_mock_facets f
      on f.exam_profile_id = b.exam_profile_id
     and f.blueprint_code = b.code
     and f.section_key = c.section_key
     and f.bucket_key = c.bucket_key
     and f.is_active is true
     and f.reviewer_status in ('verified', 'provisional')
    left join public.questions q
      on q.id = f.question_id
     and q.is_active is true
     and q.is_verified is true
     and q.correct_option in ('A', 'B', 'C', 'D')
     and public.mock_question_has_required_options(q.options, c.section_key <> 'english')
     and coalesce(length(trim(q.question_text ->> 'en')), 0) > 0
     and (c.section_key = 'english' or coalesce(length(trim(q.question_text ->> 'hi')), 0) > 0)
     and coalesce(length(trim(coalesce(q.explanation ->> 'en', q.explanation ->> 'hi'))), 0) > 0
     and (
       coalesce(length(trim(q.source)), 0) > 0
       or (jsonb_typeof(q.source_metadata) = 'object' and q.source_metadata <> '{}'::jsonb)
     )
     and coalesce(q.report_count, 0) = 0
     and (
       not (coalesce(q.source_metadata, '{}'::jsonb) ? 'media')
       or coalesce(f.metadata ->> 'media_verified', 'false') = 'true'
     )
    left join public.question_exam_profile_mappings qm
      on qm.question_id = q.id
     and qm.exam_profile_id = b.exam_profile_id
     and qm.is_active is true
     and qm.stage_codes @> array['TIER_I']::text[]
    left join public.subtopics st on st.id = q.subtopic_id and st.is_active is true
    left join public.topics t on t.id = q.topic_id and t.is_active is true
    left join public.subjects s on s.id = q.subject_id and s.is_active is true
    left join public.question_mock_groups g on g.id = f.group_id and g.is_active is true and g.reviewer_status = 'verified'
    where q.id is not null and qm.question_id is not null and st.id is not null and t.id is not null and s.id is not null
      and (
        c.bucket_key <> 'current_events'
        or (
          f.event_date is not null
          and f.event_date >= (c.freshness_rules ->> 'earliest')::date
          and f.event_date <= (c.freshness_rules ->> 'latest')::date
        )
      )
  ), counts as (
    select
      c.id as cell_id,
      count(distinct r.question_id) filter (where r.reviewer_status = 'verified') as verified_count,
      count(distinct r.question_id) as provisional_count,
      count(distinct r.group_id) filter (
        where r.reviewer_status = 'verified'
          and r.group_id is not null
          and r.actual_group_items = r.expected_item_count
      ) as complete_groups
    from public.mock_test_blueprint_cells c
    join selected_blueprint b on b.id = c.blueprint_id
    left join candidate_rows r on r.cell_id = c.id
    group by c.id
  )
  select
    b.id,
    b.code,
    c.bucket_key,
    c.section_key,
    c.label,
    c.minimum_inventory,
    coalesce(k.verified_count, 0),
    coalesce(k.provisional_count, 0),
    coalesce(k.complete_groups, 0),
    greatest(c.minimum_inventory::bigint - coalesce(k.verified_count, 0), 0),
    coalesce(k.verified_count, 0) >= c.minimum_inventory
      and (c.minimum_complete_groups is null or coalesce(k.complete_groups, 0) >= c.minimum_complete_groups),
    b.is_production_ready
      and bool_and(
        coalesce(k.verified_count, 0) >= c.minimum_inventory
        and (c.minimum_complete_groups is null or coalesce(k.complete_groups, 0) >= c.minimum_complete_groups)
      ) over (partition by b.id)
  from selected_blueprint b
  join public.mock_test_blueprint_cells c on c.blueprint_id = b.id
  left join counts k on k.cell_id = c.id
  order by c.section_sort_order, c.sort_order
$function$;
revoke all on function public.get_mock_test_readiness(text) from public, anon, authenticated;
grant execute on function public.get_mock_test_readiness(text) to service_role;

create or replace function public.get_mock_test_candidates(
  p_blueprint_code text,
  p_allow_provisional boolean default false
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
  group_size smallint
)
language sql
security definer
set search_path = pg_catalog, public
as $function$
  select
    q.id, f.section_key, f.bucket_key, f.difficulty_band, q.correct_option,
    f.event_date, f.group_id, f.group_order, g.expected_item_count
  from public.mock_test_blueprints b
  join public.exam_profiles ep on ep.id = b.exam_profile_id
  join public.mock_test_blueprint_cells c on c.blueprint_id = b.id
  join public.question_mock_facets f
    on f.exam_profile_id = b.exam_profile_id
   and f.blueprint_code = b.code
   and f.section_key = c.section_key
   and f.bucket_key = c.bucket_key
   and f.is_active is true
   and (f.reviewer_status = 'verified' or (p_allow_provisional and f.reviewer_status = 'provisional'))
  join public.questions q
    on q.id = f.question_id
   and q.is_active is true
   and q.is_verified is true
   and q.correct_option in ('A', 'B', 'C', 'D')
   and public.mock_question_has_required_options(q.options, c.section_key <> 'english')
   and coalesce(length(trim(q.question_text ->> 'en')), 0) > 0
   and (c.section_key = 'english' or coalesce(length(trim(q.question_text ->> 'hi')), 0) > 0)
   and coalesce(length(trim(coalesce(q.explanation ->> 'en', q.explanation ->> 'hi'))), 0) > 0
   and (
     coalesce(length(trim(q.source)), 0) > 0
     or (jsonb_typeof(q.source_metadata) = 'object' and q.source_metadata <> '{}'::jsonb)
   )
   and coalesce(q.report_count, 0) = 0
   and (
     not (coalesce(q.source_metadata, '{}'::jsonb) ? 'media')
     or coalesce(f.metadata ->> 'media_verified', 'false') = 'true'
   )
  join public.question_exam_profile_mappings qm
    on qm.question_id = q.id
   and qm.exam_profile_id = b.exam_profile_id
   and qm.is_active is true
   and qm.stage_codes @> array['TIER_I']::text[]
  join public.subjects subj on subj.id = q.subject_id and subj.is_active is true
  join public.topics topic on topic.id = q.topic_id and topic.is_active is true
  join public.subtopics subtopic on subtopic.id = q.subtopic_id and subtopic.is_active is true
  left join public.question_mock_groups g
    on g.id = f.group_id
   and g.exam_profile_id = b.exam_profile_id
   and g.is_active is true
   and (g.reviewer_status = 'verified' or (p_allow_provisional and g.reviewer_status = 'provisional'))
  where b.code = p_blueprint_code
    and b.is_active is true
    and ep.is_active is true
    and (c.group_size is null or (g.id is not null and g.expected_item_count = c.group_size))
    and (c.group_size is not null or f.group_id is null)
    and (
      c.bucket_key <> 'current_events'
      or (
        f.event_date is not null
        and f.event_date >= (c.freshness_rules ->> 'earliest')::date
        and f.event_date <= (c.freshness_rules ->> 'latest')::date
      )
    )
  order by c.section_sort_order, c.sort_order, f.difficulty_band, f.question_id
$function$;
revoke all on function public.get_mock_test_candidates(text, boolean) from public, anon, authenticated;
grant execute on function public.get_mock_test_candidates(text, boolean) to service_role;

create or replace function public.qw_mock_immutable_item_guard()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $function$
begin
  raise exception 'mock_test_items_are_immutable' using errcode = '55000';
end
$function$;

drop trigger if exists mock_test_items_immutable on public.mock_test_items;
create trigger mock_test_items_immutable before update or delete on public.mock_test_items
for each row execute function public.qw_mock_immutable_item_guard();
drop trigger if exists mock_test_group_snapshots_immutable on public.mock_test_group_snapshots;
create trigger mock_test_group_snapshots_immutable before update or delete on public.mock_test_group_snapshots
for each row execute function public.qw_mock_immutable_item_guard();
drop trigger if exists mock_test_answers_immutable on public.mock_test_item_answers;
create trigger mock_test_answers_immutable before update or delete on public.mock_test_item_answers
for each row execute function public.qw_mock_immutable_item_guard();

create or replace function public.qw_mock_response_terminal_guard()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $function$
declare
  v_status text;
begin
  select status into v_status from public.mock_tests where id = coalesce(new.test_id, old.test_id);
  if v_status in ('submitted', 'auto_submitted') then
    raise exception 'mock_test_is_final' using errcode = '55000';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$function$;

drop trigger if exists mock_test_responses_terminal_guard on public.mock_test_responses;
create trigger mock_test_responses_terminal_guard before insert or update or delete on public.mock_test_responses
for each row execute function public.qw_mock_response_terminal_guard();

create or replace function public.qw_mock_test_state_guard()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $function$
declare
  v_expected_total integer;
  v_expected_section integer;
  v_strategy text;
begin
  if old.status in ('submitted', 'auto_submitted') then
    raise exception 'mock_test_is_final' using errcode = '55000';
  end if;
  if new.status <> old.status and not (
    (old.status = 'not_started' and new.status = 'in_progress')
    or (old.status = 'in_progress' and new.status in ('submitted', 'auto_submitted'))
  ) then
    raise exception 'invalid_mock_test_state_transition' using errcode = '55000';
  end if;
  if new.user_id <> old.user_id
     or new.exam_profile_id <> old.exam_profile_id
     or new.blueprint_id <> old.blueprint_id
     or new.blueprint_code <> old.blueprint_code
     or (
       new.rules_snapshot <> old.rules_snapshot
       and not (old.status = 'not_started' and new.status = 'in_progress')
     )
     or new.blueprint_snapshot <> old.blueprint_snapshot
     or new.title <> old.title
     or new.relaxation_count <> old.relaxation_count
     or new.generation_metadata <> old.generation_metadata
     or new.private_seed_hash <> old.private_seed_hash then
    raise exception 'mock_test_snapshot_is_immutable' using errcode = '55000';
  end if;
  if old.status = 'in_progress' and (
    new.timing_mode is distinct from old.timing_mode
    or new.started_at is distinct from old.started_at
    or new.deadline_at is distinct from old.deadline_at
  ) then
    raise exception 'mock_test_timing_is_immutable' using errcode = '55000';
  end if;
  if old.status = 'not_started' and new.status = 'in_progress' then
    v_strategy := coalesce(old.rules_snapshot ->> 'timing_strategy', 'sectional');
    v_expected_total := case when new.timing_mode = 'scribe_simulation'
      then (old.rules_snapshot ->> 'scribe_total_seconds')::integer
      else (old.rules_snapshot ->> 'standard_total_seconds')::integer end;
    v_expected_section := case when new.timing_mode = 'scribe_simulation'
      then nullif(old.rules_snapshot ->> 'scribe_section_seconds', '')::integer
      else nullif(old.rules_snapshot ->> 'standard_section_seconds', '')::integer end;
    if new.rules_snapshot ->> 'selected_timing_mode' is distinct from new.timing_mode
       or (new.rules_snapshot ->> 'selected_total_seconds')::integer is distinct from v_expected_total
       or (v_strategy = 'sectional' and (new.rules_snapshot ->> 'selected_section_seconds')::integer is distinct from v_expected_section)
       or (v_strategy = 'global' and new.rules_snapshot ? 'selected_section_seconds') then
      raise exception 'mock_test_selected_timing_snapshot_invalid' using errcode = '55000';
    end if;
  end if;
  return new;
end
$function$;

drop trigger if exists mock_tests_state_guard on public.mock_tests;
create trigger mock_tests_state_guard before update on public.mock_tests
for each row execute function public.qw_mock_test_state_guard();

create or replace function public.finalize_mock_test(
  p_user_id uuid,
  p_test_id uuid,
  p_manual boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_test public.mock_tests%rowtype;
  v_now timestamptz := clock_timestamp();
  v_attempted integer;
  v_correct integer;
  v_wrong integer;
  v_marked integer;
  v_active integer;
  v_final_status text;
  v_total_questions integer;
  v_marks_correct numeric;
  v_marks_wrong numeric;
begin
  select * into v_test from public.mock_tests where id = p_test_id and user_id = p_user_id for update;
  if not found then raise exception 'mock_test_not_found' using errcode = 'P0002'; end if;
  if v_test.status in ('submitted', 'auto_submitted') then
    return jsonb_build_object('test_id', v_test.id, 'status', v_test.status, 'score', v_test.final_score, 'already_final', true);
  end if;
  if v_test.status <> 'in_progress' then raise exception 'mock_test_not_in_progress' using errcode = '55000'; end if;
  if not p_manual and v_now < v_test.deadline_at then raise exception 'mock_test_not_expired' using errcode = '55000'; end if;
  v_total_questions := (v_test.rules_snapshot ->> 'questions')::integer;
  v_marks_correct := (v_test.rules_snapshot ->> 'marks_correct')::numeric;
  v_marks_wrong := (v_test.rules_snapshot ->> 'marks_wrong')::numeric;
  if v_total_questions <> v_test.total_questions or v_marks_correct <= 0 or v_marks_wrong > 0 then
    raise exception 'invalid_frozen_scoring_rules' using errcode = '22023';
  end if;

  select
    count(*) filter (where r.selected_option is not null),
    count(*) filter (where r.selected_option = a.correct_option),
    count(*) filter (where r.selected_option is not null and r.selected_option <> a.correct_option),
    count(*) filter (where r.marked_for_review),
    coalesce(sum(least(r.active_time_seconds, 90)), 0)
  into v_attempted, v_correct, v_wrong, v_marked, v_active
  from public.mock_test_items i
  join public.mock_test_item_answers a on a.item_id = i.id
  left join public.mock_test_responses r on r.test_id = i.test_id and r.item_id = i.id and r.user_id = p_user_id
  where i.test_id = p_test_id;

  v_final_status := case when p_manual and v_now < v_test.deadline_at then 'submitted' else 'auto_submitted' end;
  update public.mock_tests
  set status = v_final_status,
      submitted_at = case when v_final_status = 'submitted' then v_now else submitted_at end,
      auto_submitted_at = case when v_final_status = 'auto_submitted' then v_now else auto_submitted_at end,
      finalized_at = v_now,
      attempted_count = v_attempted,
      correct_count = v_correct,
      wrong_count = v_wrong,
      unanswered_count = v_total_questions - v_attempted,
      marked_count = v_marked,
      positive_marks = v_correct * v_marks_correct,
      negative_marks = v_wrong * abs(v_marks_wrong),
      final_score = (v_correct * v_marks_correct) - (v_wrong * abs(v_marks_wrong)),
      accuracy = case when v_attempted = 0 then 0 else round((v_correct::numeric / v_attempted::numeric) * 100, 3) end,
      wall_time_seconds = least(extract(epoch from (least(v_now, deadline_at) - started_at))::integer, (rules_snapshot ->> 'selected_total_seconds')::integer),
      active_time_seconds = least(v_active, (rules_snapshot ->> 'selected_total_seconds')::integer),
      updated_at = v_now
  where id = p_test_id;

  update public.mock_test_section_attempts sa
  set locked_at = case when coalesce(v_test.rules_snapshot ->> 'timing_strategy', 'sectional') = 'sectional'
        then coalesce(sa.locked_at, least(v_now, sa.window_ends_at)) else null end,
      attempted_count = x.attempted,
      correct_count = x.correct,
      wrong_count = x.wrong,
      unanswered_count = x.total_items - x.attempted,
      positive_marks = x.correct * v_marks_correct,
      negative_marks = x.wrong * abs(v_marks_wrong),
      score = (x.correct * v_marks_correct) - (x.wrong * abs(v_marks_wrong)),
      active_time_seconds = least(x.active_seconds, extract(epoch from (sa.window_ends_at - sa.window_starts_at))::integer)
  from (
    select i.section_key,
      count(*)::integer as total_items,
      count(*) filter (where r.selected_option is not null)::integer as attempted,
      count(*) filter (where r.selected_option = a.correct_option)::integer as correct,
      count(*) filter (where r.selected_option is not null and r.selected_option <> a.correct_option)::integer as wrong,
      coalesce(sum(least(r.active_time_seconds, 90)), 0)::integer as active_seconds
    from public.mock_test_items i
    join public.mock_test_item_answers a on a.item_id = i.id
    left join public.mock_test_responses r on r.test_id = i.test_id and r.item_id = i.id and r.user_id = p_user_id
    where i.test_id = p_test_id
    group by i.section_key
  ) x
  where sa.test_id = p_test_id and sa.section_key = x.section_key;

  select * into v_test from public.mock_tests where id = p_test_id;
  return jsonb_build_object('test_id', v_test.id, 'status', v_test.status, 'score', v_test.final_score, 'already_final', false);
end
$function$;
revoke all on function public.finalize_mock_test(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.finalize_mock_test(uuid, uuid, boolean) to service_role;

create or replace function public.start_mock_test(p_user_id uuid, p_test_id uuid, p_timing_mode text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_test public.mock_tests%rowtype;
  v_now timestamptz := clock_timestamp();
  v_section_seconds integer;
  v_total_seconds integer;
  v_timing_strategy text;
begin
  if p_timing_mode not in ('standard', 'scribe_simulation') then raise exception 'invalid_timing_mode' using errcode = '22023'; end if;
  select * into v_test from public.mock_tests where id = p_test_id and user_id = p_user_id for update;
  if not found then raise exception 'mock_test_not_found' using errcode = 'P0002'; end if;
  if v_test.status in ('submitted', 'auto_submitted') then raise exception 'mock_test_already_submitted' using errcode = '55000'; end if;
  if v_test.status = 'in_progress' then
    return jsonb_build_object('test_id', v_test.id, 'status', v_test.status, 'timing_mode', v_test.timing_mode, 'started_at', v_test.started_at, 'deadline_at', v_test.deadline_at, 'server_now', v_now);
  end if;
  v_timing_strategy := coalesce(v_test.rules_snapshot ->> 'timing_strategy', 'sectional');
  if v_timing_strategy not in ('sectional', 'global') then raise exception 'invalid_timing_strategy' using errcode = '22023'; end if;
  v_total_seconds := case when p_timing_mode = 'scribe_simulation'
    then (v_test.rules_snapshot ->> 'scribe_total_seconds')::integer
    else (v_test.rules_snapshot ->> 'standard_total_seconds')::integer end;
  v_section_seconds := case when v_timing_strategy = 'sectional' then
    case when p_timing_mode = 'scribe_simulation'
      then (v_test.rules_snapshot ->> 'scribe_section_seconds')::integer
      else (v_test.rules_snapshot ->> 'standard_section_seconds')::integer end
    else null end;
  if v_total_seconds not between 1 and 4800 or (v_timing_strategy = 'sectional' and v_section_seconds * 4 <> v_total_seconds) then
    raise exception 'invalid_blueprint_timing_rules' using errcode = '22023';
  end if;
  update public.mock_tests
  set status = 'in_progress', timing_mode = p_timing_mode, started_at = v_now,
      deadline_at = v_now + make_interval(secs => v_total_seconds),
      rules_snapshot = rules_snapshot || jsonb_build_object(
        'selected_timing_mode', p_timing_mode,
        'selected_total_seconds', v_total_seconds
      ) || case when v_timing_strategy = 'sectional'
             then jsonb_build_object('selected_section_seconds', v_section_seconds)
             else '{}'::jsonb end,
      updated_at = v_now
  where id = p_test_id;

  insert into public.mock_test_section_attempts (test_id, section_key, section_order, window_starts_at, window_ends_at)
  select p_test_id, sections.section_key, sections.section_order,
    case when v_timing_strategy = 'sectional' then v_now + make_interval(secs => v_section_seconds * (sections.section_order - 1)) else v_now end,
    case when v_timing_strategy = 'sectional' then v_now + make_interval(secs => v_section_seconds * sections.section_order) else v_now + make_interval(secs => v_total_seconds) end
  from (
    select section_key, min(section_sort_order)::smallint as section_order
    from public.mock_test_blueprint_cells where blueprint_id = v_test.blueprint_id
    group by section_key
  ) sections
  on conflict (test_id, section_key) do nothing;
  return jsonb_build_object('test_id', p_test_id, 'status', 'in_progress', 'timing_mode', p_timing_mode, 'started_at', v_now, 'deadline_at', v_now + make_interval(secs => v_total_seconds), 'server_now', v_now);
end
$function$;
revoke all on function public.start_mock_test(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.start_mock_test(uuid, uuid, text) to service_role;

create or replace function public.save_mock_test_response(
  p_user_id uuid,
  p_test_id uuid,
  p_item_id uuid,
  p_selected_option text,
  p_visited boolean,
  p_marked_for_review boolean,
  p_event_version integer,
  p_active_time_delta_seconds integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_test public.mock_tests%rowtype;
  v_item public.mock_test_items%rowtype;
  v_now timestamptz := clock_timestamp();
  v_timing_strategy text;
  v_section_seconds integer;
  v_active_section integer;
  v_item_section integer;
  v_existing public.mock_test_responses%rowtype;
begin
  if p_selected_option is not null and p_selected_option not in ('A', 'B', 'C', 'D') then raise exception 'invalid_selected_option' using errcode = '22023'; end if;
  if p_event_version < 0 or p_active_time_delta_seconds < 0 or p_active_time_delta_seconds > 60 then raise exception 'invalid_response_version_or_time' using errcode = '22023'; end if;
  select * into v_test from public.mock_tests where id = p_test_id and user_id = p_user_id for update;
  if not found then raise exception 'mock_test_not_found' using errcode = 'P0002'; end if;
  if v_test.status in ('submitted', 'auto_submitted') then raise exception 'mock_test_already_submitted' using errcode = '55000'; end if;
  if v_test.status <> 'in_progress' then raise exception 'mock_test_not_started' using errcode = '55000'; end if;
  if v_now >= v_test.deadline_at then
    perform public.finalize_mock_test(p_user_id, p_test_id, false);
    return jsonb_build_object('saved', false, 'expired', true, 'server_now', v_now);
  end if;
  select * into v_item from public.mock_test_items where id = p_item_id and test_id = p_test_id;
  if not found then raise exception 'mock_item_not_found' using errcode = 'P0002'; end if;
  v_timing_strategy := coalesce(v_test.rules_snapshot ->> 'timing_strategy', 'sectional');
  if v_timing_strategy = 'sectional' then
    v_section_seconds := (v_test.rules_snapshot ->> 'selected_section_seconds')::integer;
    v_active_section := floor(extract(epoch from (v_now - v_test.started_at)) / v_section_seconds)::integer + 1;
    select min(section_sort_order) into v_item_section
    from public.mock_test_blueprint_cells
    where blueprint_id = v_test.blueprint_id and section_key = v_item.section_key;
    if v_item_section <> v_active_section then raise exception 'mock_section_locked' using errcode = '55000'; end if;
  elsif v_timing_strategy <> 'global' then
    raise exception 'invalid_timing_strategy' using errcode = '22023';
  end if;

  select * into v_existing from public.mock_test_responses where test_id = p_test_id and item_id = p_item_id for update;
  if found and p_event_version <= v_existing.event_version then
    return jsonb_build_object('saved', false, 'conflict', true, 'event_version', v_existing.event_version, 'server_now', v_now);
  end if;

  insert into public.mock_test_responses (
    test_id, item_id, user_id, selected_option, visited, marked_for_review,
    answer_changed_count, first_viewed_at, first_answered_at, last_saved_at,
    active_time_seconds, visit_count, event_version
  ) values (
    p_test_id, p_item_id, p_user_id, p_selected_option, coalesce(p_visited, true), coalesce(p_marked_for_review, false),
    0, case when p_visited then v_now else null end, case when p_selected_option is not null then v_now else null end, v_now,
    least(p_active_time_delta_seconds, 60), case when p_visited then 1 else 0 end, p_event_version
  )
  on conflict (test_id, item_id) do update
  set selected_option = excluded.selected_option,
      visited = public.mock_test_responses.visited or excluded.visited,
      marked_for_review = excluded.marked_for_review,
      answer_changed_count = public.mock_test_responses.answer_changed_count
        + case when public.mock_test_responses.selected_option is distinct from excluded.selected_option then 1 else 0 end,
      first_viewed_at = coalesce(public.mock_test_responses.first_viewed_at, excluded.first_viewed_at),
      first_answered_at = coalesce(public.mock_test_responses.first_answered_at, excluded.first_answered_at),
      last_saved_at = v_now,
      active_time_seconds = least(public.mock_test_responses.active_time_seconds + excluded.active_time_seconds, 4800),
      visit_count = public.mock_test_responses.visit_count
        + case when not public.mock_test_responses.visited and excluded.visited then 1 else 0 end,
      event_version = excluded.event_version
  where excluded.event_version > public.mock_test_responses.event_version;
  return jsonb_build_object('saved', true, 'conflict', false, 'event_version', p_event_version, 'server_now', v_now);
end
$function$;
revoke all on function public.save_mock_test_response(uuid, uuid, uuid, text, boolean, boolean, integer, integer) from public, anon, authenticated;
grant execute on function public.save_mock_test_response(uuid, uuid, uuid, text, boolean, boolean, integer, integer) to service_role;

create or replace function public.create_mock_test_from_selection(
  p_user_id uuid,
  p_idempotency_key text,
  p_blueprint_code text,
  p_private_seed_hash text,
  p_items jsonb,
  p_generation_metadata jsonb default '{}'::jsonb,
  p_relaxations jsonb default '[]'::jsonb,
  p_allow_limited boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_blueprint public.mock_test_blueprints%rowtype;
  v_request public.mock_test_generation_requests%rowtype;
  v_test_id uuid;
  v_invalid integer;
  v_relaxation_count integer;
begin
  if p_idempotency_key is null or length(p_idempotency_key) not between 16 and 128 then raise exception 'invalid_idempotency_key' using errcode = '22023'; end if;
  if p_private_seed_hash is null or length(p_private_seed_hash) not between 32 and 128 then raise exception 'invalid_seed_hash' using errcode = '22023'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) <> 100 then raise exception 'mock_selection_must_have_100_items' using errcode = '22023'; end if;
  if jsonb_typeof(p_relaxations) <> 'array' then raise exception 'invalid_relaxations' using errcode = '22023'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_idempotency_key, 0));
  select * into v_request from public.mock_test_generation_requests
  where user_id = p_user_id and idempotency_key = p_idempotency_key for update;
  if found and v_request.status = 'succeeded' and v_request.resulting_test_id is not null then
    return jsonb_build_object('test_id', v_request.resulting_test_id, 'reused', true);
  end if;

  if (select count(*) from public.mock_test_generation_requests where user_id = p_user_id and created_at >= clock_timestamp() - interval '1 minute') >= 3 then
    raise exception 'mock_generation_rate_limited' using errcode = '54000';
  end if;
  if (select count(*) from public.mock_test_generation_requests where user_id = p_user_id and created_at >= clock_timestamp() - interval '1 day') >= 10 then
    raise exception 'mock_generation_daily_quota' using errcode = '54000';
  end if;

  select b.* into v_blueprint from public.mock_test_blueprints b
  join public.exam_profiles ep on ep.id = b.exam_profile_id
  where b.code = p_blueprint_code and b.is_active is true
    and ep.is_active is true;
  if not found then raise exception 'mock_blueprint_unavailable' using errcode = 'P0002'; end if;
  if not v_blueprint.is_production_ready and not p_allow_limited then raise exception 'mock_blueprint_not_production_ready' using errcode = '55000'; end if;

  insert into public.mock_test_generation_requests (user_id, idempotency_key, status)
  values (p_user_id, p_idempotency_key, 'pending')
  on conflict (user_id, idempotency_key) do update set status = 'pending', safe_failure_code = null, failure_metadata = '{}'::jsonb
  returning * into v_request;

  create temporary table qw_mock_selection (
    question_id uuid primary key,
    section_key text not null,
    bucket_key text not null,
    section_order integer not null,
    overall_order integer not null unique,
    option_order text[] not null,
    displayed_correct_option text not null
  ) on commit drop;
  insert into qw_mock_selection
  select
    (value ->> 'questionId')::uuid,
    value ->> 'sectionKey',
    value ->> 'bucketKey',
    (value ->> 'sectionOrder')::integer,
    (value ->> 'overallOrder')::integer,
    array(select jsonb_array_elements_text(value -> 'optionOrder')),
    value ->> 'displayedCorrectOption'
  from jsonb_array_elements(p_items) as item(value);

  select count(*) into v_invalid
  from qw_mock_selection s
  left join (
    select section_key, min(section_sort_order) as section_sort_order
    from public.mock_test_blueprint_cells
    where blueprint_id = v_blueprint.id
    group by section_key
  ) configured on configured.section_key = s.section_key
  where configured.section_key is null
     or s.section_order not between 1 and 25 or s.overall_order not between 1 and 100
     or s.overall_order not between ((configured.section_sort_order - 1) * 25 + 1) and (configured.section_sort_order * 25)
     or cardinality(s.option_order) <> 4
     or not (s.option_order @> array['A','B','C','D']::text[])
     or s.displayed_correct_option not in ('A','B','C','D');
  if v_invalid <> 0 then raise exception 'invalid_mock_selection_shape' using errcode = '22023'; end if;
  select count(*) into v_invalid from (
    select section_key from qw_mock_selection group by section_key having count(*) <> 25
  ) invalid_sections;
  if v_invalid <> 0 or (select count(distinct section_key) from qw_mock_selection) <> 4 then raise exception 'mock_selection_section_count_invalid' using errcode = '22023'; end if;
  select count(*) into v_invalid from (
    select displayed_correct_option from qw_mock_selection
    group by displayed_correct_option having count(*) not between 20 and 30
  ) invalid_answers;
  if v_invalid <> 0 or (select count(distinct displayed_correct_option) from qw_mock_selection) <> 4 then
    raise exception 'mock_selection_answer_position_balance_invalid' using errcode = '22023';
  end if;

  select count(*) into v_invalid
  from qw_mock_selection s
  left join public.question_mock_facets f
    on f.question_id = s.question_id and f.exam_profile_id = v_blueprint.exam_profile_id
   and f.blueprint_code = v_blueprint.code and f.section_key = s.section_key and f.bucket_key = s.bucket_key
   and f.is_active is true and (f.reviewer_status = 'verified' or (p_allow_limited and f.reviewer_status = 'provisional'))
  left join public.questions q on q.id = s.question_id and q.is_active is true and q.is_verified is true
  left join public.question_exam_profile_mappings qm
    on qm.question_id = q.id and qm.exam_profile_id = v_blueprint.exam_profile_id and qm.is_active is true
   and qm.stage_codes @> array['TIER_I']::text[]
  left join public.mock_test_blueprint_cells c on c.blueprint_id = v_blueprint.id and c.section_key = s.section_key and c.bucket_key = s.bucket_key
  left join public.subjects subj on subj.id = q.subject_id and subj.is_active is true
  left join public.topics topic on topic.id = q.topic_id and topic.is_active is true
  left join public.subtopics subtopic on subtopic.id = q.subtopic_id and subtopic.is_active is true
  left join public.question_mock_groups g on g.id = f.group_id and g.exam_profile_id = v_blueprint.exam_profile_id
    and g.is_active is true and (g.reviewer_status = 'verified' or (p_allow_limited and g.reviewer_status = 'provisional'))
  where f.id is null or q.id is null or qm.question_id is null or c.id is null
     or subj.id is null or topic.id is null or subtopic.id is null
     or q.correct_option not in ('A','B','C','D') or not public.mock_question_has_required_options(q.options, s.section_key <> 'english')
     or coalesce(length(trim(q.question_text ->> 'en')), 0) = 0
     or (s.section_key <> 'english' and coalesce(length(trim(q.question_text ->> 'hi')), 0) = 0)
     or coalesce(length(trim(coalesce(q.explanation ->> 'en', q.explanation ->> 'hi'))), 0) = 0
     or not (
       coalesce(length(trim(q.source)), 0) > 0
       or (jsonb_typeof(q.source_metadata) = 'object' and q.source_metadata <> '{}'::jsonb)
     )
     or (
       coalesce(q.source_metadata, '{}'::jsonb) ? 'media'
       and coalesce(f.metadata ->> 'media_verified', 'false') <> 'true'
     )
     or coalesce(q.report_count, 0) <> 0
     or array_position(s.option_order, q.correct_option) <> array_position(array['A','B','C','D']::text[], s.displayed_correct_option)
     or (c.group_size is not null and (f.group_id is null or g.id is null or g.expected_item_count <> c.group_size))
     or (c.group_size is null and f.group_id is not null)
     or (c.bucket_key = 'current_events' and (
       f.event_date is null
       or f.event_date < (c.freshness_rules ->> 'earliest')::date
       or f.event_date > (c.freshness_rules ->> 'latest')::date
     ));
  if v_invalid <> 0 then raise exception 'mock_selection_contains_ineligible_items' using errcode = '22023'; end if;

  select count(*) into v_invalid from (
    select c.bucket_key, count(s.question_id) as item_count, c.min_count, c.max_count
    from public.mock_test_blueprint_cells c
    left join qw_mock_selection s on s.section_key = c.section_key and s.bucket_key = c.bucket_key
    where c.blueprint_id = v_blueprint.id
    group by c.bucket_key, c.min_count, c.max_count
    having count(s.question_id) not between c.min_count and c.max_count
  ) invalid_buckets;
  if v_invalid <> 0 then raise exception 'mock_selection_bucket_count_invalid' using errcode = '22023'; end if;

  select count(*) into v_invalid from (
    select s.section_key,
      min((c.difficulty_rules -> 'basic' ->> 'min')::integer) as basic_min,
      min((c.difficulty_rules -> 'basic' ->> 'max')::integer) as basic_max,
      min((c.difficulty_rules -> 'intermediate' ->> 'min')::integer) as intermediate_min,
      min((c.difficulty_rules -> 'intermediate' ->> 'max')::integer) as intermediate_max,
      min((c.difficulty_rules -> 'advanced' ->> 'min')::integer) as advanced_min,
      min((c.difficulty_rules -> 'advanced' ->> 'max')::integer) as advanced_max
    from qw_mock_selection s
    join public.question_mock_facets f
      on f.question_id = s.question_id and f.exam_profile_id = v_blueprint.exam_profile_id
     and f.blueprint_code = v_blueprint.code
    join public.mock_test_blueprint_cells c
      on c.blueprint_id = v_blueprint.id and c.section_key = s.section_key and c.bucket_key = s.bucket_key
    group by s.section_key
    having count(*) filter (where f.difficulty_band = 'basic') not between
             min((c.difficulty_rules -> 'basic' ->> 'min')::integer) and min((c.difficulty_rules -> 'basic' ->> 'max')::integer)
       or count(*) filter (where f.difficulty_band = 'intermediate') not between
             min((c.difficulty_rules -> 'intermediate' ->> 'min')::integer) and min((c.difficulty_rules -> 'intermediate' ->> 'max')::integer)
       or count(*) filter (where f.difficulty_band = 'advanced') not between
             min((c.difficulty_rules -> 'advanced' ->> 'min')::integer) and min((c.difficulty_rules -> 'advanced' ->> 'max')::integer)
  ) invalid_difficulty;
  if v_invalid <> 0 then raise exception 'mock_selection_difficulty_count_invalid' using errcode = '22023'; end if;

  select count(*) into v_invalid from (
    select f.group_id, g.expected_item_count, count(*) as selected_count
    from qw_mock_selection s
    join public.question_mock_facets f on f.question_id = s.question_id and f.exam_profile_id = v_blueprint.exam_profile_id and f.blueprint_code = v_blueprint.code
    join public.question_mock_groups g on g.id = f.group_id and g.is_active is true
    where f.group_id is not null
    group by f.group_id, g.expected_item_count
    having count(*) <> g.expected_item_count
       or min(f.group_order) <> 1
       or max(f.group_order) <> g.expected_item_count
       or count(distinct f.group_order) <> g.expected_item_count
  ) split_groups;
  if v_invalid <> 0 then raise exception 'mock_selection_split_group' using errcode = '22023'; end if;

  v_relaxation_count := jsonb_array_length(p_relaxations);
  insert into public.mock_tests (
    user_id, exam_profile_id, blueprint_id, blueprint_code, title, rules_snapshot, blueprint_snapshot,
    relaxation_count, generation_metadata, private_seed_hash
  ) values (
    p_user_id, v_blueprint.exam_profile_id, v_blueprint.id, v_blueprint.code,
    coalesce(nullif(v_blueprint.title ->> 'en', ''), v_blueprint.code), v_blueprint.rules,
    (select jsonb_agg(to_jsonb(c) - 'id' - 'blueprint_id' - 'created_at' order by c.section_sort_order, c.sort_order)
     from public.mock_test_blueprint_cells c where c.blueprint_id = v_blueprint.id),
    v_relaxation_count,
    coalesce(p_generation_metadata, '{}'::jsonb) || jsonb_build_object('limited_mode', p_allow_limited),
    p_private_seed_hash
  ) returning id into v_test_id;

  insert into public.mock_test_group_snapshots (
    test_id, original_group_id, group_type, passage_snapshot, media_snapshot,
    expected_item_count, source_snapshot
  )
  select distinct
    v_test_id, g.id, g.group_type, g.passage, g.media,
    g.expected_item_count, g.source_metadata
  from qw_mock_selection s
  join public.question_mock_facets f
    on f.question_id = s.question_id and f.exam_profile_id = v_blueprint.exam_profile_id
   and f.blueprint_code = v_blueprint.code
  join public.question_mock_groups g on g.id = f.group_id;

  insert into public.mock_test_items (
    test_id, original_question_id, section_key, bucket_key, section_order, overall_order,
    group_snapshot_id, group_order, question_snapshot, options_snapshot,
    option_order, taxonomy_snapshot, media_snapshot, marks_correct, marks_wrong
  )
  select
    v_test_id, q.id, s.section_key, s.bucket_key, s.section_order, s.overall_order,
    gs.id, f.group_order,
    q.question_text, q.options, s.option_order,
    jsonb_build_object(
      'subject_id', q.subject_id, 'subject', subj.title,
      'topic_id', q.topic_id, 'topic', t.title,
      'subtopic_id', q.subtopic_id, 'subtopic', st.title,
      'difficulty', q.difficulty, 'question_type', f.question_type
    ),
    coalesce(q.source_metadata -> 'media', '[]'::jsonb),
    (v_blueprint.rules ->> 'marks_correct')::numeric,
    (v_blueprint.rules ->> 'marks_wrong')::numeric
  from qw_mock_selection s
  join public.questions q on q.id = s.question_id
  join public.question_mock_facets f on f.question_id = q.id and f.exam_profile_id = v_blueprint.exam_profile_id and f.blueprint_code = v_blueprint.code
  join public.subjects subj on subj.id = q.subject_id
  join public.topics t on t.id = q.topic_id
  join public.subtopics st on st.id = q.subtopic_id
  left join public.mock_test_group_snapshots gs
    on gs.test_id = v_test_id and gs.original_group_id = f.group_id
  order by s.overall_order;

  insert into public.mock_test_item_answers (item_id, correct_option, explanation_snapshot, source_snapshot)
  select i.id, s.displayed_correct_option, q.explanation,
    jsonb_build_object('source', q.source, 'source_metadata', q.source_metadata, 'year', q.year, 'pyq_exam_name', q.pyq_exam_name)
  from public.mock_test_items i
  join qw_mock_selection s on s.question_id = i.original_question_id
  join public.questions q on q.id = i.original_question_id
  where i.test_id = v_test_id;

  insert into public.mock_test_generation_audit (test_id, section_key, bucket_key, relaxation_code, details)
  select v_test_id, value ->> 'sectionKey', value ->> 'bucketKey', coalesce(value ->> 'code', 'unspecified'), value
  from jsonb_array_elements(p_relaxations) relaxation(value);

  update public.mock_test_generation_requests
  set status = 'succeeded', resulting_test_id = v_test_id, completed_at = clock_timestamp()
  where id = v_request.id;
  return jsonb_build_object('test_id', v_test_id, 'reused', false);
exception when others then
  -- The test/items/request insert roll back together. A separate server call may
  -- persist a safe failure code without leaving a partial test.
  raise;
end
$function$;
revoke all on function public.create_mock_test_from_selection(uuid, text, text, text, jsonb, jsonb, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.create_mock_test_from_selection(uuid, text, text, text, jsonb, jsonb, jsonb, boolean) to service_role;

create or replace function public.record_mock_generation_failure(
  p_user_id uuid,
  p_idempotency_key text,
  p_safe_failure_code text,
  p_failure_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  if length(p_idempotency_key) not between 16 and 128 then return; end if;
  insert into public.mock_test_generation_requests (user_id, idempotency_key, status, safe_failure_code, failure_metadata, completed_at)
  values (p_user_id, p_idempotency_key, 'failed', left(p_safe_failure_code, 80), coalesce(p_failure_metadata, '{}'::jsonb), clock_timestamp())
  on conflict (user_id, idempotency_key) do update
  set status = case when public.mock_test_generation_requests.status = 'succeeded' then 'succeeded' else 'failed' end,
      safe_failure_code = case when public.mock_test_generation_requests.status = 'succeeded' then public.mock_test_generation_requests.safe_failure_code else excluded.safe_failure_code end,
      failure_metadata = case when public.mock_test_generation_requests.status = 'succeeded' then public.mock_test_generation_requests.failure_metadata else excluded.failure_metadata end,
      completed_at = case when public.mock_test_generation_requests.status = 'succeeded' then public.mock_test_generation_requests.completed_at else excluded.completed_at end;
end
$function$;
revoke all on function public.record_mock_generation_failure(uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.record_mock_generation_failure(uuid, text, text, jsonb) to service_role;

create or replace function public.auto_finalize_expired_mock_tests(p_limit integer default 100)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_row record;
  v_count integer := 0;
begin
  for v_row in
    select id, user_id from public.mock_tests
    where status = 'in_progress' and deadline_at <= clock_timestamp()
    order by deadline_at, id
    for update skip locked
    limit least(greatest(p_limit, 1), 500)
  loop
    perform public.finalize_mock_test(v_row.user_id, v_row.id, false);
    v_count := v_count + 1;
  end loop;
  return v_count;
end
$function$;
revoke all on function public.auto_finalize_expired_mock_tests(integer) from public, anon, authenticated;
grant execute on function public.auto_finalize_expired_mock_tests(integer) to service_role;

-- Seed the inactive/provisional blueprint through stable exam identity.
insert into public.mock_test_blueprints (
  exam_profile_id, code, tier_code, pattern_year, version, title, description, rules,
  research_version, research_confidence, is_provisional, is_active, is_production_ready
)
select
  ep.id,
  'ssc-cgl-tier1-2026-v1', 'TIER_I', 2026, 1,
  '{"en":"SSC CGL Tier 1 Full Mock","hi":"SSC CGL टियर 1 पूर्ण मॉक"}'::jsonb,
  '{"en":"SSC-style practice simulation; not affiliated with SSC."}'::jsonb,
  '{"questions":100,"max_marks":200,"marks_correct":2.0,"marks_wrong":-0.5,"marks_unanswered":0,"timing_strategy":"sectional","section_order":["reasoning","general_awareness","quantitative_aptitude","english"],"section_questions":25,"standard_section_seconds":900,"scribe_section_seconds":1200,"standard_total_seconds":3600,"scribe_total_seconds":4800,"english_only_section":"english","provisional_research":true}'::jsonb,
  'ssc-cgl-tier1-corpus-2026-09-01-v1', 'very_low', true, true, false
from public.exam_profiles ep
where ep.code = 'SSC_CGL' and ep.slug = 'ssc-combined-graduate-level-examination' and ep.is_active is true
on conflict (code) do update
set exam_profile_id = excluded.exam_profile_id,
    rules = excluded.rules,
    research_version = excluded.research_version,
    research_confidence = excluded.research_confidence,
    is_provisional = true,
    is_active = true,
    is_production_ready = false,
    updated_at = now();

with blueprint as (select id from public.mock_test_blueprints where code = 'ssc-cgl-tier1-2026-v1'),
cells(section_key, section_order, bucket_key, label, target_count, min_count, max_count, minimum_inventory, group_size, minimum_groups, sort_order) as (values
  ('reasoning',1,'analogy','Analogy (semantic/number/figural)',2,1,3,20,null::integer,null::integer,1),
  ('reasoning',1,'classification','Classification / odd one out',1,1,2,20,null,null,2),
  ('reasoning',1,'series','Number / alphabet / figural series',3,2,4,24,null,null,3),
  ('reasoning',1,'coding_operations','Coding-decoding / symbolic operations',3,2,4,24,null,null,4),
  ('reasoning',1,'relations_direction_ranking','Blood relation / direction / ranking',3,2,4,24,null,null,5),
  ('reasoning',1,'logic_inference','Syllogism / Venn / inference / statement logic',3,2,4,24,null,null,6),
  ('reasoning',1,'missing_matrix_arithmetic','Missing number / matrix / arithmetic reasoning',3,2,4,24,null,null,7),
  ('reasoning',1,'non_verbal','Mirror / fold / cut / embedded / completion',5,4,6,40,null,null,8),
  ('reasoning',1,'dice_cube_spatial','Dice / cube / spatial orientation',2,1,3,20,null,null,9),
  ('general_awareness',2,'current_events','Current events',4,2,5,32,null,null,1),
  ('general_awareness',2,'history','History',3,2,4,24,null,null,2),
  ('general_awareness',2,'culture','Culture',2,1,3,20,null,null,3),
  ('general_awareness',2,'geography','Geography',2,1,3,20,null,null,4),
  ('general_awareness',2,'polity','Indian polity / general policy',3,2,4,24,null,null,5),
  ('general_awareness',2,'economy','Economy',2,1,3,20,null,null,6),
  ('general_awareness',2,'biology','Biology / everyday science',3,2,4,24,null,null,7),
  ('general_awareness',2,'physics','Physics',2,1,3,20,null,null,8),
  ('general_awareness',2,'chemistry','Chemistry',2,1,3,20,null,null,9),
  ('general_awareness',2,'environment_research_static','Environment / research / static miscellaneous',2,1,3,20,null,null,10),
  ('quantitative_aptitude',3,'number_system_simplification','Number system / simplification',2,1,3,20,null,null,1),
  ('quantitative_aptitude',3,'percentage_ratio_average','Percentage / ratio / average',3,2,4,24,null,null,2),
  ('quantitative_aptitude',3,'commercial_math','Profit-loss / discount / SI-CI',3,2,4,24,null,null,3),
  ('quantitative_aptitude',3,'time_work_pipes','Time-work / pipes',2,1,3,20,null,null,4),
  ('quantitative_aptitude',3,'speed_distance','Time-speed-distance / trains / boats',2,1,3,20,null,null,5),
  ('quantitative_aptitude',3,'mixture_partnership','Mixture / alligation / partnership',1,0,2,20,null,null,6),
  ('quantitative_aptitude',3,'algebra','Algebra',2,1,3,20,null,null,7),
  ('quantitative_aptitude',3,'geometry','Geometry',3,2,4,24,null,null,8),
  ('quantitative_aptitude',3,'mensuration','Mensuration',2,2,4,20,null,null,9),
  ('quantitative_aptitude',3,'trigonometry','Trigonometry / heights and distances',3,1,4,24,null,null,10),
  ('quantitative_aptitude',3,'data_interpretation','Data interpretation / tables / graphs / statistics',2,2,4,20,null,null,11),
  ('english',4,'error_improvement','Error spotting / sentence improvement',4,3,5,32,null,null,1),
  ('english',4,'fill_completion','Fill in the blanks / sentence completion',2,1,3,20,null,null,2),
  ('english',4,'synonyms_antonyms','Synonyms / antonyms / homonyms',3,2,4,24,null,null,3),
  ('english',4,'idioms','Idioms and phrases',2,1,2,20,null,null,4),
  ('english',4,'one_word','One-word substitution',2,1,2,20,null,null,5),
  ('english',4,'spelling','Spelling / mis-spelt words',2,1,3,20,null,null,6),
  ('english',4,'voice_narration','Active-passive / direct-indirect',3,2,4,24,null,null,7),
  ('english',4,'para_jumble','Para jumble / shuffling',2,1,3,20,null,null,8),
  ('english',4,'atomic_comprehension','One atomic cloze or comprehension group',5,5,5,40,5,8,9)
)
insert into public.mock_test_blueprint_cells (
  blueprint_id, section_key, section_sort_order, bucket_key, label, target_count,
  min_count, max_count, minimum_inventory, group_size, minimum_complete_groups,
  difficulty_rules, freshness_rules, fallback_policy, sort_order
)
select b.id, c.section_key, c.section_order, c.bucket_key, c.label, c.target_count,
  c.min_count, c.max_count, c.minimum_inventory, c.group_size, c.minimum_groups,
  '{"basic":{"min":6,"max":9},"intermediate":{"min":11,"max":14},"advanced":{"min":4,"max":6}}'::jsonb,
  case when c.bucket_key = 'current_events' then '{"event_date_required":true,"earliest":"2025-01-01","latest":"2026-07-31"}'::jsonb else '{}'::jsonb end,
  '{"order":["relax_difficulty","same_bucket_related_subtopic"],"never_cross_subject":true}'::jsonb,
  c.sort_order
from blueprint b cross join cells c
on conflict (blueprint_id, bucket_key) do update
set label = excluded.label, target_count = excluded.target_count, min_count = excluded.min_count,
    max_count = excluded.max_count, minimum_inventory = excluded.minimum_inventory,
    group_size = excluded.group_size, minimum_complete_groups = excluded.minimum_complete_groups,
    difficulty_rules = excluded.difficulty_rules, freshness_rules = excluded.freshness_rules,
    fallback_policy = excluded.fallback_policy, sort_order = excluded.sort_order;

-- Taxonomy-only bootstrap classifier. These rows remain provisional until a
-- human content review verifies question type, event date, and group semantics.
-- The production readiness RPC deliberately counts only reviewer_status=verified.
with profile as (
  select id from public.exam_profiles
  where code = 'SSC_CGL' and slug = 'ssc-combined-graduate-level-examination' and is_active is true
), paths as (
  select p.*, st.metadata
  from public.ssc_cgl_tier_taxonomy_paths_v2 p
  join public.exam_syllabus_nodes st on st.id = p.subtopic_id and st.is_active is true
  where p.stage_code = 'TIER_I' and p.navigation_visible is true
), classified as (
  select distinct
    q.id as question_id,
    pr.id as exam_profile_id,
    case
      when p.subject_code = 'SUBJ_REASONING' then 'reasoning'
      when p.subject_code = 'SUBJ_GENERAL_AWARENESS' then 'general_awareness'
      when p.subject_code = 'SUBJ_MATHEMATICS' then 'quantitative_aptitude'
      when p.subject_code = 'SUBJ_ENGLISH' then 'english'
    end as section_key,
    case
      when p.topic_code = 'REA_ANALOGIES' then 'analogy'
      when p.topic_code = 'REA_CLASSIFICATION' then 'classification'
      when p.topic_code = 'REA_SERIES' then 'series'
      when p.topic_code = 'REA_CODING_OPERATIONS' then 'coding_operations'
      when p.topic_code = 'REA_OBSERVATION_MEMORY_RELATIONSHIPS' then 'relations_direction_ranking'
      when p.topic_code = 'REA_ANALYTICAL_LOGICAL' then 'logic_inference'
      when p.topic_code in ('REA_MATCHING_INDEXING','REA_LANGUAGE_TRENDS_INTELLIGENCE') then 'missing_matrix_arithmetic'
      when p.topic_code = 'REA_SPATIAL_FIGURAL' and p.subtopic_code in ('REA_SPACE_ORIENTATION','REA_SPACE_VISUALIZATION') then 'dice_cube_spatial'
      when p.topic_code = 'REA_SPATIAL_FIGURAL' then 'non_verbal'
      when p.topic_code = 'GA_CURRENT_EVENTS' then 'current_events'
      when p.topic_code = 'GA_HISTORY' then 'history'
      when p.topic_code = 'GA_CULTURE' then 'culture'
      when p.topic_code = 'GA_GEOGRAPHY' then 'geography'
      when p.topic_code = 'GA_GENERAL_POLICY' then 'polity'
      when p.topic_code = 'GA_ECONOMIC_SCENE' then 'economy'
      when p.topic_code = 'GA_EVERYDAY_SCIENTIFIC_AWARENESS' and p.subtopic_code ~ '(CHEMISTRY|MATERIAL)' then 'chemistry'
      when p.topic_code = 'GA_EVERYDAY_SCIENTIFIC_AWARENESS' and p.subtopic_code ~ '(MECHANICS|HEAT|LIGHT|SOUND|ELECTRIC|UNITS)' then 'physics'
      when p.topic_code = 'GA_EVERYDAY_SCIENTIFIC_AWARENESS' then 'biology'
      when p.topic_code in ('GA_ENVIRONMENT_SOCIETY','GA_SCIENTIFIC_RESEARCH') then 'environment_research_static'
      when p.topic_code = 'MATH_NUMBER_SYSTEMS' then 'number_system_simplification'
      when p.topic_code = 'MATH_ARITHMETICAL_OPERATIONS' and p.subtopic_code ~ '(PERCENT|RATIO|AVERAGE)' then 'percentage_ratio_average'
      when p.topic_code = 'MATH_ARITHMETICAL_OPERATIONS' and p.subtopic_code ~ '(PROFIT|LOSS|DISCOUNT|INTEREST)' then 'commercial_math'
      when p.topic_code = 'MATH_ARITHMETICAL_OPERATIONS' and p.subtopic_code ~ '(TIME_WORK|PIPE)' then 'time_work_pipes'
      when p.topic_code = 'MATH_ARITHMETICAL_OPERATIONS' and p.subtopic_code ~ '(TIME_DISTANCE|TRAIN|BOAT)' then 'speed_distance'
      when p.topic_code = 'MATH_ARITHMETICAL_OPERATIONS' and p.subtopic_code ~ '(MIXTURE|ALLIGATION|PARTNERSHIP)' then 'mixture_partnership'
      when p.topic_code = 'MATH_ARITHMETICAL_OPERATIONS' then 'number_system_simplification'
      when p.topic_code = 'MATH_ALGEBRA' then 'algebra'
      when p.topic_code = 'MATH_GEOMETRY' then 'geometry'
      when p.topic_code = 'MATH_MENSURATION' then 'mensuration'
      when p.topic_code = 'MATH_TRIGONOMETRY' then 'trigonometry'
      when p.topic_code = 'MATH_DATA_INTERPRETATION' then 'data_interpretation'
      when p.topic_code = 'ENG_USAGE_ACCURACY' then 'error_improvement'
      when p.topic_code = 'ENG_WRITING_ABILITY' then 'fill_completion'
      when p.topic_code = 'ENG_COMPREHENSION' then 'atomic_comprehension'
    end as bucket_key,
    case
      when lower(coalesce(q.difficulty, '')) in ('easy','basic') then 'basic'
      when lower(coalesce(q.difficulty, '')) in ('hard','advanced') then 'advanced'
      else 'intermediate'
    end as difficulty_band,
    case when (q.source_metadata ->> 'event_date') ~ '^\d{4}-\d{2}-\d{2}$' then (q.source_metadata ->> 'event_date')::date end as event_date,
    p.topic_code,
    p.subtopic_code
  from profile pr
  join public.question_exam_profile_mappings qm on qm.exam_profile_id = pr.id and qm.is_active is true and qm.stage_codes @> array['TIER_I']::text[]
  join public.questions q on q.id = qm.question_id and q.is_active is true and q.is_verified is true
  join paths p on coalesce(nullif(p.metadata ->> 'content_subtopic_id',''), nullif(p.metadata ->> 'catalog_subtopic_id','')) = q.subtopic_id::text
)
insert into public.question_mock_facets (
  question_id, exam_profile_id, blueprint_code, section_key, bucket_key, difficulty_band,
  event_date, classifier_version, evidence_source, reviewer_status, metadata
)
select question_id, exam_profile_id, 'ssc-cgl-tier1-2026-v1', section_key, bucket_key, difficulty_band,
  event_date, 'ssc-cgl-taxonomy-bootstrap-v1', 'current-published-syllabus-node-code', 'provisional',
  jsonb_build_object('topic_code', topic_code, 'subtopic_code', subtopic_code, 'human_review_required', true)
from classified
where section_key is not null and bucket_key is not null
on conflict (question_id, exam_profile_id, blueprint_code) do nothing;

-- Strict bootstrap assertions: a bad config never commits.
do $assertions$
declare
  v_blueprint_id uuid;
  v_count integer;
begin
  select id into strict v_blueprint_id from public.mock_test_blueprints where code = 'ssc-cgl-tier1-2026-v1';
  select count(*) into v_count from public.mock_test_blueprint_cells where blueprint_id = v_blueprint_id;
  if v_count <> 39 then raise exception 'Expected 39 SSC CGL mock blueprint cells; found %', v_count; end if;
  select count(*) into v_count from (
    select section_key, sum(target_count) as total from public.mock_test_blueprint_cells
    where blueprint_id = v_blueprint_id group by section_key having sum(target_count) <> 25
  ) invalid;
  if v_count <> 0 then raise exception 'Every mock section target must total 25'; end if;
  if (select is_production_ready from public.mock_test_blueprints where id = v_blueprint_id) then
    raise exception 'Bootstrap blueprint must remain production-disabled';
  end if;
end
$assertions$;

notify pgrst, 'reload schema';
commit;

-- Rollback notes:
-- 1. Disable safely with: update mock_test_blueprints set is_active=false,
--    is_production_ready=false where code='ssc-cgl-tier1-2026-v1'.
-- 2. Do not drop tables after users have generated tests; frozen snapshots are
--    permanent history. Object removal is allowed only before any mock_tests row
--    exists and must be a separately reviewed migration.
