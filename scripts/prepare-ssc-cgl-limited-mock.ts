/**
 * Prepare the honest SSC CGL limited-beta blueprint from the existing active,
 * base-verified corpus. Dry-run by default.
 *
 * Apply only after reviewing the dry-run report:
 *   node --env-file=.env.local --experimental-strip-types scripts/prepare-ssc-cgl-limited-mock.ts --apply --confirm=ssc-cgl-tier1-2026-limited-v1
 *
 * The workflow never marks the exact blueprint production-ready and never
 * promotes ordinary provisional facets to verified. It creates a separate
 * limited blueprint and structurally normalizes the four existing five-item
 * English reading-comprehension families.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { selectMockItems, type SelectionCandidate } from '../lib/mockTests/core.ts';
import {
  SSC_CGL_TIER1_BLUEPRINT_CODE,
  SSC_CGL_TIER1_LIMITED_BLUEPRINT_CODE,
  SSC_CGL_TIER1_LIMITED_SECTIONS,
  SSC_CGL_TIER1_RULES,
} from '../lib/mockTests/sscCglBlueprint.ts';

type Row = Record<string, any>;

const args = new Map(process.argv.slice(2).map((argument) => {
  const [key, ...rest] = argument.split('=');
  return [key, rest.length > 0 ? rest.join('=') : true] as const;
}));
const apply = args.has('--apply');
const confirm = String(args.get('--confirm') ?? '');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputPath = resolve(String(args.get('--output')
  ?? `test-results/mock-tests/ssc-cgl-limited-preparation-${timestamp}.json`));
const endpoint = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
  .trim().replace(/\/?rest\/v1\/?$/i, '').replace(/\/$/, '');
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();

if (!endpoint || !serviceKey) throw new Error('Missing Supabase URL or service-role key.');
if (apply && confirm !== SSC_CGL_TIER1_LIMITED_BLUEPRINT_CODE) {
  throw new Error(`Apply requires --confirm=${SSC_CGL_TIER1_LIMITED_BLUEPRINT_CODE}.`);
}

const db = createClient(endpoint, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const limitedCells = SSC_CGL_TIER1_LIMITED_SECTIONS.flatMap((section) => [...section.cells]);
const allowedCellKeys = new Set(limitedCells.map((cell) => `${cell.sectionKey}:${cell.bucketKey}`));

function fail(scope: string, error: { code?: string; message?: string } | null) {
  throw new Error(`${scope}: ${error?.code ?? 'database_error'}: ${error?.message ?? 'unknown error'}`);
}

async function fetchAll<T extends Row>(build: () => any, pageSize = 1_000): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const result = await build().range(from, from + pageSize - 1);
    if (result.error) fail('paged fetch', result.error);
    const page = (result.data ?? []) as T[];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

async function fetchIn<T extends Row>(table: string, columns: string, ids: string[], batchSize = 150): Promise<T[]> {
  const rows: T[] = [];
  for (let index = 0; index < ids.length; index += batchSize) {
    const result = await db.from(table).select(columns).in('id', ids.slice(index, index + batchSize));
    if (result.error) fail(table, result.error);
    rows.push(...(result.data ?? []) as unknown as T[]);
  }
  return rows;
}

async function getSingle<T extends Row>(scope: string, query: PromiseLike<any>): Promise<T> {
  const result = await query;
  if (result.error) fail(scope, result.error);
  if (!result.data) throw new Error(`${scope}: expected exactly one row.`);
  return result.data as T;
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function localized(value: unknown, language: 'en' | 'hi') {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? text((value as Row)[language])
    : '';
}

function questionSequence(question: Row) {
  const key = text(question.source_metadata?.question_key);
  const match = key.match(/_(\d{3})$/);
  return match ? Number(match[1]) : 0;
}

function passageFromStem(stem: string) {
  const marker = stem.search(/\r?\n\r?\n(?:Question|प्रश्न)\s*:/i);
  return marker > 0 ? stem.slice(0, marker).trim() : '';
}

function groupNumber(sequence: number) {
  return Math.floor((sequence - 1) / 5) + 1;
}

function groupOrder(sequence: number) {
  return ((sequence - 1) % 5) + 1;
}

function normalize(value: string) {
  return value.normalize('NFKC').replace(/\s+/g, ' ').trim();
}

function validBaseQuestion(question: Row) {
  return question.is_active === true
    && question.is_verified === true
    && Number(question.report_count ?? 0) === 0
    && ['A', 'B', 'C', 'D'].includes(String(question.correct_option ?? ''))
    && localized(question.question_text, 'en').length > 0
    && (localized(question.explanation, 'en').length > 0 || localized(question.explanation, 'hi').length > 0)
    && (text(question.source).length > 0 || Object.keys(question.source_metadata ?? {}).length > 0);
}

function candidateFrom(facet: Row, question: Row, group?: { key: string; order: number }): SelectionCandidate {
  const difficulty = String(facet.difficulty_band ?? '').toLowerCase();
  return {
    id: question.id,
    sectionKey: facet.section_key,
    bucketKey: facet.bucket_key,
    difficulty: difficulty === 'basic' || difficulty === 'advanced' ? difficulty : 'intermediate',
    correctOption: question.correct_option,
    groupId: group?.key ?? null,
    groupSize: group ? 5 : null,
    groupOrder: group?.order ?? null,
  };
}

function verifySelections(candidates: SelectionCandidate[], seeds = 250) {
  for (let index = 0; index < seeds; index += 1) {
    const selected = selectMockItems({
      cells: limitedCells,
      candidates,
      seed: `${SSC_CGL_TIER1_LIMITED_BLUEPRINT_CODE}:${index}`,
      difficultyPerSection: SSC_CGL_TIER1_RULES.difficultyPerSection,
    });
    if (selected.length !== 100 || new Set(selected.map((item) => item.id)).size !== 100) {
      throw new Error(`Limited selection verification failed for seed ${index}.`);
    }
  }
}

function countByBucket(candidates: SelectionCandidate[]) {
  const result: Record<string, number> = {};
  for (const candidate of candidates) {
    const key = `${candidate.sectionKey}:${candidate.bucketKey}`;
    result[key] = (result[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left.localeCompare(right)));
}

async function writeReport(report: unknown) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

console.log(`[ssc-cgl-limited] ${apply ? 'apply' : 'dry-run'} preparation`);

const profile = await getSingle<{ id: string }>('SSC CGL profile', db.from('exam_profiles').select('id')
  .eq('code', 'SSC_CGL').eq('slug', 'ssc-combined-graduate-level-examination').eq('is_active', true).single());
const exactBlueprint = await getSingle<Row>('exact CGL blueprint', db.from('mock_test_blueprints')
  .select('id,code,is_active,is_production_ready,exam_profile_id')
  .eq('code', SSC_CGL_TIER1_BLUEPRINT_CODE).eq('exam_profile_id', profile.id).single());
if (exactBlueprint.is_production_ready) throw new Error('Exact CGL blueprint is already production-ready; limited preparation refused.');

const sourceFacets = (await fetchAll<Row>(() => db.from('question_mock_facets')
  .select('id,question_id,section_key,bucket_key,difficulty_band,question_type,event_date,evidence_source,reviewer_status,is_active,metadata')
  .eq('blueprint_code', SSC_CGL_TIER1_BLUEPRINT_CODE).eq('is_active', true)))
  .filter((facet) => allowedCellKeys.has(`${facet.section_key}:${facet.bucket_key}`));
const questionIds = [...new Set(sourceFacets.map((facet) => String(facet.question_id)))];
const questions = await fetchIn<Row>(
  'questions',
  'id,question_text,options,correct_option,explanation,difficulty,source,source_metadata,is_active,is_verified,report_count,updated_at',
  questionIds,
);
const questionById = new Map(questions.map((question) => [String(question.id), question]));
const invalidQuestionIds = questions.filter((question) => !validBaseQuestion(question)).map((question) => String(question.id));
if (invalidQuestionIds.length > 0) throw new Error(`${invalidQuestionIds.length} source questions failed the base quality gate.`);

const atomicFacets = sourceFacets.filter((facet) => facet.bucket_key === 'atomic_comprehension');
const atomicQuestions = atomicFacets.map((facet) => questionById.get(String(facet.question_id)))
  .filter(Boolean) as Row[];
const sequences = atomicQuestions.map(questionSequence).sort((left, right) => left - right);
if (sequences.length !== 20 || sequences.some((sequence, index) => sequence !== index + 1)) {
  throw new Error('Expected the existing comprehension family to contain question sequences 001 through 020.');
}

const groupDrafts = Array.from({ length: 4 }, (_, index) => {
  const number = index + 1;
  const members = atomicQuestions.filter((question) => groupNumber(questionSequence(question)) === number)
    .sort((left, right) => questionSequence(left) - questionSequence(right));
  const englishPassages = [...new Set(members.map((question) => normalize(
    passageFromStem(localized(question.question_text, 'en')),
  )).filter(Boolean))];
  if (members.length !== 5 || englishPassages.length !== 1 || englishPassages[0]!.length < 80) {
    throw new Error(`Comprehension group ${number} is not one complete shared five-question passage.`);
  }
  const hindiPassages = [...new Set(members.map((question) => normalize(
    passageFromStem(localized(question.question_text, 'hi')),
  )).filter(Boolean))];
  return {
    number,
    key: `${SSC_CGL_TIER1_LIMITED_BLUEPRINT_CODE}-reading-${String(number).padStart(2, '0')}`,
    passage: {
      en: englishPassages[0],
      ...(hindiPassages.length === 1 ? { hi: hindiPassages[0] } : {}),
    },
    members,
  };
});

const virtualGroupsByQuestion = new Map(groupDrafts.flatMap((group) => group.members.map((question) => [
  String(question.id),
  { key: group.key, order: groupOrder(questionSequence(question)) },
])));
const candidates = sourceFacets.flatMap((facet) => {
  const question = questionById.get(String(facet.question_id));
  return question ? [candidateFrom(facet, question, virtualGroupsByQuestion.get(String(question.id)))] : [];
});
verifySelections(candidates);

const report: Row = {
  generated_at: new Date().toISOString(),
  mode: apply ? 'apply' : 'dry-run',
  source_blueprint: SSC_CGL_TIER1_BLUEPRINT_CODE,
  limited_blueprint: SSC_CGL_TIER1_LIMITED_BLUEPRINT_CODE,
  safety: {
    exact_blueprint_was_production_ready: exactBlueprint.is_production_ready,
    ordinary_facets_promoted_to_verified: false,
    limited_blueprint_marked_production_ready: false,
    exact_distribution_claimed: false,
  },
  inventory: {
    source_facets: sourceFacets.length,
    source_questions: questions.length,
    candidates_by_bucket: countByBucket(candidates),
    complete_comprehension_groups: groupDrafts.length,
    selection_seeds_verified: 250,
  },
};

if (apply) {
  const existingLimitedResult = await db.from('mock_test_blueprints')
    .select('id,is_active').eq('code', SSC_CGL_TIER1_LIMITED_BLUEPRINT_CODE).maybeSingle();
  if (existingLimitedResult.error) fail('limited blueprint lookup', existingLimitedResult.error);
  const existingLimited = existingLimitedResult.data as Row | null;
  const blueprintPayload = {
    exam_profile_id: profile.id,
    code: SSC_CGL_TIER1_LIMITED_BLUEPRINT_CODE,
    tier_code: 'TIER_I',
    pattern_year: 2026,
    version: 2,
    title: { en: 'SSC CGL Tier 1 Limited Beta Mock', hi: 'SSC CGL टियर 1 सीमित बीटा मॉक' },
    description: {
      en: 'Four-section SSC-style limited beta using the currently available reviewed base corpus; not an exact topic-distribution claim.',
      hi: 'वर्तमान उपलब्ध सत्यापित बेस सामग्री पर आधारित चार-खंड SSC-शैली सीमित बीटा; सटीक विषय-वितरण का दावा नहीं।',
    },
    rules: {
      questions: 100,
      max_marks: 200,
      marks_correct: 2,
      marks_wrong: -0.5,
      marks_unanswered: 0,
      timing_strategy: 'sectional',
      section_order: ['reasoning', 'general_awareness', 'quantitative_aptitude', 'english'],
      section_questions: 25,
      standard_section_seconds: 900,
      scribe_section_seconds: 1200,
      standard_total_seconds: 3600,
      scribe_total_seconds: 4800,
      english_only_section: 'english',
      limited_mode: true,
      exact_topic_distribution: false,
      source_blueprint: SSC_CGL_TIER1_BLUEPRINT_CODE,
    },
    research_version: `${SSC_CGL_TIER1_RULES.researchVersion}-limited-beta-v1`,
    research_confidence: 'very_low',
    is_provisional: true,
    is_active: existingLimited?.is_active === true,
    is_production_ready: false,
  };
  const upsertBlueprint = await db.from('mock_test_blueprints').upsert(blueprintPayload, { onConflict: 'code' }).select('id').single();
  if (upsertBlueprint.error) fail('limited blueprint upsert', upsertBlueprint.error);
  if (!upsertBlueprint.data) throw new Error('Limited blueprint upsert returned no row.');
  const limitedBlueprintId = String(upsertBlueprint.data.id);

  const difficultyRules = SSC_CGL_TIER1_RULES.difficultyPerSection;
  const cellsPayload = SSC_CGL_TIER1_LIMITED_SECTIONS.flatMap((section, sectionIndex) => section.cells.map((cell, cellIndex) => ({
    blueprint_id: limitedBlueprintId,
    section_key: section.key,
    section_sort_order: sectionIndex + 1,
    bucket_key: cell.bucketKey,
    label: cell.label,
    target_count: cell.target,
    min_count: cell.min,
    max_count: cell.max,
    minimum_inventory: cell.groupSize ? 20 : Math.max(10, cell.target * 2),
    group_size: cell.groupSize ?? null,
    minimum_complete_groups: cell.groupSize ? 4 : null,
    difficulty_rules: difficultyRules,
    freshness_rules: {},
    fallback_policy: { limited_beta: true, exact_distribution_claimed: false },
    sort_order: cellIndex + 1,
  })));
  const cellsUpsert = await db.from('mock_test_blueprint_cells')
    .upsert(cellsPayload, { onConflict: 'blueprint_id,bucket_key' });
  if (cellsUpsert.error) fail('limited blueprint cells', cellsUpsert.error);

  const groupsPayload = groupDrafts.map((group) => ({
    exam_profile_id: profile.id,
    group_key: group.key,
    group_type: 'reading_comprehension',
    title: { en: `SSC CGL limited reading passage ${group.number}` },
    passage: group.passage,
    media: [],
    expected_item_count: 5,
    source_metadata: {
      source_blueprint: SSC_CGL_TIER1_BLUEPRINT_CODE,
      limited_blueprint: SSC_CGL_TIER1_LIMITED_BLUEPRINT_CODE,
      structurally_verified: true,
      member_question_keys: group.members.map((question) => question.source_metadata?.question_key),
    },
    reviewer_status: 'provisional',
    is_active: true,
  }));
  const groupsUpsert = await db.from('question_mock_groups')
    .upsert(groupsPayload, { onConflict: 'exam_profile_id,group_key' }).select('id,group_key');
  if (groupsUpsert.error) fail('limited comprehension groups', groupsUpsert.error);
  const groupIdByKey = new Map((groupsUpsert.data ?? []).map((group) => [String(group.group_key), String(group.id)]));

  const facetPayload = sourceFacets.map((facet) => {
    const virtualGroup = virtualGroupsByQuestion.get(String(facet.question_id));
    return {
      question_id: facet.question_id,
      exam_profile_id: profile.id,
      blueprint_code: SSC_CGL_TIER1_LIMITED_BLUEPRINT_CODE,
      section_key: facet.section_key,
      bucket_key: facet.bucket_key,
      difficulty_band: facet.difficulty_band,
      question_type: facet.question_type,
      event_date: null,
      group_id: virtualGroup ? groupIdByKey.get(virtualGroup.key) : null,
      group_order: virtualGroup?.order ?? null,
      classifier_version: 'ssc-cgl-limited-beta-v1',
      evidence_source: facet.evidence_source || 'ssc-cgl-exact-blueprint-facet',
      reviewer_status: 'provisional',
      is_active: true,
      metadata: {
        ...(facet.metadata ?? {}),
        source_facet_id: facet.id,
        limited_beta: true,
        exact_distribution_claimed: false,
        structurally_grouped: Boolean(virtualGroup),
      },
    };
  });
  for (let index = 0; index < facetPayload.length; index += 250) {
    const facetUpsert = await db.from('question_mock_facets').upsert(facetPayload.slice(index, index + 250), {
      onConflict: 'question_id,exam_profile_id,blueprint_code',
    });
    if (facetUpsert.error) fail(`limited facets batch ${index / 250 + 1}`, facetUpsert.error);
  }

  const previousState = {
    exactActive: exactBlueprint.is_active === true,
    limitedActive: existingLimited?.is_active === true,
  };
  try {
    const deactivateExact = await db.from('mock_test_blueprints').update({ is_active: false })
      .eq('id', exactBlueprint.id);
    if (deactivateExact.error) fail('deactivate exact blueprint', deactivateExact.error);
    const activateLimited = await db.from('mock_test_blueprints').update({ is_active: true, is_production_ready: false })
      .eq('id', limitedBlueprintId);
    if (activateLimited.error) fail('activate limited blueprint', activateLimited.error);

    const liveCandidates = await fetchAll<Row>(() => db.rpc('get_mock_test_candidates', {
      p_blueprint_code: SSC_CGL_TIER1_LIMITED_BLUEPRINT_CODE,
      p_allow_provisional: true,
    }));
    const liveSelectionCandidates = liveCandidates.map((candidate): SelectionCandidate => ({
      id: String(candidate.question_id),
      sectionKey: candidate.section_key,
      bucketKey: candidate.bucket_key,
      difficulty: candidate.difficulty_band,
      correctOption: candidate.correct_option,
      groupId: candidate.group_id,
      groupOrder: candidate.group_order,
      groupSize: candidate.group_size,
    }));
    verifySelections(liveSelectionCandidates);
    report.apply_result = {
      limited_blueprint_id: limitedBlueprintId,
      facets_upserted: facetPayload.length,
      comprehension_groups_upserted: groupsPayload.length,
      live_candidates: liveSelectionCandidates.length,
      exact_blueprint_active: false,
      limited_blueprint_active: true,
    };
  } catch (error) {
    await db.from('mock_test_blueprints').update({ is_active: false }).eq('id', limitedBlueprintId);
    if (previousState.exactActive) {
      await db.from('mock_test_blueprints').update({ is_active: true }).eq('id', exactBlueprint.id);
    }
    if (previousState.limitedActive) {
      await db.from('mock_test_blueprints').update({ is_active: true }).eq('id', limitedBlueprintId);
    }
    throw error;
  }
}

await writeReport(report);
console.log(`[ssc-cgl-limited] candidates=${candidates.length} groups=${groupDrafts.length} seeds=250`);
console.log(`[ssc-cgl-limited] report: ${outputPath}`);
