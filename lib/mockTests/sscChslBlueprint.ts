import { ordinaryCell, type BlueprintCell, type BlueprintSection } from './blueprintTypes';

export const SSC_CHSL_TIER1_BLUEPRINT_CODE = 'ssc-chsl-tier1-2025-v1';

export const SSC_CHSL_TIER1_SECTIONS: readonly BlueprintSection[] = [
  {
    key: 'english', label: 'English Language (Basic Knowledge)', questionCount: 25, marks: 50, bilingual: false,
    cells: [
      ordinaryCell('english', 'error_improvement', 'Error spotting / sentence improvement', 3, 2, 5),
      ordinaryCell('english', 'fill_completion', 'Fill in the blanks / sentence completion', 2, 1, 3),
      ordinaryCell('english', 'synonyms_antonyms', 'Synonyms / antonyms / homonyms', 3, 2, 4),
      ordinaryCell('english', 'idioms', 'Idioms and phrases', 2, 1, 2),
      ordinaryCell('english', 'one_word', 'One-word substitution', 2, 1, 2),
      ordinaryCell('english', 'spelling', 'Spelling / mis-spelt words', 2, 1, 3),
      ordinaryCell('english', 'voice_narration', 'Active-passive / direct-indirect', 2, 1, 3),
      ordinaryCell('english', 'para_jumble', 'Para jumble / shuffling', 2, 1, 3),
      {
        sectionKey: 'english', bucketKey: 'atomic_comprehension',
        label: 'One atomic cloze or comprehension group', target: 5, min: 5, max: 5,
        minimumInventory: 40, groupSize: 5,
      },
      ordinaryCell('english', 'grammar_usage_misc', 'Grammar / sentence formation / functional usage', 2, 1, 3),
    ],
  },
  {
    key: 'reasoning', label: 'General Intelligence', questionCount: 25, marks: 50, bilingual: true,
    cells: [
      ordinaryCell('reasoning', 'analogy', 'Analogy (semantic/number/figural)', 2, 1, 3),
      ordinaryCell('reasoning', 'classification', 'Classification / odd one out', 2, 1, 3),
      ordinaryCell('reasoning', 'series', 'Number / alphabet / figural series', 3, 2, 4),
      ordinaryCell('reasoning', 'coding_operations', 'Coding-decoding / symbolic operations', 3, 2, 4),
      ordinaryCell('reasoning', 'relations_direction_ranking', 'Blood relation / direction / ranking / dictionary order', 4, 3, 5),
      ordinaryCell('reasoning', 'logic_inference', 'Syllogism / Venn / inference / statement logic', 2, 1, 3),
      ordinaryCell('reasoning', 'missing_matrix_arithmetic', 'Missing number / matrix / arithmetic reasoning', 3, 2, 4),
      ordinaryCell('reasoning', 'non_verbal', 'Mirror / fold / cut / embedded / completion', 4, 3, 5),
      ordinaryCell('reasoning', 'dice_cube_spatial', 'Dice / cube / spatial orientation', 2, 1, 3),
    ],
  },
  {
    key: 'quantitative_aptitude', label: 'Quantitative Aptitude (Basic Arithmetic Skill)', questionCount: 25, marks: 50, bilingual: true,
    cells: [
      ordinaryCell('quantitative_aptitude', 'number_system_simplification', 'Number system / simplification', 3, 2, 4),
      ordinaryCell('quantitative_aptitude', 'percentage_ratio_average', 'Percentage / ratio / average', 3, 2, 4),
      ordinaryCell('quantitative_aptitude', 'commercial_math', 'Profit-loss / discount / SI-CI', 3, 2, 4),
      ordinaryCell('quantitative_aptitude', 'time_work_pipes', 'Time-work / pipes', 2, 1, 3),
      ordinaryCell('quantitative_aptitude', 'speed_distance', 'Time-speed-distance / trains / boats', 2, 1, 3),
      ordinaryCell('quantitative_aptitude', 'mixture_partnership', 'Mixture / alligation / partnership', 1, 0, 2),
      ordinaryCell('quantitative_aptitude', 'algebra', 'Algebra', 2, 1, 3),
      ordinaryCell('quantitative_aptitude', 'geometry', 'Geometry', 2, 1, 3),
      ordinaryCell('quantitative_aptitude', 'mensuration', 'Mensuration', 2, 2, 4),
      ordinaryCell('quantitative_aptitude', 'trigonometry', 'Trigonometry / heights and distances', 2, 1, 3),
      ordinaryCell('quantitative_aptitude', 'data_interpretation', 'Data interpretation / tables / graphs / statistics', 3, 2, 5),
    ],
  },
  {
    key: 'general_awareness', label: 'General Awareness', questionCount: 25, marks: 50, bilingual: true,
    cells: [
      ordinaryCell('general_awareness', 'current_events', 'Current events', 4, 2, 5),
      ordinaryCell('general_awareness', 'history', 'History', 3, 2, 4),
      ordinaryCell('general_awareness', 'culture', 'Culture', 2, 1, 3),
      ordinaryCell('general_awareness', 'geography', 'Geography', 2, 1, 3),
      ordinaryCell('general_awareness', 'polity', 'Indian polity / general policy', 3, 2, 4),
      ordinaryCell('general_awareness', 'economy', 'Economy', 2, 1, 3),
      ordinaryCell('general_awareness', 'biology', 'Biology / everyday science', 2, 1, 3),
      ordinaryCell('general_awareness', 'physics', 'Physics', 2, 1, 3),
      ordinaryCell('general_awareness', 'chemistry', 'Chemistry', 2, 1, 3),
      ordinaryCell('general_awareness', 'environment_research_static', 'Environment / research / computer / awards / sports', 3, 2, 5),
    ],
  },
] as const;

export const SSC_CHSL_TIER1_RULES = {
  code: SSC_CHSL_TIER1_BLUEPRINT_CODE,
  patternYear: 2025,
  tier: 'TIER_I',
  questionCount: 100,
  maxMarks: 200,
  marksCorrect: 2,
  marksWrong: -0.5,
  marksUnanswered: 0,
  sectionQuestionCount: 25,
  timingStrategy: 'global',
  standardTotalSeconds: 60 * 60,
  scribeTotalSeconds: 80 * 60,
  difficultyPerSection: {
    basic: { min: 9, max: 12, target: 11 },
    intermediate: { min: 9, max: 12, target: 10 },
    advanced: { min: 2, max: 5, target: 4 },
  },
  answerPositionWholeTest: { min: 20, max: 30, target: 25 },
  recentTestExclusionCount: 5,
  currentAffairs: {
    targetCycleYear: 2025,
    earliestEventDate: '2024-01-01',
    latestEventDate: '2025-08-31',
    requiresExplicitEventDate: true,
  },
  provisionalResearch: true,
  researchVersion: 'ssc-chsl-tier1-corpus-2026-09-01-v1',
} as const;

export function allChslBlueprintCells(): BlueprintCell[] {
  return SSC_CHSL_TIER1_SECTIONS.flatMap((section) => [...section.cells]);
}

