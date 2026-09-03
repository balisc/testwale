/**
 * Normalizes existing SSC CHSL source evidence and atomic cloze structure.
 *
 * Dry run:
 *   node --env-file=.env.local --experimental-strip-types scripts/prepare-ssc-chsl-strict-inventory.ts
 *
 * Apply:
 *   node --env-file=.env.local --experimental-strip-types scripts/prepare-ssc-chsl-strict-inventory.ts --apply --confirm=ssc-chsl-tier1-2025-v1
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { STRICT_CHSL_BLUEPRINT_CODE } from '../lib/mockTests/strictVerification.ts';

type Row = Record<string, unknown>;

type FacetRow = {
  id: string;
  question_id: string;
  group_id: string | null;
  group_order: number | null;
  reviewer_status: string;
  event_date: string | null;
};

type QuestionRow = {
  id: string;
  question_text: unknown;
  source_metadata: unknown;
  updated_at: string;
};

type EvidenceRule = {
  registryKey: string;
  sourceUrl: string;
  expectedDate: string;
  expectedPool: string;
};

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.split('=');
  return [key, rest.length > 0 ? rest.join('=') : true] as const;
}));
const apply = args.has('--apply');
const confirm = String(args.get('--confirm') ?? '');
const endpoint = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
  .trim().replace(/\/?rest\/v1\/?$/i, '').replace(/\/$/, '');
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputPath = resolve(String(args.get('--output')
  ?? `test-results/mock-tests/ssc-chsl-strict-preparation-${timestamp}.json`));

if (!endpoint || !serviceKey) throw new Error('Missing Supabase URL or service-role key.');
if (apply && confirm !== STRICT_CHSL_BLUEPRINT_CODE) {
  throw new Error(`Apply requires --confirm=${STRICT_CHSL_BLUEPRINT_CODE}.`);
}

const db = createClient(endpoint, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const BUDGET_FACTS = new Set([
  'Centre of Excellence in AI for Education',
  'Nuclear Energy Mission for Viksit Bharat',
  'Revamped PM SVANidhi',
  'BharatTradeNet',
  'Prime Minister Dhan-Dhaanya Krishi Yojana',
  'National Mission on High Yielding Seeds',
  'Mission for Aatmanirbharta in Pulses',
  'Bharatiya Bhasha Pustak Scheme',
  'Urban Challenge Fund',
  'Modified UDAN scheme',
  'National Manufacturing Mission',
  'Gig-worker social-security measure',
  'Makhana Board in Bihar',
  'Maritime Development Fund',
  'Grameen Credit Score',
  'Fifty thousand Atal Tinkering Labs',
  'National Geospatial Mission',
  'Export Promotion Mission',
  'SWAMIH Fund 2',
  'Mission for Cotton Productivity',
]);

const SOURCE_RULES = new Map<string, EvidenceRule>([
  ...[...BUDGET_FACTS].map((fact) => [fact, {
    registryKey: 'BUDGET_2025',
    sourceUrl: 'https://www.indiabudget.gov.in/budget2025-26/doc/Budget_Speech.pdf',
    expectedDate: '2025-02-01',
    expectedPool: 'GA_CURRENT_SCHEMES_POLICY_UPDATES',
  }] as const),
  ['NISAR launch', {
    registryKey: 'ISRO_TIMELINE_2025',
    sourceUrl: 'https://www.isro.gov.in/media_isro/pdf/AnnualReport/Annual_Report_2025_26_Eng_29042026_Rev.pdf',
    expectedDate: '2025-07-30',
    expectedPool: 'GA_CURRENT_NATIONAL_AFFAIRS',
  }],
  ['SpaDeX docking', {
    registryKey: 'ISRO_TIMELINE_2025',
    sourceUrl: 'https://www.isro.gov.in/media_isro/pdf/AnnualReport/Annual_Report_2025_26_Eng_29042026_Rev.pdf',
    expectedDate: '2025-01-16',
    expectedPool: 'GA_CURRENT_NATIONAL_AFFAIRS',
  }],
  ['Thirty-eighth National Games', {
    registryKey: 'NATIONAL_GAMES_2025',
    sourceUrl: 'https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=2103368&lang=1&reg=6',
    expectedDate: '2025-02-14',
    expectedPool: 'GA_CURRENT_NATIONAL_AFFAIRS',
  }],
  ['Eighteenth Pravasi Bharatiya Divas Convention', {
    registryKey: 'PBD_2025',
    sourceUrl: 'https://pbdindia.gov.in/',
    expectedDate: '2025-01-10',
    expectedPool: 'GA_CURRENT_NATIONAL_AFFAIRS',
  }],
  ['GoIStats mobile application', {
    registryKey: 'MOSPI_GOISTATS_2025',
    sourceUrl: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2140618&lang=1&reg=37',
    expectedDate: '2025-06-29',
    expectedPool: 'GA_CURRENT_NATIONAL_AFFAIRS',
  }],
]);

function record(value: unknown): Row {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {};
}

function localized(value: unknown, language: 'en' | 'hi') {
  const candidate = record(value)[language];
  return typeof candidate === 'string' ? candidate.trim() : '';
}

function extractPassage(questionText: unknown) {
  const text = localized(questionText, 'en');
  const match = text.match(/blank\s*\(\d+\)\s*:\s*([\s\S]+)$/i);
  return match?.[1]?.trim() ?? '';
}

function eventDate(facet: FacetRow, metadata: Row) {
  return String(facet.event_date ?? metadata.event_date ?? metadata.reference_date ?? '');
}

function targetName(metadata: Row) {
  const target = String(record(metadata.evidence_locator).target_fact ?? '');
  return target.split(':', 1)[0].trim();
}

function sourceKeys(metadata: Row) {
  return Array.isArray(metadata.source_registry_keys)
    ? metadata.source_registry_keys.map(String).sort()
    : [];
}

function sameStrings(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

async function fetchAll<T>(table: string, columns: string, decorate: (query: any) => any): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1_000) {
    const result = await decorate(db.from(table).select(columns)).range(from, from + 999);
    if (result.error) throw new Error(`${table}: ${result.error.code}: ${result.error.message}`);
    const page = (result.data ?? []) as T[];
    rows.push(...page);
    if (page.length < 1_000) return rows;
  }
}

async function fetchQuestions(ids: string[]): Promise<QuestionRow[]> {
  const rows: QuestionRow[] = [];
  for (let index = 0; index < ids.length; index += 100) {
    const result = await db.from('questions')
      .select('id,question_text,source_metadata,updated_at')
      .in('id', ids.slice(index, index + 100));
    if (result.error) throw new Error(`questions: ${result.error.code}: ${result.error.message}`);
    rows.push(...(result.data ?? []) as QuestionRow[]);
  }
  return rows;
}

const profileResult = await db.from('exam_profiles').select('id')
  .eq('code', 'SSC_CHSL').eq('is_active', true).single();
if (profileResult.error || !profileResult.data) {
  throw new Error(`SSC CHSL profile: ${profileResult.error?.message ?? 'not found'}`);
}
const profileId = String(profileResult.data.id);

const atomicFacets = await fetchAll<FacetRow>(
  'question_mock_facets',
  'id,question_id,group_id,group_order,reviewer_status,event_date',
  (query) => query.eq('blueprint_code', STRICT_CHSL_BLUEPRINT_CODE)
    .eq('bucket_key', 'atomic_comprehension').eq('is_active', true),
);
const atomicQuestions = await fetchQuestions(atomicFacets.map((facet) => facet.question_id));
const atomicQuestionById = new Map(atomicQuestions.map((question) => [question.id, question]));
const clozeFamilies = new Map<string, Array<{
  facet: FacetRow;
  question: QuestionRow;
  order: number;
  passage: string;
}>>();

for (const facet of atomicFacets) {
  const question = atomicQuestionById.get(facet.question_id);
  if (!question) continue;
  const relationFamily = String(record(question.source_metadata).relation_family ?? '');
  const match = relationFamily.match(/^(cloze_\d+)_(\d+)$/);
  if (!match) continue;
  const passage = extractPassage(question.question_text);
  const rows = clozeFamilies.get(match[1]) ?? [];
  rows.push({ facet, question, order: Number(match[2]), passage });
  clozeFamilies.set(match[1], rows);
}

const completeGroups = [...clozeFamilies.entries()]
  .map(([family, items]) => ({ family, items: items.sort((left, right) => left.order - right.order) }))
  .filter(({ items }) => items.length === 5
    && items.every((item, index) => item.order === index)
    && items[0].passage.length >= 40
    && new Set(items.map((item) => item.passage)).size === 1)
  .sort((left, right) => Number(left.family.split('_')[1]) - Number(right.family.split('_')[1]));

if (completeGroups.length < 8) {
  throw new Error(`Expected at least 8 complete cloze families; found ${completeGroups.length}.`);
}
const selectedGroups = completeGroups.slice(0, 8);

const currentFacets = await fetchAll<FacetRow>(
  'question_mock_facets',
  'id,question_id,group_id,group_order,reviewer_status,event_date',
  (query) => query.eq('blueprint_code', STRICT_CHSL_BLUEPRINT_CODE)
    .eq('bucket_key', 'current_events').eq('is_active', true),
);
const currentQuestions = await fetchQuestions(currentFacets.map((facet) => facet.question_id));
const currentFacetByQuestion = new Map(currentFacets.map((facet) => [facet.question_id, facet]));
const evidenceUpdates: Array<{
  id: string;
  updatedAt: string;
  metadata: Row;
  fact: string;
  registryKey: string;
}> = [];
const evidenceCounts = new Map<string, number>();

for (const question of currentQuestions) {
  const facet = currentFacetByQuestion.get(question.id);
  if (!facet) continue;
  const metadata = record(question.source_metadata);
  const fact = targetName(metadata);
  const rule = SOURCE_RULES.get(fact);
  if (!rule) continue;
  const locator = record(metadata.evidence_locator);
  if (eventDate(facet, metadata) !== rule.expectedDate
    || String(locator.source_fact_pool ?? '') !== rule.expectedPool
    || locator.claim_level_support !== true) continue;
  evidenceCounts.set(rule.registryKey, (evidenceCounts.get(rule.registryKey) ?? 0) + 1);
  const normalizedLocator = {
    ...locator,
    source_registry_key: rule.registryKey,
    source_url: rule.sourceUrl,
  };
  const normalizedMetadata: Row = {
    ...metadata,
    source_registry_keys: [rule.registryKey],
    source_checked_on: '2026-09-02',
    evidence_locator: normalizedLocator,
    source_normalization: {
      version: 'ssc-chsl-claim-source-v1',
      normalized_on: '2026-09-02',
      previous_registry_keys: sourceKeys(metadata),
    },
  };
  const alreadyNormalized = sameStrings(sourceKeys(metadata), [rule.registryKey])
    && String(locator.source_url ?? '') === rule.sourceUrl;
  if (!alreadyNormalized) evidenceUpdates.push({
    id: question.id,
    updatedAt: question.updated_at,
    metadata: normalizedMetadata,
    fact,
    registryKey: rule.registryKey,
  });
}

const eligibleEvidenceCount = [...evidenceCounts.values()].reduce((total, count) => total + count, 0);
if (eligibleEvidenceCount < 32) {
  throw new Error(`Expected at least 32 claim-grounded current-event questions; found ${eligibleEvidenceCount}.`);
}

const report: Row = {
  generated_at: new Date().toISOString(),
  mode: apply ? 'apply' : 'dry-run',
  blueprint_code: STRICT_CHSL_BLUEPRINT_CODE,
  atomic: {
    active_facets: atomicFacets.length,
    structurally_complete_cloze_families: completeGroups.length,
    selected_group_families: selectedGroups.map((group) => group.family),
    selected_question_count: selectedGroups.reduce((total, group) => total + group.items.length, 0),
  },
  current_events: {
    claim_grounded_eligible: eligibleEvidenceCount,
    pending_metadata_updates: evidenceUpdates.length,
    by_registry_key: Object.fromEntries([...evidenceCounts].sort(([left], [right]) => left.localeCompare(right))),
  },
  applied: false,
};

if (apply) {
  for (const update of evidenceUpdates) {
    const result = await db.from('questions')
      .update({ source_metadata: update.metadata })
      .eq('id', update.id)
      .eq('updated_at', update.updatedAt)
      .select('id');
    if (result.error) throw new Error(`question ${update.id}: ${result.error.code}: ${result.error.message}`);
    if ((result.data ?? []).length !== 1) throw new Error(`question ${update.id}: stale row; rerun dry-run.`);
  }

  const groupRows = selectedGroups.map(({ family, items }) => ({
    exam_profile_id: profileId,
    group_key: `${STRICT_CHSL_BLUEPRINT_CODE}-${family.replace('_', '-')}`,
    group_type: 'cloze',
    title: { en: `SSC CHSL cloze passage ${family.split('_')[1]}`, hi: `SSC CHSL cloze passage ${family.split('_')[1]}` },
    passage: { en: items[0].passage, hi: items[0].passage },
    media: [],
    expected_item_count: 5,
    source_metadata: {
      content_owner: 'QuestionWale',
      relation_family: family,
      passage_language: 'en',
      normalized_by: 'ssc-chsl-atomic-group-v1',
      normalized_on: '2026-09-02',
      structural_checks: {
        exact_item_count: 5,
        exact_orders: [0, 1, 2, 3, 4],
        identical_passage_snapshot: true,
      },
    },
    reviewer_status: 'verified',
    is_active: true,
  }));
  const groupResult = await db.from('question_mock_groups')
    .upsert(groupRows, { onConflict: 'exam_profile_id,group_key' })
    .select('id,group_key');
  if (groupResult.error) throw new Error(`question_mock_groups: ${groupResult.error.code}: ${groupResult.error.message}`);
  const groupIdByKey = new Map((groupResult.data ?? []).map((row) => [String(row.group_key), String(row.id)]));

  for (const { family, items } of selectedGroups) {
    const groupKey = `${STRICT_CHSL_BLUEPRINT_CODE}-${family.replace('_', '-')}`;
    const groupId = groupIdByKey.get(groupKey);
    if (!groupId) throw new Error(`Missing upserted group ${groupKey}.`);
    for (const item of items) {
      const desiredOrder = item.order + 1;
      if (item.facet.group_id === groupId && item.facet.group_order === desiredOrder) continue;
      const result = await db.from('question_mock_facets')
        .update({ group_id: groupId, group_order: desiredOrder })
        .eq('id', item.facet.id)
        .eq('question_id', item.question.id)
        .select('id');
      if (result.error) throw new Error(`facet ${item.facet.id}: ${result.error.code}: ${result.error.message}`);
      if ((result.data ?? []).length !== 1) throw new Error(`facet ${item.facet.id}: update did not affect one row.`);
    }
  }
  report.applied = true;
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
console.log(`[ssc-chsl-prepare] report: ${outputPath}`);
