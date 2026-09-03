-- QuestionWale: add the SSC CHSL Tier 1 2025 blueprint to the generic mock engine.
-- Run only after migrate_ssc_cgl_tier1_mock_tests.sql, which installs the
-- shared tables/RPCs. This migration is append-safe, resolves stable identities,
-- and leaves the provisional blueprint production-disabled.

begin;

do $preflight$
declare
  v_missing text;
  v_profile_count integer;
  v_version_count integer;
begin
  select string_agg(name, ', ' order by name) into v_missing
  from unnest(array[
    'public.mock_test_blueprints',
    'public.mock_test_blueprint_cells',
    'public.question_mock_facets',
    'public.exam_profiles',
    'public.exam_syllabus_versions',
    'public.exam_syllabus_nodes',
    'public.question_exam_profile_mappings',
    'public.questions'
  ]) required(name)
  where to_regclass(required.name) is null;
  if v_missing is not null then raise exception 'SSC CHSL mock prerequisites missing: %', v_missing; end if;

  select count(*) into v_profile_count from public.exam_profiles
  where code = 'SSC_CHSL'
    and slug = 'ssc-combined-higher-secondary-level-examination'
    and is_active is true;
  if v_profile_count <> 1 then raise exception 'Expected one active exact SSC_CHSL profile; found %', v_profile_count; end if;

  select count(*) into v_version_count
  from public.exam_syllabus_versions v
  join public.exam_profiles p on p.id = v.exam_profile_id
  where p.code = 'SSC_CHSL'
    and p.slug = 'ssc-combined-higher-secondary-level-examination'
    and v.version_code = 'SSC_CHSL_2025_OPERATIONAL_V1'
    and v.publication_status = 'published'
    and v.is_current is true;
  if v_version_count <> 1 then raise exception 'Expected one current published SSC_CHSL_2025_OPERATIONAL_V1 syllabus; found %', v_version_count; end if;
end
$preflight$;

insert into public.mock_test_blueprints (
  exam_profile_id, code, tier_code, pattern_year, version, title, description, rules,
  research_version, research_confidence, is_provisional, is_active, is_production_ready
)
select
  ep.id,
  'ssc-chsl-tier1-2025-v1', 'TIER_I', 2025, 1,
  '{"en":"SSC CHSL Tier 1 Full Mock","hi":"SSC CHSL टियर 1 पूर्ण मॉक"}'::jsonb,
  '{"en":"SSC-style practice simulation based on the official 2025 baseline; not affiliated with SSC."}'::jsonb,
  '{"questions":100,"max_marks":200,"marks_correct":2.0,"marks_wrong":-0.5,"marks_unanswered":0,"timing_strategy":"global","section_order":["english","reasoning","quantitative_aptitude","general_awareness"],"section_questions":25,"standard_total_seconds":3600,"scribe_total_seconds":4800,"english_only_section":"english","supported_languages":["en","hi"],"provisional_research":true}'::jsonb,
  'ssc-chsl-tier1-corpus-2026-09-01-v1', 'very_low', true, true, false
from public.exam_profiles ep
where ep.code = 'SSC_CHSL'
  and ep.slug = 'ssc-combined-higher-secondary-level-examination'
  and ep.is_active is true
on conflict (code) do update
set exam_profile_id = excluded.exam_profile_id,
    rules = excluded.rules,
    research_version = excluded.research_version,
    research_confidence = excluded.research_confidence,
    is_provisional = true,
    is_active = true,
    is_production_ready = false,
    updated_at = now();

with blueprint as (
  select id from public.mock_test_blueprints where code = 'ssc-chsl-tier1-2025-v1'
), cells(section_key, section_order, bucket_key, label, target_count, min_count, max_count, minimum_inventory, group_size, minimum_groups, sort_order) as (values
  ('english',1,'error_improvement','Error spotting / sentence improvement',3,2,5,24,null::integer,null::integer,1),
  ('english',1,'fill_completion','Fill in the blanks / sentence completion',2,1,3,20,null,null,2),
  ('english',1,'synonyms_antonyms','Synonyms / antonyms / homonyms',3,2,4,24,null,null,3),
  ('english',1,'idioms','Idioms and phrases',2,1,2,20,null,null,4),
  ('english',1,'one_word','One-word substitution',2,1,2,20,null,null,5),
  ('english',1,'spelling','Spelling / mis-spelt words',2,1,3,20,null,null,6),
  ('english',1,'voice_narration','Active-passive / direct-indirect',2,1,3,20,null,null,7),
  ('english',1,'para_jumble','Para jumble / shuffling',2,1,3,20,null,null,8),
  ('english',1,'atomic_comprehension','One atomic cloze or comprehension group',5,5,5,40,5,8,9),
  ('english',1,'grammar_usage_misc','Grammar / sentence formation / functional usage',2,1,3,20,null,null,10),
  ('reasoning',2,'analogy','Analogy (semantic/number/figural)',2,1,3,20,null,null,1),
  ('reasoning',2,'classification','Classification / odd one out',2,1,3,20,null,null,2),
  ('reasoning',2,'series','Number / alphabet / figural series',3,2,4,24,null,null,3),
  ('reasoning',2,'coding_operations','Coding-decoding / symbolic operations',3,2,4,24,null,null,4),
  ('reasoning',2,'relations_direction_ranking','Blood relation / direction / ranking / dictionary order',4,3,5,32,null,null,5),
  ('reasoning',2,'logic_inference','Syllogism / Venn / inference / statement logic',2,1,3,20,null,null,6),
  ('reasoning',2,'missing_matrix_arithmetic','Missing number / matrix / arithmetic reasoning',3,2,4,24,null,null,7),
  ('reasoning',2,'non_verbal','Mirror / fold / cut / embedded / completion',4,3,5,32,null,null,8),
  ('reasoning',2,'dice_cube_spatial','Dice / cube / spatial orientation',2,1,3,20,null,null,9),
  ('quantitative_aptitude',3,'number_system_simplification','Number system / simplification',3,2,4,24,null,null,1),
  ('quantitative_aptitude',3,'percentage_ratio_average','Percentage / ratio / average',3,2,4,24,null,null,2),
  ('quantitative_aptitude',3,'commercial_math','Profit-loss / discount / SI-CI',3,2,4,24,null,null,3),
  ('quantitative_aptitude',3,'time_work_pipes','Time-work / pipes',2,1,3,20,null,null,4),
  ('quantitative_aptitude',3,'speed_distance','Time-speed-distance / trains / boats',2,1,3,20,null,null,5),
  ('quantitative_aptitude',3,'mixture_partnership','Mixture / alligation / partnership',1,0,2,20,null,null,6),
  ('quantitative_aptitude',3,'algebra','Algebra',2,1,3,20,null,null,7),
  ('quantitative_aptitude',3,'geometry','Geometry',2,1,3,20,null,null,8),
  ('quantitative_aptitude',3,'mensuration','Mensuration',2,2,4,20,null,null,9),
  ('quantitative_aptitude',3,'trigonometry','Trigonometry / heights and distances',2,1,3,20,null,null,10),
  ('quantitative_aptitude',3,'data_interpretation','Data interpretation / tables / graphs / statistics',3,2,5,24,null,null,11),
  ('general_awareness',4,'current_events','Current events',4,2,5,32,null,null,1),
  ('general_awareness',4,'history','History',3,2,4,24,null,null,2),
  ('general_awareness',4,'culture','Culture',2,1,3,20,null,null,3),
  ('general_awareness',4,'geography','Geography',2,1,3,20,null,null,4),
  ('general_awareness',4,'polity','Indian polity / general policy',3,2,4,24,null,null,5),
  ('general_awareness',4,'economy','Economy',2,1,3,20,null,null,6),
  ('general_awareness',4,'biology','Biology / everyday science',2,1,3,20,null,null,7),
  ('general_awareness',4,'physics','Physics',2,1,3,20,null,null,8),
  ('general_awareness',4,'chemistry','Chemistry',2,1,3,20,null,null,9),
  ('general_awareness',4,'environment_research_static','Environment / research / computer / awards / sports',3,2,5,24,null,null,10)
)
insert into public.mock_test_blueprint_cells (
  blueprint_id, section_key, section_sort_order, bucket_key, label, target_count,
  min_count, max_count, minimum_inventory, group_size, minimum_complete_groups,
  difficulty_rules, freshness_rules, fallback_policy, sort_order
)
select b.id, c.section_key, c.section_order, c.bucket_key, c.label, c.target_count,
  c.min_count, c.max_count, c.minimum_inventory, c.group_size, c.minimum_groups,
  '{"basic":{"min":9,"max":12},"intermediate":{"min":9,"max":12},"advanced":{"min":2,"max":5}}'::jsonb,
  case when c.bucket_key = 'current_events'
    then '{"event_date_required":true,"earliest":"2024-01-01","latest":"2025-08-31"}'::jsonb
    else '{}'::jsonb end,
  '{"order":["relax_difficulty","same_bucket_related_subtopic"],"never_cross_subject":true}'::jsonb,
  c.sort_order
from blueprint b cross join cells c
on conflict (blueprint_id, bucket_key) do update
set label = excluded.label, target_count = excluded.target_count, min_count = excluded.min_count,
    max_count = excluded.max_count, minimum_inventory = excluded.minimum_inventory,
    group_size = excluded.group_size, minimum_complete_groups = excluded.minimum_complete_groups,
    difficulty_rules = excluded.difficulty_rules, freshness_rules = excluded.freshness_rules,
    fallback_policy = excluded.fallback_policy, sort_order = excluded.sort_order;

-- Taxonomy bootstrap only. Every inserted facet remains provisional until a
-- reviewer verifies bucket, difficulty, media, provenance, date, and grouping.
with profile as (
  select id from public.exam_profiles
  where code = 'SSC_CHSL' and slug = 'ssc-combined-higher-secondary-level-examination' and is_active is true
), version as (
  select v.id
  from public.exam_syllabus_versions v join profile p on p.id = v.exam_profile_id
  where v.version_code = 'SSC_CHSL_2025_OPERATIONAL_V1'
    and v.publication_status = 'published' and v.is_current is true
), paths as (
  select
    subject.node_code as subject_code,
    topic.node_code as topic_code,
    subtopic.node_code as subtopic_code,
    coalesce(nullif(subtopic.metadata ->> 'content_subtopic_id', ''), nullif(subtopic.metadata ->> 'canonical_subtopic_id', '')) as content_subtopic_id
  from version v
  join public.exam_syllabus_nodes subject on subject.syllabus_version_id = v.id and subject.node_type = 'subject' and subject.is_active is true
  join public.exam_syllabus_nodes topic on topic.parent_node_id = subject.id and topic.node_type = 'topic' and topic.is_active is true
  join public.exam_syllabus_nodes subtopic on subtopic.parent_node_id = topic.id and subtopic.node_type = 'subtopic' and subtopic.is_active is true
  where subject.node_code in ('SUBJ_ENGLISH','SUBJ_REASONING','SUBJ_MATHEMATICS','SUBJ_GENERAL_AWARENESS')
), classified as (
  select distinct
    q.id as question_id,
    pr.id as exam_profile_id,
    case p.subject_code
      when 'SUBJ_ENGLISH' then 'english'
      when 'SUBJ_REASONING' then 'reasoning'
      when 'SUBJ_MATHEMATICS' then 'quantitative_aptitude'
      when 'SUBJ_GENERAL_AWARENESS' then 'general_awareness'
    end as section_key,
    case
      when p.topic_code = 'ENGLISH_ERROR_SENTENCE_IMPROVEMENT' then 'error_improvement'
      when p.topic_code = 'ENGLISH_FILLERS_CLOZE' and p.subtopic_code ~ '(CLOZE|PASSAGE)' then 'atomic_comprehension'
      when p.topic_code = 'ENGLISH_FILLERS_CLOZE' then 'fill_completion'
      when p.topic_code = 'ENGLISH_VOCABULARY_USAGE' and p.subtopic_code ~ '(SYNONYM|ANTONYM|HOMONYM)' then 'synonyms_antonyms'
      when p.topic_code = 'ENGLISH_VOCABULARY_USAGE' and p.subtopic_code ~ 'IDIOM' then 'idioms'
      when p.topic_code = 'ENGLISH_VOCABULARY_USAGE' and p.subtopic_code ~ 'ONE_WORD' then 'one_word'
      when p.topic_code = 'ENGLISH_VOCABULARY_USAGE' and p.subtopic_code ~ 'SPELL' then 'spelling'
      when p.topic_code = 'ENGLISH_VOICE_NARRATION' then 'voice_narration'
      when p.topic_code = 'ENGLISH_REARRANGEMENT' then 'para_jumble'
      when p.topic_code = 'ENGLISH_READING_COMPREHENSION' then 'atomic_comprehension'
      when p.subject_code = 'SUBJ_ENGLISH' then 'grammar_usage_misc'
      when p.topic_code = 'REASONING_ANALOGIES' then 'analogy'
      when p.topic_code = 'REASONING_CLASSIFICATION' then 'classification'
      when p.topic_code = 'REASONING_SERIES_TRENDS' then 'series'
      when p.topic_code = 'REASONING_CODING_OPERATIONS' then 'coding_operations'
      when p.topic_code = 'REASONING_DIRECTION_RELATIONS_ORDER' then 'relations_direction_ranking'
      when p.topic_code = 'REASONING_VENN_INFERENCE' then 'logic_inference'
      when p.topic_code = 'REASONING_NON_VERBAL_SPATIAL' and p.subtopic_code ~ '(DICE|CUBE|ORIENTATION)' then 'dice_cube_spatial'
      when p.topic_code = 'REASONING_NON_VERBAL_SPATIAL' then 'non_verbal'
      when p.subject_code = 'SUBJ_REASONING' then 'missing_matrix_arithmetic'
      when p.topic_code = 'MATH_NUMBER_SYSTEMS' then 'number_system_simplification'
      when p.topic_code = 'MATH_FUNDAMENTAL_ARITHMETICAL_OPERATIONS' and p.subtopic_code ~ '(PERCENT|RATIO|AVERAGE)' then 'percentage_ratio_average'
      when p.topic_code = 'MATH_FUNDAMENTAL_ARITHMETICAL_OPERATIONS' and p.subtopic_code ~ '(PROFIT|LOSS|DISCOUNT|INTEREST)' then 'commercial_math'
      when p.topic_code = 'MATH_FUNDAMENTAL_ARITHMETICAL_OPERATIONS' and p.subtopic_code ~ '(TIME_WORK|PIPE)' then 'time_work_pipes'
      when p.topic_code = 'MATH_FUNDAMENTAL_ARITHMETICAL_OPERATIONS' and p.subtopic_code ~ '(TIME_DISTANCE|TRAIN|BOAT)' then 'speed_distance'
      when p.topic_code = 'MATH_FUNDAMENTAL_ARITHMETICAL_OPERATIONS' and p.subtopic_code ~ '(MIXTURE|ALLIGATION|PARTNERSHIP)' then 'mixture_partnership'
      when p.topic_code = 'MATH_FUNDAMENTAL_ARITHMETICAL_OPERATIONS' then 'number_system_simplification'
      when p.topic_code = 'MATH_ALGEBRA' then 'algebra'
      when p.topic_code = 'MATH_GEOMETRY' then 'geometry'
      when p.topic_code = 'MATH_MENSURATION' then 'mensuration'
      when p.topic_code = 'MATH_TRIGONOMETRY' then 'trigonometry'
      when p.topic_code = 'MATH_STATISTICS_PROBABILITY' then 'data_interpretation'
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
  join public.question_exam_profile_mappings qm
    on qm.exam_profile_id = pr.id and qm.is_active is true and qm.stage_codes @> array['TIER_I']::text[]
  join public.questions q on q.id = qm.question_id and q.is_active is true and q.is_verified is true
  join paths p on p.content_subtopic_id = q.subtopic_id::text
)
insert into public.question_mock_facets (
  question_id, exam_profile_id, blueprint_code, section_key, bucket_key, difficulty_band,
  event_date, classifier_version, evidence_source, reviewer_status, metadata
)
select question_id, exam_profile_id, 'ssc-chsl-tier1-2025-v1', section_key, bucket_key, difficulty_band,
  event_date, 'ssc-chsl-taxonomy-bootstrap-v1', 'current-published-syllabus-node-code', 'provisional',
  jsonb_build_object('topic_code', topic_code, 'subtopic_code', subtopic_code, 'human_review_required', true)
from classified
where section_key is not null and bucket_key is not null
on conflict (question_id, exam_profile_id, blueprint_code) do nothing;

do $assertions$
declare
  v_blueprint_id uuid;
  v_count integer;
begin
  select id into strict v_blueprint_id from public.mock_test_blueprints where code = 'ssc-chsl-tier1-2025-v1';
  select count(*) into v_count from public.mock_test_blueprint_cells where blueprint_id = v_blueprint_id;
  if v_count <> 40 then raise exception 'Expected 40 SSC CHSL blueprint cells; found %', v_count; end if;
  select count(*) into v_count from (
    select section_key from public.mock_test_blueprint_cells where blueprint_id = v_blueprint_id
    group by section_key having sum(target_count) <> 25
  ) invalid;
  if v_count <> 0 then raise exception 'Every SSC CHSL mock section target must total 25'; end if;
  if (select rules ->> 'timing_strategy' from public.mock_test_blueprints where id = v_blueprint_id) <> 'global' then
    raise exception 'SSC CHSL Tier 1 must use global timing';
  end if;
  if (select is_production_ready from public.mock_test_blueprints where id = v_blueprint_id) then
    raise exception 'SSC CHSL bootstrap blueprint must remain production-disabled';
  end if;
end
$assertions$;

notify pgrst, 'reload schema';
commit;

-- Rollback/deactivation: set this blueprint is_active=false and
-- is_production_ready=false. Never delete generated tests or frozen snapshots.
