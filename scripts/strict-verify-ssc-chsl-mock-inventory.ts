/**
 * Strict, fail-closed SSC CHSL Tier 1 mock facet verifier.
 *
 * Dry run (default):
 *   node --env-file=.env.local --experimental-strip-types scripts/strict-verify-ssc-chsl-mock-inventory.ts
 *
 * Apply a reviewed deterministic plan (requires the strict-verification SQL migration):
 *   node --env-file=.env.local --experimental-strip-types scripts/strict-verify-ssc-chsl-mock-inventory.ts --apply --confirm=ssc-chsl-tier1-2025-v1
 *
 * Source-grounded questions remain held unless --source-registry points to a
 * registry whose entries have an HTTPS URL, publisher, title and checked date.
 * The script never enables the blueprint or either application feature flag.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  buildStrictPromotionPlan,
  STRICT_CHSL_BLUEPRINT_CODE,
  STRICT_CHSL_VERIFIER_VERSION,
  strictQuestionTextFingerprint,
  verifyStrictChslFacet,
  type StrictFacetRow,
  type StrictGroupRow,
  type StrictQuestionRow,
  type StrictVerificationResult,
} from '../lib/mockTests/strictVerification.ts';

type Row = Record<string, unknown>;
type DuplicateIndexRow = Row & {
  id: string;
  question_text?: unknown;
  options?: unknown;
  question_key?: string | null;
};

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.split('=');
  return [key, rest.length > 0 ? rest.join('=') : true] as const;
}));
const apply = args.has('--apply');
const confirm = String(args.get('--confirm') ?? '');
const registryPath = args.get('--source-registry');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputPath = resolve(String(args.get('--output')
  ?? `test-results/mock-tests/ssc-chsl-strict-verification-${timestamp}.json`));
const endpoint = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
  .trim().replace(/\/?rest\/v1\/?$/i, '').replace(/\/$/, '');
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();

if (!endpoint || !serviceKey) throw new Error('Missing Supabase URL or service-role key.');
if (apply && confirm !== STRICT_CHSL_BLUEPRINT_CODE) {
  throw new Error(`Apply is fail-closed. Pass --confirm=${STRICT_CHSL_BLUEPRINT_CODE} after reviewing the report.`);
}

const db = createClient(endpoint, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

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

async function fetchIn<T extends Row>(
  table: string,
  columns: string,
  column: string,
  values: string[],
  decorate?: (query: any) => any,
  batchSize = 150,
): Promise<T[]> {
  const rows: T[] = [];
  for (let index = 0; index < values.length; index += batchSize) {
    let query = db.from(table).select(columns).in(column, values.slice(index, index + batchSize));
    if (decorate) query = decorate(query);
    const result = await query;
    if (result.error) fail(table, result.error);
    rows.push(...(result.data ?? []) as unknown as T[]);
  }
  return rows;
}

function countBy(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

function sha256(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

const TRUSTED_SOURCE_HOSTS = new Set([
  'gsi.gov.in',
  'indiabudget.gov.in',
  'isro.gov.in',
  'legislative.gov.in',
  'moef.gov.in',
  'ncert.nic.in',
  'pbdindia.gov.in',
  'pib.gov.in',
  'rbi.org.in',
  'sangeetnatak.gov.in',
]);

function trustedSourceUrl(value: unknown) {
  try {
    const url = new URL(String(value ?? ''));
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    return url.protocol === 'https:' && TRUSTED_SOURCE_HOSTS.has(host);
  } catch {
    return false;
  }
}

function validRegistryEntry(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const row = value as Row;
  const checkedOn = String(row.checked_on ?? row.checkedOn ?? '');
  const supportingUrls = Array.isArray(row.supporting_urls) ? row.supporting_urls : [];
  return trustedSourceUrl(row.url)
    && String(row.title ?? '').trim().length >= 4
    && String(row.publisher ?? '').trim().length >= 2
    && String(row.authority ?? '') === 'primary'
    && /^\d{4}-\d{2}-\d{2}$/.test(checkedOn)
    && supportingUrls.every(trustedSourceUrl);
}

async function loadSourceRegistry() {
  if (typeof registryPath !== 'string') return { keys: new Set<string>(), digest: null, invalidEntries: 0 };
  const raw = await readFile(resolve(registryPath), 'utf8');
  const parsed = JSON.parse(raw) as unknown;
  const entries: Array<[string, unknown]> = Array.isArray(parsed)
    ? parsed.map((item) => [String((item as Row)?.key ?? ''), item])
    : Object.entries((parsed as Row)?.sources && typeof (parsed as Row).sources === 'object'
      ? (parsed as Row).sources as Row
      : parsed as Row);
  const valid = entries.filter(([key, value]) => key.trim().length > 0 && validRegistryEntry(value));
  return {
    keys: new Set(valid.map(([key]) => key)),
    digest: sha256(JSON.parse(raw)),
    invalidEntries: entries.length - valid.length,
  };
}

function blockerSummary(results: StrictVerificationResult[]) {
  const counts = new Map<string, number>();
  for (const result of results) for (const blocker of result.blockers) {
    counts.set(blocker, (counts.get(blocker) ?? 0) + 1);
  }
  return Object.fromEntries([...counts].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])));
}

function blockerSamples(results: StrictVerificationResult[]) {
  const samples = new Map<string, Array<{ facet_id: string; question_id: string; bucket_key: string }>>();
  for (const result of results) for (const blocker of result.blockers) {
    const rows = samples.get(blocker) ?? [];
    if (rows.length < 20) rows.push({ facet_id: result.facetId, question_id: result.questionId, bucket_key: result.bucketKey });
    samples.set(blocker, rows);
  }
  return Object.fromEntries([...samples].sort(([left], [right]) => left.localeCompare(right)));
}

function registryRequirements(results: StrictVerificationResult[]) {
  const requirements = new Map<string, number>();
  for (const result of results) {
    if (!result.blockers.includes('PROVENANCE_NOT_RESOLVED')) continue;
    for (const key of result.requiredSourceRegistryKeys) requirements.set(key, (requirements.get(key) ?? 0) + 1);
  }
  return [...requirements].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([key, affectedQuestions]) => ({ key, affected_questions: affectedQuestions }));
}

function reportResult(result: StrictVerificationResult) {
  return {
    facet_id: result.facetId,
    question_id: result.questionId,
    section_key: result.sectionKey,
    bucket_key: result.bucketKey,
    difficulty_band: result.difficultyBand,
    correct_option: result.correctOption,
    content_hash: result.contentHash,
    decision: result.decision,
    blockers: result.blockers,
  };
}

async function writeReport(report: unknown) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

async function getSingle<T extends Row>(scope: string, query: PromiseLike<any>): Promise<T> {
  const result = await query;
  if (result.error) fail(scope, result.error);
  if (!result.data) throw new Error(`${scope}: expected exactly one row.`);
  return result.data as T;
}

async function readReadiness(client: SupabaseClient) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = await client.rpc('get_mock_test_readiness', { p_blueprint_code: STRICT_CHSL_BLUEPRINT_CODE });
    if (!result.error) return (result.data ?? []) as Array<{
      section_key: string;
      bucket_key: string;
      required_count: number;
      verified_eligible_count: number;
      provisional_eligible_count: number;
      complete_group_count: number;
      deficit: number;
      bucket_ready: boolean;
      production_ready: boolean;
    }>;
    if (String(result.error.code) !== '57014' || attempt === 3) fail('readiness RPC', result.error);
    console.log(`[strict-chsl] readiness timed out; retrying (${attempt}/3)...`);
    await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 750));
  }
  throw new Error('readiness RPC did not return a result.');
}

console.log(`[strict-chsl] ${apply ? 'apply' : 'dry-run'} ${STRICT_CHSL_VERIFIER_VERSION}`);
const sourceRegistry = await loadSourceRegistry();
console.log(`[strict-chsl] trusted source registry keys: ${sourceRegistry.keys.size}`);

const readinessBefore = await readReadiness(db);
if (readinessBefore.length !== 40) throw new Error(`Expected 40 readiness buckets; found ${readinessBefore.length}.`);

const inventoryReady = readinessBefore.every((row) => row.bucket_ready && Number(row.deficit) === 0);
if (inventoryReady) {
  const report: Row = {
    generated_at: new Date().toISOString(),
    mode: apply ? 'apply' : 'dry-run',
    blueprint_code: STRICT_CHSL_BLUEPRINT_CODE,
    verifier_version: STRICT_CHSL_VERIFIER_VERSION,
    status: readinessBefore.every((row) => row.production_ready) ? 'production_ready' : 'inventory_ready_not_published',
    egress_optimization: 'ready_inventory_short_circuit',
    source_registry: {
      path: typeof registryPath === 'string' ? resolve(registryPath) : null,
      digest: sourceRegistry.digest,
      trusted_keys: sourceRegistry.keys.size,
      invalid_entries: sourceRegistry.invalidEntries,
    },
    safety: {
      blueprint_was_production_ready: readinessBefore.every((row) => row.production_ready),
      blueprint_or_feature_flags_changed: false,
    },
    summary: {
      readiness_buckets_checked: readinessBefore.length,
      facets_scanned: 0,
      questions_scanned: 0,
      duplicate_index_rows_scanned: 0,
      selected_for_deficits: 0,
      unresolved_deficit_after_plan: 0,
    },
    readiness: readinessBefore,
  };
  await writeReport(report);
  console.log(`[strict-chsl] inventory already ready; skipped full facet/question scan (report: ${outputPath})`);
} else {
const profile = await getSingle<{ id: string }>('SSC CHSL profile', db.from('exam_profiles').select('id')
  .eq('code', 'SSC_CHSL').eq('slug', 'ssc-combined-higher-secondary-level-examination').eq('is_active', true).single());
const blueprint = await getSingle<{ id: string; exam_profile_id: string; is_active: boolean; is_production_ready: boolean }>(
  'SSC CHSL blueprint',
  db.from('mock_test_blueprints').select('id,exam_profile_id,is_active,is_production_ready')
    .eq('code', STRICT_CHSL_BLUEPRINT_CODE).eq('exam_profile_id', profile.id).single(),
);
if (!blueprint.is_active) throw new Error('SSC CHSL blueprint is inactive.');

const deficientBucketKeys = [...new Set(readinessBefore
  .filter((row) => Number(row.deficit) > 0)
  .map((row) => row.bucket_key))];
console.log(`[strict-chsl] loading provisional candidates for ${deficientBucketKeys.length} deficient buckets...`);
const facets = deficientBucketKeys.length > 0
  ? await fetchAll<StrictFacetRow & Row>(() => db.from('question_mock_facets')
    .select('id,question_id,blueprint_code,section_key,bucket_key,difficulty_band,question_type,event_date,group_id,group_order,evidence_source,reviewer_status,is_active,metadata,updated_at')
    .eq('blueprint_code', STRICT_CHSL_BLUEPRINT_CODE)
    .eq('reviewer_status', 'provisional')
    .eq('is_active', true)
    .in('bucket_key', deficientBucketKeys))
  : [];
const questionIds = [...new Set(facets.map((facet) => facet.question_id))];
const questions = await fetchIn<StrictQuestionRow & Row>(
  'questions',
  'id,subject_id,topic_id,subtopic_id,question_text,options,correct_option,explanation,difficulty,source,source_metadata,is_active,is_verified,report_count,updated_at',
  'id',
  questionIds,
);

// Duplicate safety remains global, but this compact index omits explanations and
// the large source_metadata object. Only deficit candidates receive a full read.
const facetQuestionRefs = questionIds.length > 0
  ? await fetchAll<{ question_id: string } & Row>(() => db.from('question_mock_facets')
    .select('question_id')
    .eq('blueprint_code', STRICT_CHSL_BLUEPRINT_CODE))
  : [];
const duplicateQuestionIds = [...new Set(facetQuestionRefs.map((facet) => facet.question_id))];
const duplicateIndex = await fetchIn<DuplicateIndexRow>(
  'questions',
  'id,question_text,options,question_key:source_metadata->>question_key',
  'id',
  duplicateQuestionIds,
);
console.log(`[strict-chsl] loaded ${facets.length} deficit facets, ${questions.length} full questions, and ${duplicateIndex.length} compact duplicate rows`);

const mappings = await fetchIn<{ question_id: string } & Row>(
  'question_exam_profile_mappings', 'question_id', 'question_id', questionIds,
  (query) => query.eq('exam_profile_id', profile.id).eq('is_active', true).contains('stage_codes', ['TIER_I']),
);
const subjectIds = [...new Set(questions.flatMap((row) => row.subject_id ? [row.subject_id] : []))];
const topicIds = [...new Set(questions.flatMap((row) => row.topic_id ? [row.topic_id] : []))];
const subtopicIds = [...new Set(questions.flatMap((row) => row.subtopic_id ? [row.subtopic_id] : []))];
const [subjects, topics, subtopics] = await Promise.all([
  fetchIn<{ id: string } & Row>('subjects', 'id', 'id', subjectIds, (query) => query.eq('is_active', true)),
  fetchIn<{ id: string } & Row>('topics', 'id', 'id', topicIds, (query) => query.eq('is_active', true)),
  fetchIn<{ id: string } & Row>('subtopics', 'id', 'id', subtopicIds, (query) => query.eq('is_active', true)),
]);
const groupIds = [...new Set(facets.flatMap((facet) => facet.group_id ? [facet.group_id] : []))];
const groups = groupIds.length > 0
  ? await fetchIn<StrictGroupRow & Row>('question_mock_groups', 'id,group_type,passage,media,expected_item_count,source_metadata,reviewer_status,is_active', 'id', groupIds)
  : [];

const questionById = new Map(questions.map((question) => [question.id, question]));
const textCounts = countBy(duplicateIndex.map((question) => strictQuestionTextFingerprint(question.question_text, question.options)));
const keyCounts = countBy(duplicateIndex.map((question) => String(question.question_key ?? '').trim()));
const verificationContext = {
  mappedQuestionIds: new Set(mappings.map((row) => row.question_id)),
  activeSubjectIds: new Set(subjects.map((row) => row.id)),
  activeTopicIds: new Set(topics.map((row) => row.id)),
  activeSubtopicIds: new Set(subtopics.map((row) => row.id)),
  questionTextCounts: textCounts,
  questionKeyCounts: keyCounts,
  sourceRegistryKeys: sourceRegistry.keys,
  groupsById: new Map(groups.map((group) => [group.id, group])),
};
const missingQuestions: string[] = [];
const results: StrictVerificationResult[] = [];
for (const facet of facets) {
  const question = questionById.get(facet.question_id);
  if (!question) {
    missingQuestions.push(facet.question_id);
    continue;
  }
  results.push(verifyStrictChslFacet(facet, question, verificationContext));
}

const plan = buildStrictPromotionPlan(results, readinessBefore);
const plannedItems = plan.selected.map((result) => ({
  facet_id: result.facetId,
  question_id: result.questionId,
  content_hash: result.contentHash,
  facet_updated_at: result.facetUpdatedAt,
  question_updated_at: result.questionUpdatedAt,
  question_type: result.questionType,
  event_date: result.derivedEventDate,
}));
const planHash = sha256({
  verifier: STRICT_CHSL_VERIFIER_VERSION,
  blueprint: STRICT_CHSL_BLUEPRINT_CODE,
  source_registry_digest: sourceRegistry.digest,
  items: plannedItems,
});

const report: Row = {
  generated_at: new Date().toISOString(),
  mode: apply ? 'apply' : 'dry-run',
  blueprint_code: STRICT_CHSL_BLUEPRINT_CODE,
  verifier_version: STRICT_CHSL_VERIFIER_VERSION,
  plan_hash: planHash,
  source_registry: {
    path: typeof registryPath === 'string' ? resolve(registryPath) : null,
    digest: sourceRegistry.digest,
    trusted_keys: sourceRegistry.keys.size,
    invalid_entries: sourceRegistry.invalidEntries,
  },
  safety: {
    blueprint_was_production_ready: blueprint.is_production_ready,
    blueprint_or_feature_flags_changed: false,
    current_events_require_resolved_registry_and_date: true,
    atomic_passages_require_preverified_complete_groups: true,
    missing_question_rows: missingQuestions,
  },
  summary: {
    facets_scanned: facets.length,
    questions_scanned: questions.length,
    duplicate_index_rows_scanned: duplicateIndex.length,
    already_verified: results.filter((result) => result.decision === 'already_verified').length,
    promotable: results.filter((result) => result.decision === 'promotable').length,
    held: results.filter((result) => result.decision === 'hold').length,
    selected_for_deficits: plan.selected.length,
    unresolved_deficit_after_plan: plan.unresolved,
  },
  blockers: blockerSummary(results.filter((result) => result.decision === 'hold')),
  blocker_samples: blockerSamples(results.filter((result) => result.decision === 'hold')),
  required_source_registry_keys: registryRequirements(results),
  buckets: plan.buckets.map((bucket) => ({
    section_key: bucket.sectionKey,
    bucket_key: bucket.bucketKey,
    deficit_before: bucket.deficit,
    strict_promotable: bucket.promotable,
    selected: bucket.selected.length,
    unresolved: bucket.unresolved,
  })),
  selected: plan.selected.map(reportResult),
};

await writeReport(report);
console.log(`[strict-chsl] promotable=${(report.summary as Row).promotable} selected=${plan.selected.length} unresolved=${plan.unresolved}`);
console.log(`[strict-chsl] report: ${outputPath}`);

if (apply) {
  if (plannedItems.length === 0) throw new Error('No strict candidates were selected; database was not changed.');
  console.log('[strict-chsl] applying reviewed plan transactionally...');
  const applied = await db.rpc('apply_strict_mock_facet_verification', {
    p_blueprint_code: STRICT_CHSL_BLUEPRINT_CODE,
    p_verifier_version: STRICT_CHSL_VERIFIER_VERSION,
    p_plan_hash: planHash,
    p_verifier_identity: process.env.MOCK_CONTENT_VERIFIER_ID?.trim() || 'strict-cli',
    p_items: plannedItems,
    p_summary: report.summary,
  });
  if (applied.error) {
    (report as Row).apply_error = { code: applied.error.code, message: applied.error.message };
    await writeReport(report);
    if (['42883', 'PGRST202'].includes(String(applied.error.code))) {
      throw new Error('Strict verification migration is not installed. Run scripts/migrate_strict_mock_content_verification.sql first.');
    }
    fail('strict verification apply', applied.error);
  }
  const readinessAfter = await readReadiness(db);
  report.apply_result = applied.data;
  report.readiness_after = readinessAfter;
  await writeReport(report);
  console.log(`[strict-chsl] apply complete; report updated: ${outputPath}`);
}
}
