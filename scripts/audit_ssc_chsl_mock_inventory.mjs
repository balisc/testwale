/**
 * Read-only SSC CHSL Tier 1 inventory audit.
 *
 * Run with:
 *   node --env-file=.env.local scripts/audit_ssc_chsl_mock_inventory.mjs
 *
 * Exact CHSL eligibility comes from the active exam profile, its current
 * published syllabus nodes, and active TIER_I question mappings. The broad
 * `SSC` tag is never used and this script performs no writes.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const blueprint = JSON.parse(readFileSync(
  new URL('../research/ssc-chsl/tier1/blueprint-summary.json', import.meta.url),
  'utf8',
));
const endpoint = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
  .trim().replace(/\/?rest\/v1\/?$/i, '').replace(/\/$/, '');
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
if (!endpoint || !key) throw new Error('Missing Supabase URL or service-role key.');

const db = createClient(endpoint, key, { auth: { persistSession: false, autoRefreshToken: false } });
const fail = (scope, error) => { throw new Error(`${scope}: ${error?.code ?? 'database_error'}: ${error?.message ?? error}`); };
async function fetchAll(build, size = 1000) {
  const rows = [];
  for (let from = 0; ; from += size) {
    const result = await build().range(from, from + size - 1);
    if (result.error) fail('paged fetch', result.error);
    rows.push(...(result.data ?? []));
    if ((result.data ?? []).length < size) return rows;
  }
}
async function fetchIn(table, columns, column, values, size = 150) {
  const rows = [];
  for (let index = 0; index < values.length; index += size) {
    const result = await db.from(table).select(columns).in(column, values.slice(index, index + size));
    if (result.error) fail(table, result.error);
    rows.push(...(result.data ?? []));
  }
  return rows;
}

const profiles = await db.from('exam_profiles').select('id,code,slug,is_active')
  .eq('code', 'SSC_CHSL').eq('slug', 'ssc-combined-higher-secondary-level-examination').eq('is_active', true);
if (profiles.error) fail('profile', profiles.error);
if (profiles.data?.length !== 1) throw new Error(`Expected one exact active SSC_CHSL profile; found ${profiles.data?.length ?? 0}.`);
const profile = profiles.data[0];

const versions = await db.from('exam_syllabus_versions').select('id,version_code,publication_status,is_current')
  .eq('exam_profile_id', profile.id).eq('version_code', 'SSC_CHSL_2025_OPERATIONAL_V1')
  .eq('publication_status', 'published').eq('is_current', true);
if (versions.error) fail('syllabus version', versions.error);
if (versions.data?.length !== 1) throw new Error(`Expected one current published CHSL syllabus; found ${versions.data?.length ?? 0}.`);
const version = versions.data[0];

const nodes = await fetchAll(() => db.from('exam_syllabus_nodes')
  .select('id,parent_node_id,node_code,node_type,title,is_active,metadata')
  .eq('syllabus_version_id', version.id).eq('is_active', true));
const byId = new Map(nodes.map((node) => [node.id, node]));
const allowedSubjects = new Set(['SUBJ_ENGLISH', 'SUBJ_REASONING', 'SUBJ_MATHEMATICS', 'SUBJ_GENERAL_AWARENESS']);
const subjectNodes = nodes.filter((node) => node.node_type === 'subject' && allowedSubjects.has(node.node_code));
const topicNodes = nodes.filter((node) => node.node_type === 'topic' && allowedSubjects.has(byId.get(node.parent_node_id)?.node_code));
const topicIds = new Set(topicNodes.map((node) => node.id));
const leafNodes = nodes.filter((node) => node.node_type === 'subtopic' && topicIds.has(node.parent_node_id));
const contentId = (node) => node?.metadata?.content_subtopic_id ?? node?.metadata?.canonical_subtopic_id
  ?? node?.metadata?.catalog_subtopic_id ?? null;
const contentSubtopicIds = [...new Set(leafNodes.map(contentId).filter((value) => typeof value === 'string'))];
const contentSubtopics = await fetchIn('subtopics', 'id,topic_id,slug,title,is_active', 'id', contentSubtopicIds);
const contentTopics = await fetchIn('topics', 'id,subject_id,slug,title,is_active', 'id', [...new Set(contentSubtopics.map((row) => row.topic_id))]);
const contentSubjects = await fetchIn('subjects', 'id,slug,title,is_active', 'id', [...new Set(contentTopics.map((row) => row.subject_id))]);
const contentSubtopicById = new Map(contentSubtopics.map((row) => [row.id, row]));
const contentTopicById = new Map(contentTopics.map((row) => [row.id, row]));
const contentSubjectById = new Map(contentSubjects.map((row) => [row.id, row]));

const mappings = await fetchAll(() => db.from('question_exam_profile_mappings')
  .select('question_id,stage_codes,is_active').eq('exam_profile_id', profile.id)
  .eq('is_active', true).contains('stage_codes', ['TIER_I']));
const mappedIds = [...new Set(mappings.map((row) => row.question_id))];
const questions = await fetchIn(
  'questions',
  'id,subject_id,topic_id,subtopic_id,question_text,options,correct_option,explanation,difficulty,source,source_metadata,is_active,is_verified,report_count',
  'id',
  mappedIds,
);

function hasText(value) { return typeof value === 'string' && value.trim().length > 0; }
function localizedText(value, language) {
  if (hasText(value)) return language === 'en';
  return hasText(value?.[language]);
}
function hasOptionLanguage(value, language) {
  if (!value || typeof value !== 'object') return false;
  if (value[language] && typeof value[language] === 'object') {
    return ['A', 'B', 'C', 'D'].every((option) => hasText(value[language][option]));
  }
  return ['A', 'B', 'C', 'D'].every((option) => {
    const item = value[option];
    return hasText(item) ? language === 'en' : hasText(item?.[language]);
  });
}
function hasExplanation(value) {
  return hasText(value) || hasText(value?.en) || hasText(value?.hi);
}
function hasSource(row) {
  return hasText(row.source) || Boolean(row.source_metadata && Object.keys(row.source_metadata).length > 0);
}
function classify(topic, subtopic, subject) {
  if (topic === 'ENGLISH_ERROR_SENTENCE_IMPROVEMENT') return 'error_improvement';
  if (topic === 'ENGLISH_FILLERS_CLOZE' && /(CLOZE|PASSAGE)/.test(subtopic)) return 'atomic_comprehension';
  if (topic === 'ENGLISH_FILLERS_CLOZE') return 'fill_completion';
  if (topic === 'ENGLISH_VOCABULARY_USAGE' && /(SYNONYM|ANTONYM|HOMONYM)/.test(subtopic)) return 'synonyms_antonyms';
  if (topic === 'ENGLISH_VOCABULARY_USAGE' && /IDIOM/.test(subtopic)) return 'idioms';
  if (topic === 'ENGLISH_VOCABULARY_USAGE' && /ONE_WORD/.test(subtopic)) return 'one_word';
  if (topic === 'ENGLISH_VOCABULARY_USAGE' && /SPELL/.test(subtopic)) return 'spelling';
  if (topic === 'ENGLISH_VOICE_NARRATION') return 'voice_narration';
  if (topic === 'ENGLISH_REARRANGEMENT') return 'para_jumble';
  if (topic === 'ENGLISH_READING_COMPREHENSION') return 'atomic_comprehension';
  if (subject === 'SUBJ_ENGLISH') return 'grammar_usage_misc';
  if (topic === 'REASONING_ANALOGIES') return 'analogy';
  if (topic === 'REASONING_CLASSIFICATION') return 'classification';
  if (topic === 'REASONING_SERIES_TRENDS') return 'series';
  if (topic === 'REASONING_CODING_OPERATIONS') return 'coding_operations';
  if (topic === 'REASONING_DIRECTION_RELATIONS_ORDER') return 'relations_direction_ranking';
  if (topic === 'REASONING_VENN_INFERENCE') return 'logic_inference';
  if (topic === 'REASONING_NON_VERBAL_SPATIAL' && /(DICE|CUBE|ORIENTATION)/.test(subtopic)) return 'dice_cube_spatial';
  if (topic === 'REASONING_NON_VERBAL_SPATIAL') return 'non_verbal';
  if (subject === 'SUBJ_REASONING') return 'missing_matrix_arithmetic';
  if (topic === 'MATH_NUMBER_SYSTEMS') return 'number_system_simplification';
  if (topic === 'MATH_FUNDAMENTAL_ARITHMETICAL_OPERATIONS' && /(PERCENT|RATIO|AVERAGE)/.test(subtopic)) return 'percentage_ratio_average';
  if (topic === 'MATH_FUNDAMENTAL_ARITHMETICAL_OPERATIONS' && /(PROFIT|LOSS|DISCOUNT|INTEREST)/.test(subtopic)) return 'commercial_math';
  if (topic === 'MATH_FUNDAMENTAL_ARITHMETICAL_OPERATIONS' && /(TIME_WORK|PIPE)/.test(subtopic)) return 'time_work_pipes';
  if (topic === 'MATH_FUNDAMENTAL_ARITHMETICAL_OPERATIONS' && /(TIME_DISTANCE|TRAIN|BOAT)/.test(subtopic)) return 'speed_distance';
  if (topic === 'MATH_FUNDAMENTAL_ARITHMETICAL_OPERATIONS' && /(MIXTURE|ALLIGATION|PARTNERSHIP)/.test(subtopic)) return 'mixture_partnership';
  if (topic === 'MATH_FUNDAMENTAL_ARITHMETICAL_OPERATIONS') return 'number_system_simplification';
  if (topic === 'MATH_ALGEBRA') return 'algebra';
  if (topic === 'MATH_GEOMETRY') return 'geometry';
  if (topic === 'MATH_MENSURATION') return 'mensuration';
  if (topic === 'MATH_TRIGONOMETRY') return 'trigonometry';
  if (topic === 'MATH_STATISTICS_PROBABILITY') return 'data_interpretation';
  if (topic === 'GA_CURRENT_EVENTS') return 'current_events';
  if (topic === 'GA_HISTORY') return 'history';
  if (topic === 'GA_CULTURE') return 'culture';
  if (topic === 'GA_GEOGRAPHY') return 'geography';
  if (topic === 'GA_GENERAL_POLICY') return 'polity';
  if (topic === 'GA_ECONOMIC_SCENE') return 'economy';
  if (topic === 'GA_EVERYDAY_SCIENTIFIC_AWARENESS' && /(CHEMISTRY|MATERIAL)/.test(subtopic)) return 'chemistry';
  if (topic === 'GA_EVERYDAY_SCIENTIFIC_AWARENESS' && /(MECHANICS|HEAT|LIGHT|SOUND|ELECTRIC|UNITS)/.test(subtopic)) return 'physics';
  if (topic === 'GA_EVERYDAY_SCIENTIFIC_AWARENESS') return 'biology';
  if (['GA_ENVIRONMENT_SOCIETY', 'GA_SCIENTIFIC_RESEARCH'].includes(topic)) return 'environment_research_static';
  return null;
}

const questionBySubtopic = new Map();
for (const row of questions.filter((item) => item.is_active && item.is_verified)) {
  const bucket = questionBySubtopic.get(row.subtopic_id) ?? [];
  bucket.push(row);
  questionBySubtopic.set(row.subtopic_id, bucket);
}
function strictEligible(row, subjectCode, bucketKey) {
  const needsHindi = subjectCode !== 'SUBJ_ENGLISH';
  const eventDate = row.source_metadata?.event_date;
  return localizedText(row.question_text, 'en')
    && (!needsHindi || localizedText(row.question_text, 'hi'))
    && hasOptionLanguage(row.options, 'en')
    && (!needsHindi || hasOptionLanguage(row.options, 'hi'))
    && ['A', 'B', 'C', 'D'].includes(row.correct_option)
    && hasExplanation(row.explanation) && hasSource(row)
    && Number(row.report_count ?? 0) === 0
    && (bucketKey !== 'current_events'
      || hasText(eventDate) && eventDate >= '2024-01-01' && eventDate <= '2025-08-31');
}

const leaves = leafNodes.map((leaf) => {
  const topic = byId.get(leaf.parent_node_id);
  const subject = byId.get(topic?.parent_node_id);
  const catalogSubtopic = contentSubtopicById.get(contentId(leaf));
  const catalogTopic = contentTopicById.get(catalogSubtopic?.topic_id);
  const catalogSubject = contentSubjectById.get(catalogTopic?.subject_id);
  const rows = questionBySubtopic.get(catalogSubtopic?.id) ?? [];
  const bucketKey = classify(topic?.node_code, leaf.node_code, subject?.node_code);
  const activePath = Boolean(subject?.is_active && topic?.is_active && leaf.is_active
    && catalogSubject?.is_active && catalogTopic?.is_active && catalogSubtopic?.is_active);
  return {
    subject_code: subject?.node_code, subject_title: subject?.title?.en ?? subject?.title,
    topic_code: topic?.node_code, topic_title: topic?.title?.en ?? topic?.title,
    subtopic_code: leaf.node_code, content_subtopic_slug: catalogSubtopic?.slug ?? null,
    bucket_key: bucketKey, active_verified: rows.length,
    strict_eligible: activePath ? rows.filter((row) => bucketKey && strictEligible(row, subject?.node_code, bucketKey)).length : 0,
  };
});
const activeVerified = questions.filter((row) => row.is_active && row.is_verified);
const sectionBySubject = { SUBJ_ENGLISH: 'english', SUBJ_REASONING: 'reasoning', SUBJ_MATHEMATICS: 'quantitative_aptitude', SUBJ_GENERAL_AWARENESS: 'general_awareness' };
const subjectSummary = subjectNodes.map((subject) => {
  const rows = leaves.filter((row) => row.subject_code === subject.node_code);
  return {
    section_key: sectionBySubject[subject.node_code], subject_code: subject.node_code,
    topics: new Set(rows.map((row) => row.topic_code)).size, subtopics: rows.length,
    active_verified_questions: rows.reduce((sum, row) => sum + row.active_verified, 0),
    strict_quality_eligible: rows.reduce((sum, row) => sum + row.strict_eligible, 0),
  };
});
const topicSummary = topicNodes.map((topic) => {
  const subject = byId.get(topic.parent_node_id);
  const rows = leaves.filter((row) => row.topic_code === topic.node_code && row.subject_code === subject?.node_code);
  return {
    subject_code: subject?.node_code, topic_code: topic.node_code,
    subtopics: rows.length, active_verified_questions: rows.reduce((sum, row) => sum + row.active_verified, 0),
    strict_quality_eligible: rows.reduce((sum, row) => sum + row.strict_eligible, 0),
  };
});
const blueprintInventory = blueprint.sections.flatMap((section) => section.buckets.map(([bucketKey, target]) => {
  const raw = leaves.filter((row) => row.bucket_key === bucketKey).reduce((sum, row) => sum + row.strict_eligible, 0);
  const minimum = bucketKey === 'atomic_comprehension' ? 40 : Math.max(20, target * 8);
  return {
    section_key: section.key, bucket_key: bucketKey, target_count: target, minimum_inventory: minimum,
    raw_taxonomy_quality_eligible: raw, complete_verified_groups: 0, launch_verified_facets: 0,
    raw_deficit: Math.max(0, minimum - raw), launch_deficit: minimum,
    status: bucketKey === 'atomic_comprehension' ? 'blocked_no_verified_atomic_groups'
      : raw >= minimum ? 'requires_facet_human_review' : 'blocked_raw_inventory_gap',
  };
}));
const output = {
  audited_at: new Date().toISOString(), exam: { code: profile.code, slug: profile.slug },
  syllabus_version: version.version_code, tier: 'TIER_I', exact_mapped_questions: mappedIds.length,
  active_verified_questions: activeVerified.length,
  quality: {
    valid_answer: activeVerified.filter((row) => ['A', 'B', 'C', 'D'].includes(row.correct_option)).length,
    english_question: activeVerified.filter((row) => localizedText(row.question_text, 'en')).length,
    hindi_question: activeVerified.filter((row) => localizedText(row.question_text, 'hi')).length,
    english_options: activeVerified.filter((row) => hasOptionLanguage(row.options, 'en')).length,
    hindi_options: activeVerified.filter((row) => hasOptionLanguage(row.options, 'hi')).length,
    explanation: activeVerified.filter((row) => hasExplanation(row.explanation)).length,
    source: activeVerified.filter(hasSource).length,
    reported: activeVerified.filter((row) => Number(row.report_count ?? 0) > 0).length,
  },
  excluded_subject_codes: nodes.filter((node) => node.node_type === 'subject' && !allowedSubjects.has(node.node_code)).map((node) => node.node_code),
  subject_summary: subjectSummary, topic_summary: topicSummary, blueprint_inventory: blueprintInventory,
  launch_state: 'blocked_migration_human_facet_review_and_atomic_group_verification_required',
  ...(process.argv.includes('--verbose') ? { leaf_inventory: leaves } : {}),
};
console.log(JSON.stringify(output, null, 2));
