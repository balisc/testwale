import type { MockBlueprintConfig, MockExamKey } from './blueprintTypes';
import type { MockTestStatus } from './types';
import { normalizeTierDisplayText } from '@/lib/tierDisplay';

export type PublicMockExamAvailability = 'available' | 'coming_soon';

export type PublicMockExamSummary = {
  id: string;
  examKey: MockExamKey;
  examCode: string;
  publicName: string;
  examSlug: string;
  tier: string;
  questionCount: number;
  maxMarks: number;
  durationMinutes: number;
  negativeMarking: number;
  timerMode: 'global' | 'sectional';
  timerLabel: string;
  sectionNames: string[];
  availability: PublicMockExamAvailability;
  destination: string;
  displayPriority: number;
};

export type MockShowcaseActiveTest = {
  id: string;
  examKey: MockExamKey;
  status: Extract<MockTestStatus, 'not_started' | 'in_progress'>;
};

export type MockShowcaseUserState = {
  activeTests: MockShowcaseActiveTest[];
  hasCompletedMock: boolean;
};

export type MockShowcaseCta = {
  kind: 'coming_soon' | 'explore' | 'loading' | 'generate_first' | 'resume' | 'generate_new';
  label: string;
  href: string | null;
  canGenerate: boolean;
};

export type PublicBlueprintRuntimeRow = {
  code: string;
  isActive: boolean;
  isProductionReady: boolean;
};

function tierLabel(tier: string) {
  const normalized = tier.replaceAll('_', '-').toLowerCase();
  const titleCaseLabel = normalized.replace(/(^|-)([a-z])/g, (_, separator: string, letter: string) => (
    `${separator}${letter.toUpperCase()}`
  ));
  return normalizeTierDisplayText(titleCaseLabel);
}

export function runtimeBlueprintCode(config: MockBlueprintConfig, limitedEnabled: boolean) {
  return limitedEnabled && config.limitedBlueprintCode
    ? config.limitedBlueprintCode
    : config.blueprintCode;
}

export function buildPublicMockExamSummaries(
  configs: readonly MockBlueprintConfig[],
  runtimeRows: readonly PublicBlueprintRuntimeRow[],
  isFeatureEnabled: (config: MockBlueprintConfig) => boolean,
  isLimitedEnabled: (config: MockBlueprintConfig) => boolean,
): PublicMockExamSummary[] {
  const rows = new Map(runtimeRows.map((row) => [row.code, row]));
  return configs.map((config) => {
    const runtimeCode = runtimeBlueprintCode(config, isLimitedEnabled(config));
    const runtimeRow = rows.get(runtimeCode);
    const available = isFeatureEnabled(config)
      && runtimeRow?.isActive === true
      && runtimeRow.isProductionReady === true;
    const durationMinutes = Math.round(config.rules.standardTotalSeconds / 60);
    return {
      id: config.examKey,
      examKey: config.examKey,
      examCode: config.examCode,
      publicName: config.shortLabel,
      examSlug: config.examSlug,
      tier: tierLabel(config.rules.tier),
      questionCount: config.rules.questionCount,
      maxMarks: config.rules.maxMarks,
      durationMinutes,
      negativeMarking: Math.abs(config.rules.marksWrong),
      timerMode: config.rules.timingStrategy,
      timerLabel: config.rules.timingStrategy === 'sectional'
        ? `${Math.round((config.rules.standardSectionSeconds ?? 0) / 60)} min per section`
        : `${durationMinutes} min global timer`,
      sectionNames: config.sections.map((section) => section.label),
      availability: available ? 'available' : 'coming_soon',
      destination: config.flowPath,
      displayPriority: config.displayPriority,
    } satisfies PublicMockExamSummary;
  }).sort((left, right) => left.displayPriority - right.displayPriority || left.publicName.localeCompare(right.publicName));
}

export function selectInitialMockExam(exams: readonly PublicMockExamSummary[]) {
  return exams.find((exam) => exam.availability === 'available') ?? exams[0] ?? null;
}

export function resolveMockShowcaseCta({
  exam,
  authenticated,
  userState,
}: {
  exam: PublicMockExamSummary;
  authenticated: boolean;
  userState: MockShowcaseUserState | null;
}): MockShowcaseCta {
  const active = authenticated
    ? userState?.activeTests.find((test) => test.examKey === exam.examKey)
    : null;
  if (active) {
    return { kind: 'resume', label: 'Resume Mock Test', href: `/mock-tests/${active.id}`, canGenerate: false };
  }
  if (exam.availability !== 'available') {
    return { kind: 'coming_soon', label: 'Coming Soon', href: null, canGenerate: false };
  }
  if (!authenticated) {
    return { kind: 'explore', label: 'Explore Mock Tests', href: exam.destination, canGenerate: false };
  }
  if (!userState) {
    return { kind: 'loading', label: 'Checking your mocks…', href: null, canGenerate: false };
  }
  if (userState.hasCompletedMock) {
    return { kind: 'generate_new', label: 'Generate New Mock', href: null, canGenerate: true };
  }
  return { kind: 'generate_first', label: 'Generate First Mock', href: null, canGenerate: true };
}
