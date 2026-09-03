import type { MockBlueprintConfig, MockExamKey } from './blueprintTypes';
import {
  SSC_CGL_TIER1_BLUEPRINT_CODE,
  SSC_CGL_TIER1_LIMITED_BLUEPRINT_CODE,
  SSC_CGL_TIER1_LIMITED_SECTIONS,
  SSC_CGL_TIER1_RULES,
  SSC_CGL_TIER1_SECTIONS,
} from './sscCglBlueprint';
import {
  SSC_CHSL_TIER1_BLUEPRINT_CODE,
  SSC_CHSL_TIER1_RULES,
  SSC_CHSL_TIER1_SECTIONS,
} from './sscChslBlueprint';

export const MOCK_BLUEPRINTS: Record<MockExamKey, MockBlueprintConfig> = {
  'ssc-cgl': {
    examKey: 'ssc-cgl', examCode: 'SSC_CGL', examSlug: 'ssc-combined-graduate-level-examination',
    shortLabel: 'SSC CGL', title: 'SSC CGL Tier 1 Full Mock', flowPath: '/mock-tests/ssc-cgl',
    displayPriority: 10,
    blueprintCode: SSC_CGL_TIER1_BLUEPRINT_CODE,
    limitedBlueprintCode: SSC_CGL_TIER1_LIMITED_BLUEPRINT_CODE,
    enabledEnv: 'QW_SSC_CGL_MOCKS_ENABLED', limitedEnv: 'QW_SSC_CGL_MOCKS_LIMITED_MODE',
    sections: SSC_CGL_TIER1_SECTIONS, limitedSections: SSC_CGL_TIER1_LIMITED_SECTIONS, rules: SSC_CGL_TIER1_RULES,
    knownGapCopy: 'This beta redistributes questions away from Current Events, Analogies, Trigonometry, Tables/Graphs and six English vocabulary/usage families until their exact pools are verified.',
  },
  'ssc-chsl': {
    examKey: 'ssc-chsl', examCode: 'SSC_CHSL', examSlug: 'ssc-combined-higher-secondary-level-examination',
    shortLabel: 'SSC CHSL', title: 'SSC CHSL Tier 1 Full Mock', flowPath: '/mock-tests/ssc-chsl',
    displayPriority: 20,
    blueprintCode: SSC_CHSL_TIER1_BLUEPRINT_CODE,
    enabledEnv: 'QW_SSC_CHSL_MOCKS_ENABLED', limitedEnv: 'QW_SSC_CHSL_MOCKS_LIMITED_MODE',
    sections: SSC_CHSL_TIER1_SECTIONS, rules: SSC_CHSL_TIER1_RULES,
    knownGapCopy: 'Current launch checks include explicit current-event dates and complete verified five-question English passage groups.',
  },
};

export function parseMockExamKey(value: unknown): MockExamKey | null {
  return value === 'ssc-cgl' || value === 'ssc-chsl' ? value : null;
}

export function getMockBlueprint(examKey: MockExamKey): MockBlueprintConfig {
  return MOCK_BLUEPRINTS[examKey];
}

export function getMockBlueprintByCode(code: string): MockBlueprintConfig | null {
  return Object.values(MOCK_BLUEPRINTS).find((config) => (
    config.blueprintCode === code || config.limitedBlueprintCode === code
  )) ?? null;
}
