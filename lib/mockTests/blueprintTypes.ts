export type MockExamKey = 'ssc-cgl' | 'ssc-chsl';
export type MockSectionKey = 'reasoning' | 'general_awareness' | 'quantitative_aptitude' | 'english';
export type MockMode = 'standard' | 'scribe_simulation';
export type DifficultyBand = 'basic' | 'intermediate' | 'advanced';
export type MockTimingStrategy = 'sectional' | 'global';

export type DifficultyRange = { min: number; max: number; target: number };

export type BlueprintCell = {
  sectionKey: MockSectionKey;
  bucketKey: string;
  label: string;
  target: number;
  min: number;
  max: number;
  minimumInventory: number;
  groupSize?: number;
};

export type BlueprintSection = {
  key: MockSectionKey;
  label: string;
  questionCount: 25;
  marks: 50;
  bilingual: boolean;
  cells: readonly BlueprintCell[];
};

export type MockRules = {
  code: string;
  patternYear: number;
  tier: 'TIER_I';
  questionCount: 100;
  maxMarks: 200;
  marksCorrect: 2;
  marksWrong: -0.5;
  marksUnanswered: 0;
  sectionQuestionCount: 25;
  timingStrategy: MockTimingStrategy;
  standardSectionSeconds?: number;
  scribeSectionSeconds?: number;
  standardTotalSeconds: number;
  scribeTotalSeconds: number;
  difficultyPerSection: Record<DifficultyBand, DifficultyRange>;
  answerPositionWholeTest: { min: number; max: number; target: number };
  recentTestExclusionCount: number;
  currentAffairs: {
    targetCycleYear: number;
    earliestEventDate: string;
    latestEventDate: string;
    requiresExplicitEventDate: true;
  };
  provisionalResearch: true;
  researchVersion: string;
};

export type MockBlueprintConfig = {
  examKey: MockExamKey;
  examCode: 'SSC_CGL' | 'SSC_CHSL';
  examSlug: string;
  shortLabel: string;
  title: string;
  flowPath: string;
  displayPriority: number;
  blueprintCode: string;
  limitedBlueprintCode?: string;
  enabledEnv: string;
  limitedEnv: string;
  sections: readonly BlueprintSection[];
  limitedSections?: readonly BlueprintSection[];
  rules: MockRules;
  knownGapCopy: string;
};

export function ordinaryCell(
  sectionKey: MockSectionKey,
  bucketKey: string,
  label: string,
  target: number,
  min: number,
  max: number,
): BlueprintCell {
  return {
    sectionKey,
    bucketKey,
    label,
    target,
    min,
    max,
    minimumInventory: Math.max(20, target * 8),
  };
}
