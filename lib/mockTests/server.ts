import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizeTierDisplayText } from '@/lib/tierDisplay';
import { selectMockItems, type SelectionCandidate } from './core';
import {
  getMockBlueprint,
  getMockBlueprintByCode,
} from './blueprints';
import type { DifficultyBand, MockExamKey, MockMode, MockSectionKey } from './blueprintTypes';
import type {
  MockHistoryRow,
  MockReadiness,
  MockReviewFilter,
  MockResult,
  MockShellItem,
  MockTestShell,
  MockTestStatus,
} from './types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9._:-]{16,128}$/;
const TERMINAL_STATUSES = new Set<MockTestStatus>(['submitted', 'auto_submitted']);
const LIMITED_READINESS_TTL_MS = 60_000;
const limitedReadinessCache = new Map<string, { checkedAt: number; ready: boolean }>();

export type MockTestErrorCode =
  | 'LOGIN_REQUIRED'
  | 'FEATURE_DISABLED'
  | 'BLUEPRINT_UNAVAILABLE'
  | 'INSUFFICIENT_VERIFIED_INVENTORY'
  | 'RATE_LIMITED'
  | 'INVALID_REQUEST'
  | 'NOT_FOUND'
  | 'STATE_CONFLICT'
  | 'STALE_RESPONSE'
  | 'SECTION_LOCKED'
  | 'TEST_EXPIRED'
  | 'ALREADY_SUBMITTED'
  | 'INTERNAL_ERROR';

export class MockTestServerError extends Error {
  constructor(public readonly code: MockTestErrorCode, message = code) {
    super(message);
  }
}

function adminOrThrow() {
  const admin = getSupabaseAdmin();
  if (!admin) throw new MockTestServerError('BLUEPRINT_UNAVAILABLE');
  return admin;
}

function isMissingMigration(error: unknown) {
  const record = error as { code?: string; message?: string } | null;
  return ['42P01', '42883', 'PGRST202', 'PGRST205'].includes(String(record?.code ?? ''))
    || /mock_test|get_mock_test_readiness/i.test(String(record?.message ?? ''))
      && /does not exist|schema cache|not find/i.test(String(record?.message ?? ''));
}

function envEnabled(name: string) {
  return process.env[name]?.trim().toLowerCase() === 'true';
}

function allCells(examKey: MockExamKey, limited = false) {
  const config = getMockBlueprint(examKey);
  const sections = limited && config.limitedSections ? config.limitedSections : config.sections;
  return sections.flatMap((section) => [...section.cells]);
}

function runtimeBlueprint(examKey: MockExamKey) {
  const config = getMockBlueprint(examKey);
  const limited = envEnabled(config.limitedEnv)
    && Boolean(config.limitedBlueprintCode && config.limitedSections);
  return {
    config,
    limited,
    blueprintCode: limited ? config.limitedBlueprintCode! : config.blueprintCode,
  };
}

function candidateFromFacet(facet: Record<string, unknown>, history?: {
  recentIds?: ReadonlySet<string>;
  attemptedIds?: ReadonlySet<string>;
  seenAt?: ReadonlyMap<string, string>;
  compact?: boolean;
}): SelectionCandidate[] {
  const questionId = String(facet.question_id);
  const correctOption = String(facet.correct_option ?? '');
  if (!['A', 'B', 'C', 'D'].includes(correctOption)) return [];
  const groupId = typeof facet.group_id === 'string' ? facet.group_id : null;
  return [{
    id: questionId,
    sectionKey: String(facet.section_key) as MockSectionKey,
    bucketKey: String(facet.bucket_key),
    difficulty: normalizeDifficulty(facet.difficulty_band),
    correctOption: correctOption as 'A' | 'B' | 'C' | 'D',
    groupId,
    groupSize: groupId ? Number(facet.group_size ?? 0) || null : null,
    groupOrder: groupId ? Number(facet.group_order ?? 0) || null : null,
    recentlyUsed: history?.compact ? facet.recently_used === true : history?.recentIds?.has(questionId) ?? false,
    previouslyAttempted: history?.compact ? facet.previously_attempted === true : history?.attemptedIds?.has(questionId) ?? false,
    lastSeenAt: history?.compact
      ? typeof facet.last_seen_at === 'string' ? facet.last_seen_at : null
      : history?.seenAt?.get(questionId) ?? null,
  }];
}

async function limitedInventoryCanGenerate(examKey: MockExamKey, blueprintCode: string) {
  const cached = limitedReadinessCache.get(blueprintCode);
  if (cached && Date.now() - cached.checkedAt < LIMITED_READINESS_TTL_MS) return cached.ready;
  const admin = getSupabaseAdmin();
  if (!admin) return false;
  const facets: Array<Record<string, unknown>> = [];
  const pageSize = 1_000;
  for (let from = 0; ; from += pageSize) {
    const result = await admin.rpc('get_mock_test_candidates', {
      p_blueprint_code: blueprintCode,
      p_allow_provisional: true,
    }).range(from, from + pageSize - 1);
    if (result.error) {
      limitedReadinessCache.set(blueprintCode, { checkedAt: Date.now(), ready: false });
      return false;
    }
    const page = (result.data ?? []) as Array<Record<string, unknown>>;
    facets.push(...page);
    if (page.length < pageSize) break;
  }
  try {
    const selected = selectMockItems({
      cells: allCells(examKey, true),
      candidates: facets.flatMap((facet) => candidateFromFacet(facet)),
      seed: `${blueprintCode}:readiness`,
      difficultyPerSection: getMockBlueprint(examKey).rules.difficultyPerSection,
    });
    const ready = selected.length === 100;
    limitedReadinessCache.set(blueprintCode, { checkedAt: Date.now(), ready });
    return ready;
  } catch {
    limitedReadinessCache.set(blueprintCode, { checkedAt: Date.now(), ready: false });
    return false;
  }
}

export async function getMockReadiness(examKey: MockExamKey): Promise<MockReadiness> {
  const { config, limited: limitedRequested, blueprintCode } = runtimeBlueprint(examKey);
  const auditedAt = new Date().toISOString();
  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      examKey,
      blueprintCode,
      rulesVersion: blueprintCode,
      patternYear: config.rules.patternYear,
      state: 'blocked', generationEnabled: false, reason: 'blueprint_disabled', auditedAt, buckets: [],
    };
  }
  const { data, error } = await admin.rpc('get_mock_test_readiness', {
    p_blueprint_code: blueprintCode,
  });
  if (error) {
    if (isMissingMigration(error)) {
      return {
        examKey,
        blueprintCode,
        rulesVersion: blueprintCode,
        patternYear: config.rules.patternYear,
        state: 'blocked', generationEnabled: false, reason: 'migration_required', auditedAt, buckets: [],
      };
    }
    throw new MockTestServerError('BLUEPRINT_UNAVAILABLE');
  }
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  if (rows.length === 0) {
    return {
      examKey,
      blueprintCode,
      rulesVersion: blueprintCode,
      patternYear: config.rules.patternYear,
      state: 'blocked', generationEnabled: false, reason: 'blueprint_disabled', auditedAt, buckets: [],
    };
  }
  const buckets = rows.map((row) => ({
    sectionKey: String(row.section_key) as MockSectionKey,
    bucketKey: String(row.bucket_key),
    label: String(row.label),
    requiredCount: Number(row.required_count ?? 0),
    eligibleCount: Number(row.verified_eligible_count ?? 0),
    provisionalCount: Number(row.provisional_eligible_count ?? 0),
    completeGroupCount: Number(row.complete_group_count ?? 0),
    deficit: Number(row.deficit ?? 0),
    ready: row.bucket_ready === true,
  }));
  const productionReady = rows.every((row) => row.production_ready === true) && buckets.every((row) => row.ready);
  const provisionalReady = limitedRequested && config.limitedSections
    ? await limitedInventoryCanGenerate(examKey, blueprintCode)
    : buckets.every((row) => {
        const cell = allCells(examKey).find((candidate) => candidate.bucketKey === row.bucketKey);
        return row.provisionalCount >= row.requiredCount
          && (!cell?.groupSize || row.completeGroupCount >= 8);
      });
  const enabled = envEnabled(config.enabledEnv);
  const limited = enabled && limitedRequested && provisionalReady;
  return {
    examKey,
    blueprintCode,
    rulesVersion: blueprintCode,
    patternYear: config.rules.patternYear,
    state: productionReady ? 'ready' : limited ? 'limited' : 'blocked',
    generationEnabled: enabled && (productionReady || limited),
    reason: !enabled ? 'feature_disabled' : productionReady || limited ? 'ready' : 'inventory_gaps',
    auditedAt,
    buckets,
  };
}

function normalizeDifficulty(value: unknown): DifficultyBand {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized === 'easy' || normalized === 'basic') return 'basic';
  if (normalized === 'hard' || normalized === 'advanced') return 'advanced';
  return 'intermediate';
}

async function fetchGenerationCandidates(
  userId: string,
  examKey: MockExamKey,
  blueprintCode: string,
  allowLimited: boolean,
) {
  const config = getMockBlueprint(examKey);
  const admin = adminOrThrow();
  const facets: Array<Record<string, unknown>> = [];
  const pageSize = 1_000;
  let compactUserAwareResult = true;
  for (let from = 0; ; from += pageSize) {
    const facetsResult = await admin.rpc('get_mock_test_candidates_for_user', {
      p_blueprint_code: blueprintCode,
      p_user_id: userId,
      p_allow_provisional: allowLimited,
      p_recent_test_limit: config.rules.recentTestExclusionCount,
    }).range(from, from + pageSize - 1);
    if (facetsResult.error) {
      if (from === 0 && isMissingMigration(facetsResult.error)) {
        compactUserAwareResult = false;
        break;
      }
      throw new MockTestServerError('BLUEPRINT_UNAVAILABLE');
    }
    const page = (facetsResult.data ?? []) as Array<Record<string, unknown>>;
    facets.push(...page);
    if (page.length < pageSize) break;
  }

  const recentIds = new Set<string>();
  const seenAt = new Map<string, string>();
  const attemptedIds = new Set<string>();

  if (!compactUserAwareResult) {
    // Deployment-order fallback for releases where the application reaches a
    // server before migrate_egress_optimization_v2.sql has been applied.
    for (let from = 0; ; from += pageSize) {
      const facetsResult = await admin.rpc('get_mock_test_candidates', {
        p_blueprint_code: blueprintCode,
        p_allow_provisional: allowLimited,
      }).range(from, from + pageSize - 1);
      if (facetsResult.error) throw new MockTestServerError('BLUEPRINT_UNAVAILABLE');
      const page = (facetsResult.data ?? []) as Array<Record<string, unknown>>;
      facets.push(...page);
      if (page.length < pageSize) break;
    }

    const questionIds = [...new Set(facets.map((row) => String(row.question_id)))];
    const questionIdSet = new Set(questionIds);
    const recentTestsResult = await admin.from('mock_tests').select('id')
      .eq('user_id', userId).eq('blueprint_code', blueprintCode)
      .order('created_at', { ascending: false }).limit(config.rules.recentTestExclusionCount);
    const recentTestIds = (recentTestsResult.data ?? []).map((row) => String(row.id));
    if (recentTestIds.length > 0) {
      const recentItems = await admin.from('mock_test_items').select('original_question_id, created_at')
        .in('test_id', recentTestIds).limit(1_000);
      for (const row of recentItems.data ?? []) {
        const questionId = String(row.original_question_id);
        recentIds.add(questionId);
        const timestamp = String(row.created_at ?? '');
        if (!seenAt.has(questionId) || timestamp < seenAt.get(questionId)!) seenAt.set(questionId, timestamp);
      }
    }
    const attempts = await admin.from('user_attempts').select('question_id')
      .eq('user_id', userId).limit(10_000);
    if (!attempts.error) for (const row of attempts.data ?? []) {
      const questionId = String(row.question_id);
      if (questionIdSet.has(questionId)) attemptedIds.add(questionId);
    }
  }

  const candidates: SelectionCandidate[] = facets.flatMap((facet) => candidateFromFacet(facet, {
    compact: compactUserAwareResult,
    recentIds,
    attemptedIds,
    seenAt,
  }));
  return candidates;
}

function mapDatabaseError(error: { message?: string; code?: string } | null) {
  const message = String(error?.message ?? '');
  if (/rate_limited|daily_quota/i.test(message)) return new MockTestServerError('RATE_LIMITED');
  if (/not_production_ready|insufficient|selection_contains_ineligible|split_group|bucket_count/i.test(message)) {
    return new MockTestServerError('INSUFFICIENT_VERIFIED_INVENTORY');
  }
  if (/already_submitted/i.test(message)) return new MockTestServerError('ALREADY_SUBMITTED');
  if (/section_locked/i.test(message)) return new MockTestServerError('SECTION_LOCKED');
  if (/expired/i.test(message)) return new MockTestServerError('TEST_EXPIRED');
  if (/not_found/i.test(message)) return new MockTestServerError('NOT_FOUND');
  if (/not_started|not_in_progress/i.test(message)) return new MockTestServerError('STATE_CONFLICT');
  return new MockTestServerError('INTERNAL_ERROR');
}

export async function generateMockTest(userId: string, idempotencyKey: string, examKey: MockExamKey) {
  const config = getMockBlueprint(examKey);
  if (!UUID_PATTERN.test(userId) || !IDEMPOTENCY_PATTERN.test(idempotencyKey)) {
    throw new MockTestServerError('INVALID_REQUEST');
  }
  const readiness = await getMockReadiness(examKey);
  if (!readiness.generationEnabled) {
    throw new MockTestServerError(
      readiness.reason === 'feature_disabled' ? 'FEATURE_DISABLED' : 'INSUFFICIENT_VERIFIED_INVENTORY',
    );
  }
  const allowLimited = readiness.state === 'limited';
  const seed = randomBytes(32).toString('base64url');
  let selected;
  try {
    const candidates = await fetchGenerationCandidates(userId, examKey, readiness.blueprintCode, allowLimited);
    selected = selectMockItems({
      cells: allCells(examKey, allowLimited), candidates, seed,
      difficultyPerSection: config.rules.difficultyPerSection,
    });
  } catch (error) {
    const admin = getSupabaseAdmin();
    await admin?.rpc('record_mock_generation_failure', {
      p_user_id: userId,
      p_idempotency_key: idempotencyKey,
      p_safe_failure_code: 'INSUFFICIENT_VERIFIED_INVENTORY',
      p_failure_metadata: { blueprint_code: readiness.blueprintCode },
    });
    if (error instanceof MockTestServerError) throw error;
    throw new MockTestServerError('INSUFFICIENT_VERIFIED_INVENTORY');
  }
  const admin = adminOrThrow();
  const { data, error } = await admin.rpc('create_mock_test_from_selection', {
    p_user_id: userId,
    p_idempotency_key: idempotencyKey,
    p_blueprint_code: readiness.blueprintCode,
    p_private_seed_hash: createHash('sha256').update(seed).digest('hex'),
    p_items: selected.map((item) => ({
      questionId: item.id,
      sectionKey: item.sectionKey,
      bucketKey: item.bucketKey,
      sectionOrder: item.sectionOrder,
      overallOrder: item.overallOrder,
      optionOrder: item.optionOrder,
      displayedCorrectOption: item.displayedCorrectOption,
    })),
    p_generation_metadata: {
      algorithm: 'bounded-pools-seeded-v1',
      blueprint_code: readiness.blueprintCode,
      research_version: config.rules.researchVersion,
    },
    p_relaxations: allowLimited ? [{ code: 'allow_provisional_reviewed_facets' }] : [],
    p_allow_limited: allowLimited,
  });
  if (error) throw mapDatabaseError(error);
  const result = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
  const testId = String(result?.test_id ?? '');
  if (!UUID_PATTERN.test(testId)) throw new MockTestServerError('INTERNAL_ERROR');
  return { testId, reused: result?.reused === true };
}

function historyRow(row: Record<string, unknown>): MockHistoryRow {
  const config = getMockBlueprintByCode(String(row.blueprint_code));
  if (!config) throw new MockTestServerError('INTERNAL_ERROR');
  return {
    id: String(row.id), testNumber: Number(row.test_number), title: normalizeTierDisplayText(String(row.title)),
    blueprintCode: String(row.blueprint_code), status: String(row.status) as MockTestStatus,
    examKey: config.examKey,
    timingMode: (row.timing_mode as MockMode | null) ?? null,
    createdAt: String(row.created_at), startedAt: row.started_at ? String(row.started_at) : null,
    submittedAt: row.submitted_at ? String(row.submitted_at) : null,
    autoSubmittedAt: row.auto_submitted_at ? String(row.auto_submitted_at) : null,
    finalScore: row.final_score == null ? null : Number(row.final_score), maxScore: Number(row.max_score),
    attempted: Number(row.attempted_count), correct: Number(row.correct_count), wrong: Number(row.wrong_count),
    unanswered: Number(row.unanswered_count), accuracy: Number(row.accuracy), negativeMarks: Number(row.negative_marks),
    wallTimeSeconds: Number(row.wall_time_seconds), activeTimeSeconds: Number(row.active_time_seconds),
  };
}

const HISTORY_COLUMNS = 'id, test_number, title, blueprint_code, status, timing_mode, created_at, started_at, submitted_at, auto_submitted_at, final_score, max_score, attempted_count, correct_count, wrong_count, unanswered_count, accuracy, negative_marks, wall_time_seconds, active_time_seconds';

export async function listUserMockTests(userId: string, page = 1, pageSize = 10) {
  if (!UUID_PATTERN.test(userId)) throw new MockTestServerError('INVALID_REQUEST');
  const safePage = Math.max(1, Math.min(10_000, Math.trunc(page)));
  const safeSize = Math.max(1, Math.min(20, Math.trunc(pageSize)));
  const from = (safePage - 1) * safeSize;
  const admin = adminOrThrow();
  const result = await admin.from('mock_tests').select(HISTORY_COLUMNS, { count: 'exact' })
    .eq('user_id', userId).order('created_at', { ascending: false }).order('id', { ascending: false })
    .range(from, from + safeSize - 1);
  if (result.error) {
    if (isMissingMigration(result.error)) return { tests: [], page: safePage, pageSize: safeSize, total: 0, migrationRequired: true };
    throw new MockTestServerError('INTERNAL_ERROR');
  }
  return { tests: (result.data ?? []).map((row) => historyRow(row as Record<string, unknown>)), page: safePage, pageSize: safeSize, total: result.count ?? 0, migrationRequired: false };
}

async function readOwnedTest(userId: string, testId: string) {
  if (!UUID_PATTERN.test(userId) || !UUID_PATTERN.test(testId)) throw new MockTestServerError('INVALID_REQUEST');
  const admin = adminOrThrow();
  let result = await admin.from('mock_tests').select(`${HISTORY_COLUMNS}, deadline_at, rules_snapshot`)
    .eq('id', testId).eq('user_id', userId).maybeSingle();
  if (result.error || !result.data) throw new MockTestServerError('NOT_FOUND');
  const row = result.data as Record<string, unknown>;
  if (row.status === 'in_progress' && row.deadline_at && Date.parse(String(row.deadline_at)) <= Date.now()) {
    const finalized = await admin.rpc('finalize_mock_test', { p_user_id: userId, p_test_id: testId, p_manual: false });
    if (finalized.error) throw mapDatabaseError(finalized.error);
    result = await admin.from('mock_tests').select(`${HISTORY_COLUMNS}, deadline_at, rules_snapshot`)
      .eq('id', testId).eq('user_id', userId).maybeSingle();
    if (result.error || !result.data) throw new MockTestServerError('NOT_FOUND');
  }
  return result.data as Record<string, unknown>;
}

function shellItem(row: Record<string, unknown>, response?: Record<string, unknown>): MockShellItem {
  return {
    id: String(row.id), sectionKey: String(row.section_key) as MockSectionKey,
    bucketKey: String(row.bucket_key), sectionOrder: Number(row.section_order), overallOrder: Number(row.overall_order),
    groupId: row.group_snapshot_id ? String(row.group_snapshot_id) : null,
    groupOrder: row.group_order == null ? null : Number(row.group_order),
    passage: (row.passage_snapshot as MockShellItem['passage']) ?? null,
    question: (row.question_snapshot as MockShellItem['question']) ?? {},
    options: (row.options_snapshot as Record<string, unknown>) ?? {},
    optionOrder: row.option_order as ['A', 'B', 'C', 'D'],
    taxonomy: (row.taxonomy_snapshot as Record<string, unknown>) ?? {},
    media: Array.isArray(row.media_snapshot) ? row.media_snapshot : [],
    response: response ? {
      selectedOption: (response.selected_option as 'A' | 'B' | 'C' | 'D' | null) ?? null,
      visited: response.visited === true, markedForReview: response.marked_for_review === true,
      eventVersion: Number(response.event_version), activeTimeSeconds: Number(response.active_time_seconds),
    } : null,
  };
}

async function readFrozenMockItems(testId: string, itemIds?: string[]): Promise<Array<Record<string, unknown>>> {
  const admin = adminOrThrow();
  let query = admin.from('mock_test_items').select('id, section_key, bucket_key, section_order, overall_order, group_snapshot_id, group_order, question_snapshot, options_snapshot, option_order, taxonomy_snapshot, media_snapshot')
    .eq('test_id', testId);
  if (itemIds) query = query.in('id', itemIds);
  const itemsResult = await query.order('overall_order', { ascending: true }).limit(100);
  if (itemsResult.error) throw new MockTestServerError('INTERNAL_ERROR');
  const rows = (itemsResult.data ?? []) as Array<Record<string, unknown>>;
  const groupIds = [...new Set(rows.flatMap((row) => row.group_snapshot_id ? [String(row.group_snapshot_id)] : []))];
  const passages = new Map<string, unknown>();
  if (groupIds.length > 0) {
    const groupsResult = await admin.from('mock_test_group_snapshots').select('id, passage_snapshot')
      .eq('test_id', testId).in('id', groupIds).limit(20);
    if (groupsResult.error) throw new MockTestServerError('INTERNAL_ERROR');
    for (const row of groupsResult.data ?? []) passages.set(String(row.id), row.passage_snapshot);
  }
  return rows.map((row): Record<string, unknown> => ({
    ...row,
    passage_snapshot: row.group_snapshot_id ? passages.get(String(row.group_snapshot_id)) ?? null : null,
  }));
}

export async function getMockTestShell(userId: string, testId: string): Promise<MockTestShell> {
  const test = await readOwnedTest(userId, testId);
  const config = getMockBlueprintByCode(String(test.blueprint_code));
  if (!config) throw new MockTestServerError('INTERNAL_ERROR');
  const shell = {
    id: String(test.id), testNumber: Number(test.test_number), title: normalizeTierDisplayText(String(test.title)),
    blueprintCode: String(test.blueprint_code), status: String(test.status) as MockTestStatus,
    examKey: config.examKey,
    timingMode: (test.timing_mode as MockMode | null) ?? null,
    createdAt: String(test.created_at), startedAt: test.started_at ? String(test.started_at) : null,
    deadlineAt: test.deadline_at ? String(test.deadline_at) : null,
    submittedAt: test.submitted_at ? String(test.submitted_at) : null,
    autoSubmittedAt: test.auto_submitted_at ? String(test.auto_submitted_at) : null,
    serverNow: new Date().toISOString(), rules: (test.rules_snapshot as Record<string, unknown>) ?? {},
  };
  // Do not preload question content before Start. Terminal clients are routed to
  // the separately authorized, paginated review endpoint.
  if (test.status !== 'in_progress') return { ...shell, items: [] };
  const admin = adminOrThrow();
  const [items, responsesResult] = await Promise.all([
    readFrozenMockItems(testId),
    admin.from('mock_test_responses').select('item_id, selected_option, visited, marked_for_review, event_version, active_time_seconds')
      .eq('test_id', testId).eq('user_id', userId).limit(100),
  ]);
  if (responsesResult.error) throw new MockTestServerError('INTERNAL_ERROR');
  const responses = new Map((responsesResult.data ?? []).map((row) => [String(row.item_id), row as Record<string, unknown>]));
  return {
    ...shell,
    items: items.map((row) => shellItem(row, responses.get(String(row.id)))),
  };
}

export async function startMockTest(userId: string, testId: string, timingMode: MockMode) {
  if (!['standard', 'scribe_simulation'].includes(timingMode)) throw new MockTestServerError('INVALID_REQUEST');
  await readOwnedTest(userId, testId);
  const { data, error } = await adminOrThrow().rpc('start_mock_test', {
    p_user_id: userId, p_test_id: testId, p_timing_mode: timingMode,
  });
  if (error) throw mapDatabaseError(error);
  return (Array.isArray(data) ? data[0] : data) as Record<string, unknown>;
}

export async function saveMockResponse(userId: string, testId: string, input: {
  itemId: string; selectedOption: 'A' | 'B' | 'C' | 'D' | null; visited: boolean;
  markedForReview: boolean; eventVersion: number; activeTimeDeltaSeconds: number;
}) {
  if (!UUID_PATTERN.test(input.itemId) || !Number.isInteger(input.eventVersion)
    || !Number.isInteger(input.activeTimeDeltaSeconds)) throw new MockTestServerError('INVALID_REQUEST');
  const { data, error } = await adminOrThrow().rpc('save_mock_test_response', {
    p_user_id: userId, p_test_id: testId, p_item_id: input.itemId,
    p_selected_option: input.selectedOption, p_visited: input.visited,
    p_marked_for_review: input.markedForReview, p_event_version: input.eventVersion,
    p_active_time_delta_seconds: input.activeTimeDeltaSeconds,
  });
  if (error) throw mapDatabaseError(error);
  const result = (Array.isArray(data) ? data[0] : data) as Record<string, unknown>;
  if (result?.conflict === true) throw new MockTestServerError('STALE_RESPONSE');
  if (result?.expired === true) throw new MockTestServerError('TEST_EXPIRED');
  return result;
}

export async function submitMockTest(userId: string, testId: string) {
  const { data, error } = await adminOrThrow().rpc('finalize_mock_test', {
    p_user_id: userId, p_test_id: testId, p_manual: true,
  });
  if (error) throw mapDatabaseError(error);
  return (Array.isArray(data) ? data[0] : data) as Record<string, unknown>;
}

export async function finalizeExpiredMockTests(limit = 100) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new MockTestServerError('INVALID_REQUEST');
  const { data, error } = await adminOrThrow().rpc('auto_finalize_expired_mock_tests', { p_limit: limit });
  if (error) throw mapDatabaseError(error);
  return Number(data ?? 0);
}

function localizedLabel(value: unknown, fallback: string) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const localized = value as { en?: unknown; hi?: unknown };
    if (typeof localized.en === 'string' && localized.en.trim()) return localized.en;
    if (typeof localized.hi === 'string' && localized.hi.trim()) return localized.hi;
  }
  return fallback;
}

export async function getMockTestResult(userId: string, testId: string, options: {
  page?: number;
  pageSize?: number;
  filter?: MockReviewFilter;
} = {}): Promise<MockResult> {
  const test = await readOwnedTest(userId, testId);
  if (!TERMINAL_STATUSES.has(String(test.status) as MockTestStatus)) throw new MockTestServerError('STATE_CONFLICT');
  const page = Math.max(1, Math.min(10_000, Math.trunc(options.page ?? 1)));
  const pageSize = Math.max(1, Math.min(20, Math.trunc(options.pageSize ?? 10)));
  const filter = options.filter ?? 'all';
  if (!['all', 'correct', 'wrong', 'unanswered', 'marked'].includes(filter)) throw new MockTestServerError('INVALID_REQUEST');
  const admin = adminOrThrow();
  const indexResult = await admin.from('mock_test_items').select('id, section_key, bucket_key, overall_order, taxonomy_snapshot')
    .eq('test_id', testId).order('overall_order', { ascending: true }).limit(100);
  if (indexResult.error || (indexResult.data ?? []).length !== 100) throw new MockTestServerError('INTERNAL_ERROR');
  const itemIndex = (indexResult.data ?? []) as Array<Record<string, unknown>>;
  const itemIds = itemIndex.map((row) => String(row.id));
  const [answerKeysResult, responsesResult, sectionsResult] = await Promise.all([
    admin.from('mock_test_item_answers').select('item_id, correct_option').in('item_id', itemIds),
    admin.from('mock_test_responses').select('item_id, selected_option, visited, marked_for_review, event_version, active_time_seconds')
      .eq('test_id', testId).eq('user_id', userId).limit(100),
    admin.from('mock_test_section_attempts').select('section_key, attempted_count, correct_count, wrong_count, unanswered_count, positive_marks, negative_marks, score, active_time_seconds')
      .eq('test_id', testId).order('section_order'),
  ]);
  if (answerKeysResult.error || responsesResult.error || sectionsResult.error
    || (answerKeysResult.data ?? []).length !== 100) throw new MockTestServerError('INTERNAL_ERROR');
  const answerKeys = new Map((answerKeysResult.data ?? []).map((row) => [String(row.item_id), String(row.correct_option)]));
  const responses = new Map((responsesResult.data ?? []).map((row) => [String(row.item_id), row as Record<string, unknown>]));

  const filteredIds = itemIndex.filter((row) => {
    const itemId = String(row.id);
    const response = responses.get(itemId);
    const selected = response?.selected_option == null ? null : String(response.selected_option);
    const correct = answerKeys.get(itemId);
    return filter === 'all'
      || (filter === 'correct' && selected != null && selected === correct)
      || (filter === 'wrong' && selected != null && selected !== correct)
      || (filter === 'unanswered' && selected == null)
      || (filter === 'marked' && response?.marked_for_review === true);
  }).map((row) => String(row.id));
  const from = (page - 1) * pageSize;
  const pageIds = filteredIds.slice(from, from + pageSize);
  const items = pageIds.length > 0 ? await readFrozenMockItems(testId, pageIds) : [];
  let answerDetails = new Map<string, Record<string, unknown>>();
  if (pageIds.length > 0) {
    const detailsResult = await admin.from('mock_test_item_answers').select('item_id, explanation_snapshot, source_snapshot')
      .in('item_id', pageIds);
    if (detailsResult.error || (detailsResult.data ?? []).length !== pageIds.length) throw new MockTestServerError('INTERNAL_ERROR');
    answerDetails = new Map((detailsResult.data ?? []).map((row) => [String(row.item_id), row as Record<string, unknown>]));
  }
  const review = items.map((row) => {
    const item = shellItem(row, responses.get(String(row.id)));
    const answer = answerDetails.get(item.id);
    const correctOption = answerKeys.get(item.id) as 'A' | 'B' | 'C' | 'D' | undefined;
    if (!answer || !correctOption) throw new MockTestServerError('INTERNAL_ERROR');
    const selectedOption = item.response?.selectedOption ?? null;
    return {
      ...item, selectedOption, correctOption,
      isCorrect: selectedOption == null ? null : selectedOption === correctOption,
      explanation: (answer.explanation_snapshot as MockShellItem['question']) ?? {},
      source: (answer.source_snapshot as Record<string, unknown>) ?? {},
      estimatedActiveTimeSeconds: item.response?.activeTimeSeconds ?? 0,
    };
  });
  const topics = new Map<string, { label: string; attempted: number; correct: number }>();
  for (const item of itemIndex) {
    const taxonomy = (item.taxonomy_snapshot as Record<string, unknown>) ?? {};
    const itemId = String(item.id);
    const selected = responses.get(itemId)?.selected_option;
    const topicId = String(taxonomy.topic_id ?? item.bucket_key);
    const current = topics.get(topicId) ?? { label: localizedLabel(taxonomy.topic, String(item.bucket_key)), attempted: 0, correct: 0 };
    if (selected) current.attempted += 1;
    if (selected && String(selected) === answerKeys.get(itemId)) current.correct += 1;
    topics.set(topicId, current);
  }
  return {
    test: historyRow(test),
    sections: (sectionsResult.data ?? []).map((row) => ({
      sectionKey: String(row.section_key) as MockSectionKey, attempted: Number(row.attempted_count),
      correct: Number(row.correct_count), wrong: Number(row.wrong_count), unanswered: Number(row.unanswered_count),
      positiveMarks: Number(row.positive_marks), negativeMarks: Number(row.negative_marks), score: Number(row.score),
      activeTimeSeconds: Number(row.active_time_seconds),
    })),
    review,
    reviewTotal: filteredIds.length,
    reviewPage: page,
    reviewPageSize: pageSize,
    topicInsights: [...topics.entries()].map(([key, value]) => {
      const accuracy = value.attempted === 0 ? null : (value.correct / value.attempted) * 100;
      return {
        key, label: value.label, attempted: value.attempted, correct: value.correct, accuracy,
        insight: value.attempted < 3 ? 'more_data_needed' as const : accuracy! >= 75 ? 'strength' as const : 'focus' as const,
      };
    }),
    cohort: { status: 'insufficient_data', percentile: null, rank: null },
  };
}
