/**
 * Read-only SSC CGL Tier 1 mock inventory audit.
 *
 * Run with:
 *   node --env-file=.env.local scripts/audit_ssc_cgl_mock_inventory.mjs
 *
 * This script deliberately resolves the exam by stable code/slug and uses the
 * exact profile mapping. It never treats the broad `SSC` exam tag as CGL
 * eligibility and never writes to Supabase.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const blueprintSummary = JSON.parse(readFileSync(
  new URL('../research/ssc-cgl/tier1/blueprint-summary.json', import.meta.url),
  'utf8',
));

const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
  .trim()
  .replace(/\/?rest\/v1\/?$/i, '')
  .replace(/\/$/, '');
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();

if (!url || !key) {
  console.error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exitCode = 1;
} else {
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const fail = (scope, error) => {
    throw new Error(`${scope}: ${error?.code ?? 'database_error'}: ${error?.message ?? error}`);
  };

  async function fetchAll(build, pageSize = 1000) {
    const rows = [];
    for (let from = 0; ; from += pageSize) {
      const result = await build().range(from, from + pageSize - 1);
      if (result.error) fail('fetchAll', result.error);
      rows.push(...(result.data ?? []));
      if ((result.data ?? []).length < pageSize) return rows;
    }
  }

  const profileResult = await supabase
    .from('exam_profiles')
    .select('id, code, slug, is_active')
    .eq('code', 'SSC_CGL')
    .eq('slug', 'ssc-combined-graduate-level-examination')
    .eq('is_active', true);
  if (profileResult.error) fail('exam profile', profileResult.error);
  if (profileResult.data?.length !== 1) {
    throw new Error(`Expected one active SSC_CGL profile; found ${profileResult.data?.length ?? 0}.`);
  }
  const profile = profileResult.data[0];

  const versionResult = await supabase
    .from('exam_syllabus_versions')
    .select('id, version_code, publication_status, is_current')
    .eq('exam_profile_id', profile.id)
    .eq('publication_status', 'published')
    .eq('is_current', true);
  if (versionResult.error) fail('syllabus version', versionResult.error);
  if (versionResult.data?.length !== 1) {
    throw new Error(`Expected one current published SSC CGL syllabus; found ${versionResult.data?.length ?? 0}.`);
  }
  const version = versionResult.data[0];

  const paths = await fetchAll(() => supabase
    .from('ssc_cgl_tier_taxonomy_paths_v2')
    .select('subject_id,topic_id,subtopic_id')
    .eq('stage_code', 'TIER_I')
    .eq('navigation_visible', true));

  const nodeIds = [...new Set(paths.flatMap((row) => [row.subject_id, row.topic_id, row.subtopic_id]).filter(Boolean))];
  const nodes = [];
  for (let index = 0; index < nodeIds.length; index += 200) {
    const result = await supabase
      .from('exam_syllabus_nodes')
      .select('id, parent_node_id, node_code, node_type, title, is_active, metadata')
      .eq('syllabus_version_id', version.id)
      .in('id', nodeIds.slice(index, index + 200));
    if (result.error) fail('syllabus nodes', result.error);
    nodes.push(...(result.data ?? []));
  }
  const nodesById = new Map(nodes.map((row) => [row.id, row]));

  const contentSubtopicIds = [...new Set(nodes
    .filter((row) => row.node_type === 'subtopic' && row.is_active)
    .map((row) => row.metadata?.content_subtopic_id ?? row.metadata?.catalog_subtopic_id)
    .filter((value) => typeof value === 'string'))];

  const contentSubtopics = [];
  for (let index = 0; index < contentSubtopicIds.length; index += 200) {
    const result = await supabase
      .from('subtopics')
      .select('id, topic_id, slug, title, is_active')
      .in('id', contentSubtopicIds.slice(index, index + 200));
    if (result.error) fail('content subtopics', result.error);
    contentSubtopics.push(...(result.data ?? []));
  }

  const contentTopicIds = [...new Set(contentSubtopics.map((row) => row.topic_id).filter(Boolean))];
  const contentTopics = [];
  for (let index = 0; index < contentTopicIds.length; index += 200) {
    const result = await supabase
      .from('topics')
      .select('id, subject_id, slug, title, is_active')
      .in('id', contentTopicIds.slice(index, index + 200));
    if (result.error) fail('content topics', result.error);
    contentTopics.push(...(result.data ?? []));
  }

  const mappings = await fetchAll(() => supabase
    .from('question_exam_profile_mappings')
    .select('question_id, stage_codes, is_active')
    .eq('exam_profile_id', profile.id)
    .eq('is_active', true)
    .contains('stage_codes', ['TIER_I']));
  const mappedQuestionIds = [...new Set(mappings.map((row) => row.question_id))];

  const questions = [];
  for (let index = 0; index < mappedQuestionIds.length; index += 150) {
    const result = await supabase
      .from('questions')
      .select('id, subject_id, topic_id, subtopic_id, question_text, options, correct_option, explanation, difficulty, source, source_metadata, is_active, is_verified, report_count')
      .in('id', mappedQuestionIds.slice(index, index + 150));
    if (result.error) fail('questions', result.error);
    questions.push(...(result.data ?? []));
  }

  const eligibleQuestions = questions.filter((row) => row.is_active && row.is_verified);
  const hasFourOptions = (value) => {
    if (!value || typeof value !== 'object') return false;
    const byLanguage = value.en ?? value.hi;
    if (byLanguage && typeof byLanguage === 'object') {
      return ['A', 'B', 'C', 'D'].every((keyName) => (
        typeof byLanguage[keyName] === 'string' && byLanguage[keyName].trim()
      ));
    }
    return ['A', 'B', 'C', 'D'].every((keyName) => {
      const option = value[keyName];
      if (typeof option === 'string') return Boolean(option.trim());
      return Boolean(option?.en?.trim() || option?.hi?.trim());
    });
  };
  const hasOptionLanguage = (value, language) => {
    if (!value || typeof value !== 'object') return false;
    if (value[language] && typeof value[language] === 'object') {
      return ['A', 'B', 'C', 'D'].every((keyName) => Boolean(value[language][keyName]?.trim?.()));
    }
    return ['A', 'B', 'C', 'D'].every((keyName) => {
      const option = value[keyName];
      return typeof option === 'string'
        ? language === 'en' && Boolean(option.trim())
        : Boolean(option?.[language]?.trim?.());
    });
  };
  const classifyBucket = (topicCode, subtopicCode) => {
    if (topicCode === 'REA_ANALOGIES') return 'analogy';
    if (topicCode === 'REA_CLASSIFICATION') return 'classification';
    if (topicCode === 'REA_SERIES') return 'series';
    if (topicCode === 'REA_CODING_OPERATIONS') return 'coding_operations';
    if (topicCode === 'REA_OBSERVATION_MEMORY_RELATIONSHIPS') return 'relations_direction_ranking';
    if (topicCode === 'REA_ANALYTICAL_LOGICAL') return 'logic_inference';
    if (['REA_MATCHING_INDEXING', 'REA_LANGUAGE_TRENDS_INTELLIGENCE'].includes(topicCode)) return 'missing_matrix_arithmetic';
    if (topicCode === 'REA_SPATIAL_FIGURAL' && ['REA_SPACE_ORIENTATION', 'REA_SPACE_VISUALIZATION'].includes(subtopicCode)) return 'dice_cube_spatial';
    if (topicCode === 'REA_SPATIAL_FIGURAL') return 'non_verbal';
    if (topicCode === 'GA_CURRENT_EVENTS') return 'current_events';
    if (topicCode === 'GA_HISTORY') return 'history';
    if (topicCode === 'GA_CULTURE') return 'culture';
    if (topicCode === 'GA_GEOGRAPHY') return 'geography';
    if (topicCode === 'GA_GENERAL_POLICY') return 'polity';
    if (topicCode === 'GA_ECONOMIC_SCENE') return 'economy';
    if (topicCode === 'GA_EVERYDAY_SCIENTIFIC_AWARENESS' && /(CHEMISTRY|MATERIAL)/.test(subtopicCode)) return 'chemistry';
    if (topicCode === 'GA_EVERYDAY_SCIENTIFIC_AWARENESS' && /(MECHANICS|HEAT|LIGHT|SOUND|ELECTRIC|UNITS)/.test(subtopicCode)) return 'physics';
    if (topicCode === 'GA_EVERYDAY_SCIENTIFIC_AWARENESS') return 'biology';
    if (['GA_ENVIRONMENT_SOCIETY', 'GA_SCIENTIFIC_RESEARCH'].includes(topicCode)) return 'environment_research_static';
    if (topicCode === 'MATH_NUMBER_SYSTEMS') return 'number_system_simplification';
    if (topicCode === 'MATH_ARITHMETICAL_OPERATIONS' && /(PERCENT|RATIO|AVERAGE)/.test(subtopicCode)) return 'percentage_ratio_average';
    if (topicCode === 'MATH_ARITHMETICAL_OPERATIONS' && /(PROFIT|LOSS|DISCOUNT|INTEREST)/.test(subtopicCode)) return 'commercial_math';
    if (topicCode === 'MATH_ARITHMETICAL_OPERATIONS' && /(TIME_WORK|PIPE)/.test(subtopicCode)) return 'time_work_pipes';
    if (topicCode === 'MATH_ARITHMETICAL_OPERATIONS' && /(TIME_DISTANCE|TRAIN|BOAT)/.test(subtopicCode)) return 'speed_distance';
    if (topicCode === 'MATH_ARITHMETICAL_OPERATIONS' && /(MIXTURE|ALLIGATION|PARTNERSHIP)/.test(subtopicCode)) return 'mixture_partnership';
    if (topicCode === 'MATH_ARITHMETICAL_OPERATIONS') return 'number_system_simplification';
    if (topicCode === 'MATH_ALGEBRA') return 'algebra';
    if (topicCode === 'MATH_GEOMETRY') return 'geometry';
    if (topicCode === 'MATH_MENSURATION') return 'mensuration';
    if (topicCode === 'MATH_TRIGONOMETRY') return 'trigonometry';
    if (topicCode === 'MATH_DATA_INTERPRETATION') return 'data_interpretation';
    if (topicCode === 'ENG_USAGE_ACCURACY') return 'error_improvement';
    if (topicCode === 'ENG_WRITING_ABILITY') return 'fill_completion';
    if (topicCode === 'ENG_COMPREHENSION') return 'atomic_comprehension';
    return null;
  };
  const strictEligible = (question, subjectCode, bucketKey) => {
    const requireHindi = subjectCode !== 'SUBJ_ENGLISH';
    const explanation = typeof question.explanation === 'string'
      ? question.explanation.trim()
      : question.explanation?.en?.trim?.() || question.explanation?.hi?.trim?.();
    const source = question.source?.trim?.()
      || question.source_metadata && Object.keys(question.source_metadata).length > 0;
    const eventDate = question.source_metadata?.event_date;
    return hasFourOptions(question.options)
      && hasOptionLanguage(question.options, 'en')
      && (!requireHindi || hasOptionLanguage(question.options, 'hi'))
      && Boolean(question.question_text?.en?.trim?.())
      && (!requireHindi || Boolean(question.question_text?.hi?.trim?.()))
      && ['A', 'B', 'C', 'D'].includes(question.correct_option)
      && Boolean(explanation)
      && Boolean(source)
      && Number(question.report_count ?? 0) === 0
      && (bucketKey !== 'current_events'
        || typeof eventDate === 'string' && eventDate >= '2025-01-01' && eventDate <= '2026-07-31');
  };
  const eligibleBySubtopic = new Map();
  for (const question of eligibleQuestions) {
    const current = eligibleBySubtopic.get(question.subtopic_id) ?? [];
    current.push(question);
    eligibleBySubtopic.set(question.subtopic_id, current);
  }
  const contentById = new Map(contentSubtopics.map((row) => [row.id, row]));
  const contentTopicsById = new Map(contentTopics.map((row) => [row.id, row]));

  const leafRows = paths.map((path) => {
    const subject = nodesById.get(path.subject_id);
    const topic = nodesById.get(path.topic_id);
    const subtopic = nodesById.get(path.subtopic_id);
    const contentId = subtopic?.metadata?.content_subtopic_id ?? subtopic?.metadata?.catalog_subtopic_id ?? null;
    const content = contentById.get(contentId);
    const contentTopic = contentTopicsById.get(content?.topic_id);
    const items = eligibleBySubtopic.get(contentId) ?? [];
    const bucketKey = classifyBucket(topic?.node_code, subtopic?.node_code);
    return {
      subject_code: subject?.node_code ?? null,
      subject_title: subject?.title?.en ?? subject?.title ?? null,
      topic_code: topic?.node_code ?? null,
      topic_title: topic?.title?.en ?? topic?.title ?? null,
      subtopic_code: subtopic?.node_code ?? null,
      subtopic_title: subtopic?.title?.en ?? subtopic?.title ?? null,
      content_topic_slug: contentTopic?.slug ?? null,
      content_subtopic_slug: content?.slug ?? null,
      bucket_key: bucketKey,
      eligible_questions: items.length,
      strict_eligible_questions: content?.is_active && contentTopic?.is_active && subject?.is_active
        ? items.filter((item) => bucketKey && strictEligible(item, subject?.node_code, bucketKey)).length
        : 0,
      valid_options: items.filter((item) => hasFourOptions(item.options)).length,
      has_hindi: items.filter((item) => typeof item.question_text?.hi === 'string' && item.question_text.hi.trim()).length,
      has_english: items.filter((item) => typeof item.question_text?.en === 'string' && item.question_text.en.trim()).length,
      has_explanation: items.filter((item) => {
        if (typeof item.explanation === 'string') return Boolean(item.explanation.trim());
        return Boolean(item.explanation?.en?.trim() || item.explanation?.hi?.trim());
      }).length,
      has_source: items.filter((item) => Boolean(item.source?.trim() || item.source_metadata)).length,
      valid_answer: items.filter((item) => ['A', 'B', 'C', 'D'].includes(item.correct_option)).length,
    };
  });

  const subjectSummary = [...new Set(leafRows.map((row) => row.subject_code))]
    .map((subjectCode) => {
      const rows = leafRows.filter((row) => row.subject_code === subjectCode);
      return {
        subject_code: subjectCode,
        subject_title: rows[0]?.subject_title ?? null,
        topics: new Set(rows.map((row) => row.topic_code)).size,
        subtopics: rows.length,
        eligible_questions: rows.reduce((sum, row) => sum + row.eligible_questions, 0),
      };
    });

  const topicSummary = [...new Set(leafRows.map((row) => `${row.subject_code}:${row.topic_code}`))]
    .map((keyName) => {
      const [subjectCode, topicCode] = keyName.split(':');
      const rows = leafRows.filter((row) => row.subject_code === subjectCode && row.topic_code === topicCode);
      return {
        subject_code: subjectCode,
        topic_code: topicCode,
        topic_title: rows[0]?.topic_title ?? null,
        subtopics: rows.length,
        eligible_questions: rows.reduce((sum, row) => sum + row.eligible_questions, 0),
      };
    })
    .sort((left, right) => `${left.subject_code}:${left.topic_code}`.localeCompare(`${right.subject_code}:${right.topic_code}`));

  const gaps = leafRows
    .filter((row) => row.eligible_questions === 0)
    .sort((left, right) => `${left.subject_code}:${left.topic_code}:${left.subtopic_code}`.localeCompare(`${right.subject_code}:${right.topic_code}:${right.subtopic_code}`));
  const quality = {
    active_verified: eligibleQuestions.length,
    valid_options: eligibleQuestions.filter((row) => hasFourOptions(row.options)).length,
    valid_answer: eligibleQuestions.filter((row) => ['A', 'B', 'C', 'D'].includes(row.correct_option)).length,
    has_english: eligibleQuestions.filter((row) => typeof row.question_text?.en === 'string' && row.question_text.en.trim()).length,
    has_hindi: eligibleQuestions.filter((row) => typeof row.question_text?.hi === 'string' && row.question_text.hi.trim()).length,
    has_explanation: eligibleQuestions.filter((row) => {
      if (typeof row.explanation === 'string') return Boolean(row.explanation.trim());
      return Boolean(row.explanation?.en?.trim() || row.explanation?.hi?.trim());
    }).length,
    has_source: eligibleQuestions.filter((row) => Boolean(row.source?.trim() || row.source_metadata)).length,
    reported: eligibleQuestions.filter((row) => Number(row.report_count ?? 0) > 0).length,
  };
  const blueprintInventory = blueprintSummary.sections.flatMap((section) => section.buckets.map(([bucketKey, target]) => {
    const rawCount = leafRows
      .filter((row) => row.bucket_key === bucketKey)
      .reduce((sum, row) => sum + row.strict_eligible_questions, 0);
    const minimumInventory = bucketKey === 'atomic_comprehension' ? 40 : Math.max(20, target * 8);
    return {
      section_key: section.key,
      bucket_key: bucketKey,
      target_count: target,
      minimum_inventory: minimumInventory,
      raw_taxonomy_quality_eligible: rawCount,
      complete_verified_groups: 0,
      launch_verified_facets: 0,
      raw_deficit: Math.max(0, minimumInventory - rawCount),
      launch_deficit: minimumInventory,
      status: bucketKey === 'atomic_comprehension'
        ? 'blocked_no_verified_atomic_groups'
        : rawCount >= minimumInventory ? 'requires_facet_human_review' : 'blocked_raw_inventory_gap',
    };
  }));

  console.log(JSON.stringify({
    audited_at: new Date().toISOString(),
    exam: { code: profile.code, slug: profile.slug },
    syllabus_version: version.version_code,
    tier: 'TIER_I',
    exact_mapped_questions: mappedQuestionIds.length,
    active_verified_questions: eligibleQuestions.length,
    quality,
    subject_summary: subjectSummary,
    topic_summary: topicSummary,
    blueprint_inventory: blueprintInventory,
    launch_state: 'blocked_migration_and_human_facet_review_required',
    empty_leaf_gaps: gaps,
    ...(process.argv.includes('--verbose') ? { leaf_inventory: leafRows } : {}),
  }, null, 2));
}
