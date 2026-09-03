import 'server-only';

import { unstable_cache } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { MOCK_BLUEPRINTS, getMockBlueprintByCode } from './blueprints';
import { MockTestServerError } from './server';
import {
  buildPublicMockExamSummaries,
  runtimeBlueprintCode,
  type MockShowcaseActiveTest,
  type MockShowcaseUserState,
  type PublicBlueprintRuntimeRow,
  type PublicMockExamSummary,
} from './showcase';

function envEnabled(name: string) {
  return process.env[name]?.trim().toLowerCase() === 'true';
}

const configs = Object.values(MOCK_BLUEPRINTS);

function unavailableSummaries() {
  return buildPublicMockExamSummaries(configs, [], () => false, (config) => envEnabled(config.limitedEnv));
}

async function loadPublicMockExamSummaries(): Promise<PublicMockExamSummary[]> {
  const admin = getSupabaseAdmin();
  if (!admin) return unavailableSummaries();
  const runtimeCodes = configs.map((config) => runtimeBlueprintCode(config, envEnabled(config.limitedEnv)));
  const result = await admin.from('mock_test_blueprints')
    .select('code,is_active,is_production_ready')
    .in('code', runtimeCodes);
  if (result.error) throw new Error(result.error.message);
  const rows = (result.data ?? []).map((row): PublicBlueprintRuntimeRow => ({
    code: String(row.code),
    isActive: row.is_active === true,
    isProductionReady: row.is_production_ready === true,
  }));
  return buildPublicMockExamSummaries(
    configs,
    rows,
    (config) => envEnabled(config.enabledEnv),
    (config) => envEnabled(config.limitedEnv),
  );
}

const getCachedPublicMockExamSummaries = unstable_cache(
  loadPublicMockExamSummaries,
  ['public-mock-exam-summaries-v1'],
  { revalidate: 300, tags: ['mock-blueprints'] },
);

export async function getPublicMockExamSummaries(): Promise<PublicMockExamSummary[]> {
  try {
    return await getCachedPublicMockExamSummaries();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || 'unknown_error');
    console.warn(`[mock-showcase] ${message}`);
    return unavailableSummaries();
  }
}

export async function getMockShowcaseUserState(userId: string): Promise<MockShowcaseUserState> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new MockTestServerError('BLUEPRINT_UNAVAILABLE');
  const blueprintCodes = configs.flatMap((config) => (
    config.limitedBlueprintCode
      ? [config.blueprintCode, config.limitedBlueprintCode]
      : [config.blueprintCode]
  ));
  const [activeResult, completedResult] = await Promise.all([
    admin.from('mock_tests')
      .select('id,blueprint_code,status,created_at')
      .eq('user_id', userId)
      .in('blueprint_code', blueprintCodes)
      .in('status', ['not_started', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(Math.max(20, configs.length * 4)),
    admin.from('mock_tests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('blueprint_code', blueprintCodes)
      .in('status', ['submitted', 'auto_submitted']),
  ]);
  if (activeResult.error || completedResult.error) throw new MockTestServerError('BLUEPRINT_UNAVAILABLE');

  const seenExams = new Set<string>();
  const activeTests: MockShowcaseActiveTest[] = [];
  for (const row of activeResult.data ?? []) {
    const config = getMockBlueprintByCode(String(row.blueprint_code));
    if (!config || seenExams.has(config.examKey)) continue;
    seenExams.add(config.examKey);
    activeTests.push({
      id: String(row.id),
      examKey: config.examKey,
      status: row.status === 'in_progress' ? 'in_progress' : 'not_started',
    });
  }
  return { activeTests, hasCompletedMock: (completedResult.count ?? 0) > 0 };
}
