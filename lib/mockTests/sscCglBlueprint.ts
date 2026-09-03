import { ordinaryCell, type BlueprintCell, type BlueprintSection } from './blueprintTypes';

export type {
  BlueprintCell,
  BlueprintSection,
  DifficultyBand,
  MockMode,
  MockSectionKey,
} from './blueprintTypes';

export const SSC_CGL_TIER1_BLUEPRINT_CODE = 'ssc-cgl-tier1-2026-v1';
export const SSC_CGL_TIER1_LIMITED_BLUEPRINT_CODE = 'ssc-cgl-tier1-2026-limited-v1';

export const SSC_CGL_TIER1_SECTIONS: readonly BlueprintSection[] = [
  {
    key: 'reasoning',
    label: 'General Intelligence and Reasoning',
    questionCount: 25,
    marks: 50,
    bilingual: true,
    cells: [
      ordinaryCell('reasoning', 'analogy', 'Analogy (semantic/number/figural)', 2, 1, 3),
      ordinaryCell('reasoning', 'classification', 'Classification / odd one out', 1, 1, 2),
      ordinaryCell('reasoning', 'series', 'Number / alphabet / figural series', 3, 2, 4),
      ordinaryCell('reasoning', 'coding_operations', 'Coding-decoding / symbolic operations', 3, 2, 4),
      ordinaryCell('reasoning', 'relations_direction_ranking', 'Blood relation / direction / ranking', 3, 2, 4),
      ordinaryCell('reasoning', 'logic_inference', 'Syllogism / Venn / inference / statement logic', 3, 2, 4),
      ordinaryCell('reasoning', 'missing_matrix_arithmetic', 'Missing number / matrix / arithmetic reasoning', 3, 2, 4),
      ordinaryCell('reasoning', 'non_verbal', 'Mirror / fold / cut / embedded / completion', 5, 4, 6),
      ordinaryCell('reasoning', 'dice_cube_spatial', 'Dice / cube / spatial orientation', 2, 1, 3),
    ],
  },
  {
    key: 'general_awareness',
    label: 'General Awareness',
    questionCount: 25,
    marks: 50,
    bilingual: true,
    cells: [
      ordinaryCell('general_awareness', 'current_events', 'Current events', 4, 2, 5),
      ordinaryCell('general_awareness', 'history', 'History', 3, 2, 4),
      ordinaryCell('general_awareness', 'culture', 'Culture', 2, 1, 3),
      ordinaryCell('general_awareness', 'geography', 'Geography', 2, 1, 3),
      ordinaryCell('general_awareness', 'polity', 'Indian polity / general policy', 3, 2, 4),
      ordinaryCell('general_awareness', 'economy', 'Economy', 2, 1, 3),
      ordinaryCell('general_awareness', 'biology', 'Biology / everyday science', 3, 2, 4),
      ordinaryCell('general_awareness', 'physics', 'Physics', 2, 1, 3),
      ordinaryCell('general_awareness', 'chemistry', 'Chemistry', 2, 1, 3),
      ordinaryCell('general_awareness', 'environment_research_static', 'Environment / research / static miscellaneous', 2, 1, 3),
    ],
  },
  {
    key: 'quantitative_aptitude',
    label: 'Quantitative Aptitude',
    questionCount: 25,
    marks: 50,
    bilingual: true,
    cells: [
      ordinaryCell('quantitative_aptitude', 'number_system_simplification', 'Number system / simplification', 2, 1, 3),
      ordinaryCell('quantitative_aptitude', 'percentage_ratio_average', 'Percentage / ratio / average', 3, 2, 4),
      ordinaryCell('quantitative_aptitude', 'commercial_math', 'Profit-loss / discount / SI-CI', 3, 2, 4),
      ordinaryCell('quantitative_aptitude', 'time_work_pipes', 'Time-work / pipes', 2, 1, 3),
      ordinaryCell('quantitative_aptitude', 'speed_distance', 'Time-speed-distance / trains / boats', 2, 1, 3),
      ordinaryCell('quantitative_aptitude', 'mixture_partnership', 'Mixture / alligation / partnership', 1, 0, 2),
      ordinaryCell('quantitative_aptitude', 'algebra', 'Algebra', 2, 1, 3),
      ordinaryCell('quantitative_aptitude', 'geometry', 'Geometry', 3, 2, 4),
      ordinaryCell('quantitative_aptitude', 'mensuration', 'Mensuration', 2, 2, 4),
      ordinaryCell('quantitative_aptitude', 'trigonometry', 'Trigonometry / heights and distances', 3, 1, 4),
      ordinaryCell('quantitative_aptitude', 'data_interpretation', 'Data interpretation / tables / graphs / statistics', 2, 2, 4),
    ],
  },
  {
    key: 'english',
    label: 'English Comprehension',
    questionCount: 25,
    marks: 50,
    bilingual: false,
    cells: [
      ordinaryCell('english', 'error_improvement', 'Error spotting / sentence improvement', 4, 3, 5),
      ordinaryCell('english', 'fill_completion', 'Fill in the blanks / sentence completion', 2, 1, 3),
      ordinaryCell('english', 'synonyms_antonyms', 'Synonyms / antonyms / homonyms', 3, 2, 4),
      ordinaryCell('english', 'idioms', 'Idioms and phrases', 2, 1, 2),
      ordinaryCell('english', 'one_word', 'One-word substitution', 2, 1, 2),
      ordinaryCell('english', 'spelling', 'Spelling / mis-spelt words', 2, 1, 3),
      ordinaryCell('english', 'voice_narration', 'Active-passive / direct-indirect', 3, 2, 4),
      ordinaryCell('english', 'para_jumble', 'Para jumble / shuffling', 2, 1, 3),
      {
        sectionKey: 'english',
        bucketKey: 'atomic_comprehension',
        label: 'One atomic cloze or comprehension group',
        target: 5,
        min: 5,
        max: 5,
        minimumInventory: 40,
        groupSize: 5,
      },
    ],
  },
] as const;

/**
 * Honest limited-beta composition backed by the currently reviewed base
 * corpus. It keeps all four SSC sections and the official 25-question section
 * sizes, but does not claim the exact topic distribution of the production
 * blueprint while its missing content families are being prepared.
 */
export const SSC_CGL_TIER1_LIMITED_SECTIONS: readonly BlueprintSection[] = [
  {
    key: 'reasoning',
    label: 'General Intelligence and Reasoning',
    questionCount: 25,
    marks: 50,
    bilingual: true,
    cells: [
      ordinaryCell('reasoning', 'classification', 'Classification / odd one out', 2, 2, 2),
      ordinaryCell('reasoning', 'series', 'Number / alphabet series', 3, 3, 3),
      ordinaryCell('reasoning', 'coding_operations', 'Coding-decoding / symbolic operations', 3, 3, 3),
      ordinaryCell('reasoning', 'relations_direction_ranking', 'Blood relation / direction / ranking', 3, 3, 3),
      ordinaryCell('reasoning', 'logic_inference', 'Syllogism / Venn / inference / statement logic', 4, 4, 4),
      ordinaryCell('reasoning', 'missing_matrix_arithmetic', 'Missing number / matrix / arithmetic reasoning', 3, 3, 3),
      ordinaryCell('reasoning', 'non_verbal', 'Non-verbal and spatial reasoning', 5, 5, 5),
      ordinaryCell('reasoning', 'dice_cube_spatial', 'Dice / cube / spatial orientation', 2, 2, 2),
    ],
  },
  {
    key: 'general_awareness',
    label: 'General Awareness',
    questionCount: 25,
    marks: 50,
    bilingual: true,
    cells: [
      ordinaryCell('general_awareness', 'history', 'History', 4, 4, 4),
      ordinaryCell('general_awareness', 'culture', 'Culture', 2, 2, 2),
      ordinaryCell('general_awareness', 'geography', 'Geography', 3, 3, 3),
      ordinaryCell('general_awareness', 'polity', 'Indian polity / general policy', 3, 3, 3),
      ordinaryCell('general_awareness', 'economy', 'Economy', 3, 3, 3),
      ordinaryCell('general_awareness', 'biology', 'Biology / everyday science', 3, 3, 3),
      ordinaryCell('general_awareness', 'physics', 'Physics', 2, 2, 2),
      ordinaryCell('general_awareness', 'chemistry', 'Chemistry', 2, 2, 2),
      ordinaryCell('general_awareness', 'environment_research_static', 'Environment / research / static miscellaneous', 3, 3, 3),
    ],
  },
  {
    key: 'quantitative_aptitude',
    label: 'Quantitative Aptitude',
    questionCount: 25,
    marks: 50,
    bilingual: true,
    cells: [
      ordinaryCell('quantitative_aptitude', 'number_system_simplification', 'Number system / simplification', 3, 3, 3),
      ordinaryCell('quantitative_aptitude', 'percentage_ratio_average', 'Percentage / ratio / average', 4, 4, 4),
      ordinaryCell('quantitative_aptitude', 'commercial_math', 'Profit-loss / discount / SI-CI', 4, 4, 4),
      ordinaryCell('quantitative_aptitude', 'time_work_pipes', 'Time-work / pipes', 3, 3, 3),
      ordinaryCell('quantitative_aptitude', 'speed_distance', 'Time-speed-distance / trains / boats', 3, 3, 3),
      ordinaryCell('quantitative_aptitude', 'mixture_partnership', 'Mixture / alligation / partnership', 1, 1, 1),
      ordinaryCell('quantitative_aptitude', 'algebra', 'Algebra', 2, 2, 2),
      ordinaryCell('quantitative_aptitude', 'geometry', 'Geometry', 2, 2, 2),
      ordinaryCell('quantitative_aptitude', 'mensuration', 'Mensuration', 3, 3, 3),
    ],
  },
  {
    key: 'english',
    label: 'English Comprehension',
    questionCount: 25,
    marks: 50,
    bilingual: false,
    cells: [
      ordinaryCell('english', 'error_improvement', 'Grammar and sentence improvement', 10, 10, 10),
      ordinaryCell('english', 'fill_completion', 'Writing usage and completion', 10, 10, 10),
      {
        sectionKey: 'english',
        bucketKey: 'atomic_comprehension',
        label: 'One complete reading-comprehension group',
        target: 5,
        min: 5,
        max: 5,
        minimumInventory: 20,
        groupSize: 5,
      },
    ],
  },
] as const;

export const SSC_CGL_TIER1_RULES = {
  code: SSC_CGL_TIER1_BLUEPRINT_CODE,
  patternYear: 2026,
  tier: 'TIER_I',
  questionCount: 100,
  maxMarks: 200,
  marksCorrect: 2,
  marksWrong: -0.5,
  marksUnanswered: 0,
  sectionQuestionCount: 25,
  timingStrategy: 'sectional',
  standardSectionSeconds: 15 * 60,
  scribeSectionSeconds: 20 * 60,
  standardTotalSeconds: 60 * 60,
  scribeTotalSeconds: 80 * 60,
  difficultyPerSection: {
    basic: { min: 6, max: 9, target: 8 },
    intermediate: { min: 11, max: 14, target: 12 },
    advanced: { min: 4, max: 6, target: 5 },
  },
  answerPositionWholeTest: { min: 20, max: 30, target: 25 },
  recentTestExclusionCount: 5,
  currentAffairs: {
    targetCycleYear: 2026,
    earliestEventDate: '2025-01-01',
    latestEventDate: '2026-07-31',
    requiresExplicitEventDate: true,
  },
  provisionalResearch: true,
  researchVersion: 'ssc-cgl-tier1-corpus-2026-09-01-v1',
} as const;

export function allBlueprintCells(): BlueprintCell[] {
  return SSC_CGL_TIER1_SECTIONS.flatMap((section) => [...section.cells]);
}
