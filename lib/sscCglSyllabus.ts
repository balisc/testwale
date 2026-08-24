import type {
  ExamLearningSubject,
  ExamLearningSubtopic,
  ExamLearningTopic,
} from '@/lib/examLearning';
import { syllabusNodeSlug } from './examSyllabus';
import type { LocalizedText } from '@/types/polity';

export type SscCglStageCode =
  | 'TIER_I'
  | 'TIER_II_PAPER_I'
  | 'TIER_II_PAPER_II'
  | 'TIER_II_PAPER_III';

export type SscCglStageTag =
  | 'SSC_CGL_TIER_1'
  | 'SSC_CGL_TIER_2_PAPER_1'
  | 'SSC_CGL_TIER_2_PAPER_2'
  | 'SSC_CGL_TIER_2_PAPER_3';

export type SscCglTaxonomyViewName =
  | 'ssc_cgl_tier_1_taxonomy_v2'
  | 'ssc_cgl_tier_2_paper_1_taxonomy_v2'
  | 'ssc_cgl_tier_2_paper_2_taxonomy_v2'
  | 'ssc_cgl_tier_2_paper_3_taxonomy_v2';

export type SscCglStageDefinition = {
  code: SscCglStageCode;
  tag: SscCglStageTag;
  tier: 'tier-1' | 'tier-2';
  paper: null | 'paper-1' | 'paper-2' | 'paper-3';
  href: string;
  view: SscCglTaxonomyViewName;
  label: LocalizedText;
  shortLabel: LocalizedText;
};

export const SSC_CGL_STAGES = [
  {
    code: 'TIER_I',
    tag: 'SSC_CGL_TIER_1',
    tier: 'tier-1',
    paper: null,
    href: '/ssc-cgl/tier-1/subjects',
    view: 'ssc_cgl_tier_1_taxonomy_v2',
    label: { en: 'Tier 1', hi: 'टियर 1' },
    shortLabel: { en: 'Tier 1', hi: 'टियर 1' },
  },
  {
    code: 'TIER_II_PAPER_I',
    tag: 'SSC_CGL_TIER_2_PAPER_1',
    tier: 'tier-2',
    paper: 'paper-1',
    href: '/ssc-cgl/tier-2/paper-1/subjects',
    view: 'ssc_cgl_tier_2_paper_1_taxonomy_v2',
    label: { en: 'Tier 2 — Paper 1', hi: 'टियर 2 — पेपर 1' },
    shortLabel: { en: 'Paper 1', hi: 'पेपर 1' },
  },
  {
    code: 'TIER_II_PAPER_II',
    tag: 'SSC_CGL_TIER_2_PAPER_2',
    tier: 'tier-2',
    paper: 'paper-2',
    href: '/ssc-cgl/tier-2/paper-2/subjects',
    view: 'ssc_cgl_tier_2_paper_2_taxonomy_v2',
    label: { en: 'Tier 2 — Paper 2', hi: 'टियर 2 — पेपर 2' },
    shortLabel: { en: 'Paper 2', hi: 'पेपर 2' },
  },
  {
    code: 'TIER_II_PAPER_III',
    tag: 'SSC_CGL_TIER_2_PAPER_3',
    tier: 'tier-2',
    paper: 'paper-3',
    href: '/ssc-cgl/tier-2/paper-3/subjects',
    view: 'ssc_cgl_tier_2_paper_3_taxonomy_v2',
    label: { en: 'Tier 2 — Paper 3', hi: 'टियर 2 — पेपर 3' },
    shortLabel: { en: 'Paper 3', hi: 'पेपर 3' },
  },
] as const satisfies readonly SscCglStageDefinition[];

export type SscCglTaxonomyViewRow = {
  exam_profile_code: string;
  syllabus_version_code: string;
  tier_code: string;
  tier_label: LocalizedText | string | null;
  tier_sort_order: number;
  paper_code: string | null;
  paper_label: LocalizedText | string | null;
  stage_code: string;
  stage_tag: string;
  stage_sort_order: number;
  subject_id: string;
  subject_code: string;
  subject_title: LocalizedText | string | null;
  subject_description: LocalizedText | string | null;
  subject_sort_order: number;
  topic_id: string;
  topic_code: string;
  topic_title: LocalizedText | string | null;
  topic_description: LocalizedText | string | null;
  topic_sort_order: number;
  subtopic_id: string;
  subtopic_code: string;
  subtopic_title: LocalizedText | string | null;
  subtopic_description: LocalizedText | string | null;
  subtopic_source_locator: string | null;
  subtopic_sort_order: number;
  is_objective: boolean;
  is_qualifying: boolean;
  content_generation_allowed: boolean;
  navigation_visible: boolean;
  is_shared_between_tiers: boolean;
};

export type SscCglSkillTestViewRow = {
  exam_profile_code: string;
  syllabus_version_code: string;
  tier_code: string;
  tier_label: LocalizedText | string | null;
  paper_code: string;
  paper_label: LocalizedText | string | null;
  stage_code: string;
  stage_tag: string;
  stage_sort_order: number;
  skill_test_id: string;
  skill_test_code: string;
  skill_test_title: LocalizedText | string | null;
  skill_test_description: LocalizedText | string | null;
  source_locator: string | null;
  sort_order: number;
  is_objective: boolean;
  is_qualifying: boolean;
};

export type SscCglScopeSummaryViewRow = {
  exam_profile_code: string;
  tier_code: string;
  tier_label: LocalizedText | string | null;
  tier_sort_order: number;
  paper_code: string | null;
  paper_label: LocalizedText | string | null;
  stage_code: string;
  stage_tag: string;
  stage_sort_order: number;
  subjects: number;
  topics: number;
  subtopics: number;
  skill_tests: number;
};

export type SscCglSubtopic = {
  id: string;
  code: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText | null;
  sourceLocator: string | null;
  sortOrder: number;
  isObjective: boolean;
  isQualifying: boolean;
  contentGenerationAllowed: boolean;
  isSharedBetweenTiers: boolean;
};

export type SscCglTopic = {
  id: string;
  code: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText | null;
  sortOrder: number;
  subtopics: SscCglSubtopic[];
};

export type SscCglSubject = {
  id: string;
  code: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText | null;
  sortOrder: number;
  isSharedBetweenTiers: boolean;
  topics: SscCglTopic[];
};

export type SscCglSkillTest = {
  id: string;
  code: string;
  title: LocalizedText;
  description: LocalizedText | null;
  sourceLocator: string | null;
  sortOrder: number;
  isObjective: boolean;
  isQualifying: boolean;
};

export type SscCglStageTaxonomy = {
  stage: SscCglStageDefinition;
  syllabusVersionCode: string;
  tierLabel: LocalizedText;
  paperLabel: LocalizedText;
  subjects: SscCglSubject[];
  counts: { subjects: number; topics: number; subtopics: number };
};

export type SscCglRoute =
  | { kind: 'subjects'; stage: SscCglStageDefinition }
  | {
      kind: 'topics';
      stage: SscCglStageDefinition;
      subjectSlug: string;
    }
  | {
      kind: 'subtopics';
      stage: SscCglStageDefinition;
      subjectSlug: string;
      topicSlug: string;
    }
  | {
      kind: 'questions';
      stage: SscCglStageDefinition;
      subjectSlug: string;
      topicSlug: string;
      subtopicSlug: string;
    };

function localized(value: LocalizedText | string | null): LocalizedText {
  if (typeof value === 'string') return { en: value, hi: value };
  return value ?? {};
}

function optionalLocalized(value: LocalizedText | string | null): LocalizedText | null {
  const result = localized(value);
  return result.en?.trim() || result.hi?.trim() ? result : null;
}

function compareSortOrder<T extends { sortOrder: number; code: string }>(a: T, b: T): number {
  return a.sortOrder - b.sortOrder || a.code.localeCompare(b.code);
}

export function isSscCglExamCode(value: string | null | undefined): boolean {
  return String(value ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_') === 'SSC_CGL';
}

export function getSscCglStageByCode(
  code: string | null | undefined,
): SscCglStageDefinition | null {
  return SSC_CGL_STAGES.find((stage) => stage.code === code) ?? null;
}

export function parseSscCglRoute(path: readonly string[]): SscCglRoute | null {
  let stage: SscCglStageDefinition | undefined;
  let consumed = 0;

  if (path[0] === 'tier-1') {
    stage = SSC_CGL_STAGES[0];
    consumed = 1;
  } else if (path[0] === 'tier-2' && path[1]) {
    stage = SSC_CGL_STAGES.find((candidate) => candidate.paper === path[1]);
    consumed = 2;
  }

  if (!stage) return null;
  const remaining = path.slice(consumed).map((segment) => segment.trim().toLowerCase());
  if (remaining.some((segment) => !segment)) return null;
  if (remaining.length === 1 && remaining[0] === 'subjects') {
    return { kind: 'subjects', stage };
  }
  if (remaining.length === 3 && remaining[0] === 'subjects' && remaining[2] === 'topics') {
    return {
      kind: 'topics',
      stage,
      subjectSlug: remaining[1]!,
    };
  }
  if (
    remaining.length === 5 &&
    remaining[0] === 'subjects' &&
    remaining[2] === 'topics' &&
    remaining[4] === 'subtopics'
  ) {
    return {
      kind: 'subtopics',
      stage,
      subjectSlug: remaining[1]!,
      topicSlug: remaining[3]!,
    };
  }
  if (
    remaining.length === 7 &&
    remaining[0] === 'subjects' &&
    remaining[2] === 'topics' &&
    remaining[4] === 'subtopics' &&
    remaining[6] === 'questions'
  ) {
    return {
      kind: 'questions',
      stage,
      subjectSlug: remaining[1]!,
      topicSlug: remaining[3]!,
      subtopicSlug: remaining[5]!,
    };
  }
  return null;
}

export function getSscCglLegacyRedirect(path: readonly string[]): string | null {
  let stage: SscCglStageDefinition | undefined;
  let consumed = 0;
  if (path[0] === 'tier-1') {
    stage = SSC_CGL_STAGES[0];
    consumed = 1;
  } else if (path[0] === 'tier-2' && path[1]) {
    stage = SSC_CGL_STAGES.find((candidate) => candidate.paper === path[1]);
    consumed = 2;
  }
  if (!stage) return null;
  const remaining = path.slice(consumed).map((segment) => segment.trim().toLowerCase());
  if (remaining.some((segment) => !segment)) return null;
  if (remaining.length === 0) return stage.href;
  const canonicalSegments = new Set(['subjects', 'topics', 'subtopics', 'questions']);
  if (remaining.some((segment) => canonicalSegments.has(segment))) return null;
  if (remaining.length === 1) return getSscCglTopicsHref(stage, remaining[0]!);
  if (remaining.length === 2) return getSscCglSubtopicsHref(stage, remaining[0]!, remaining[1]!);
  if (remaining.length === 3) {
    return getSscCglQuestionsHref(stage, remaining[0]!, remaining[1]!, remaining[2]!);
  }
  return null;
}

export function getSscCglTopicsHref(stage: SscCglStageDefinition, subjectSlug: string): string {
  return `${stage.href}/${subjectSlug}/topics`;
}

export function getSscCglSubtopicsHref(
  stage: SscCglStageDefinition,
  subjectSlug: string,
  topicSlug: string,
): string {
  return `${getSscCglTopicsHref(stage, subjectSlug)}/${topicSlug}/subtopics`;
}

export function getSscCglQuestionsHref(
  stage: SscCglStageDefinition,
  subjectSlug: string,
  topicSlug: string,
  subtopicSlug: string,
): string {
  return `${getSscCglSubtopicsHref(stage, subjectSlug, topicSlug)}/${subtopicSlug}/questions`;
}

export function buildSscCglTaxonomy(
  stage: SscCglStageDefinition,
  rows: readonly SscCglTaxonomyViewRow[],
): SscCglStageTaxonomy {
  const visibleRows = rows.filter((row) => row.navigation_visible);
  for (const row of visibleRows) {
    if (row.stage_code !== stage.code || row.stage_tag !== stage.tag) {
      throw new Error(`ssc_cgl_stage_mismatch:${stage.code}:${row.stage_code}:${row.stage_tag}`);
    }
  }

  const subjectMap = new Map<string, SscCglSubject>();
  const topicMap = new Map<string, { subjectId: string; topic: SscCglTopic }>();
  const subtopicIds = new Set<string>();

  for (const row of visibleRows) {
    let subject = subjectMap.get(row.subject_id);
    if (!subject) {
      subject = {
        id: row.subject_id,
        code: row.subject_code,
        slug: syllabusNodeSlug(row.subject_code),
        title: localized(row.subject_title),
        description: optionalLocalized(row.subject_description),
        sortOrder: row.subject_sort_order,
        isSharedBetweenTiers: row.is_shared_between_tiers,
        topics: [],
      };
      subjectMap.set(subject.id, subject);
    }

    let topicEntry = topicMap.get(row.topic_id);
    if (!topicEntry) {
      const topic: SscCglTopic = {
        id: row.topic_id,
        code: row.topic_code,
        slug: syllabusNodeSlug(row.topic_code),
        title: localized(row.topic_title),
        description: optionalLocalized(row.topic_description),
        sortOrder: row.topic_sort_order,
        subtopics: [],
      };
      subject.topics.push(topic);
      topicEntry = { subjectId: subject.id, topic };
      topicMap.set(topic.id, topicEntry);
    } else if (topicEntry.subjectId !== subject.id) {
      throw new Error(`ssc_cgl_broken_topic_parent:${row.topic_id}`);
    }

    if (subtopicIds.has(row.subtopic_id)) continue;
    subtopicIds.add(row.subtopic_id);
    topicEntry.topic.subtopics.push({
      id: row.subtopic_id,
      code: row.subtopic_code,
      slug: syllabusNodeSlug(row.subtopic_code),
      title: localized(row.subtopic_title),
      description: optionalLocalized(row.subtopic_description),
      sourceLocator: row.subtopic_source_locator,
      sortOrder: row.subtopic_sort_order,
      isObjective: row.is_objective,
      isQualifying: row.is_qualifying,
      contentGenerationAllowed: row.content_generation_allowed,
      isSharedBetweenTiers: row.is_shared_between_tiers,
    });
  }

  const subjects = [...subjectMap.values()].sort(compareSortOrder);
  for (const subject of subjects) {
    subject.topics.sort(compareSortOrder);
    for (const topic of subject.topics) topic.subtopics.sort(compareSortOrder);
  }

  const first = visibleRows[0];
  return {
    stage,
    syllabusVersionCode: first?.syllabus_version_code ?? '',
    tierLabel: localized(first?.tier_label ?? stage.label),
    paperLabel: localized(first?.paper_label ?? stage.label),
    subjects,
    counts: {
      subjects: subjects.length,
      topics: subjects.reduce((total, subject) => total + subject.topics.length, 0),
      subtopics: subtopicIds.size,
    },
  };
}

export function normalizeSscCglSkillTests(
  stage: SscCglStageDefinition,
  rows: readonly SscCglSkillTestViewRow[],
): SscCglSkillTest[] {
  return rows
    .map((row) => {
      if (row.stage_code !== stage.code || row.stage_tag !== stage.tag) {
        throw new Error(`ssc_cgl_skill_stage_mismatch:${row.stage_code}`);
      }
      return {
        id: row.skill_test_id,
        code: row.skill_test_code,
        title: localized(row.skill_test_title),
        description: optionalLocalized(row.skill_test_description),
        sourceLocator: row.source_locator,
        sortOrder: row.sort_order,
        isObjective: row.is_objective,
        isQualifying: row.is_qualifying,
      };
    })
    .sort(compareSortOrder);
}

export function findSscCglRouteNodes(
  taxonomy: SscCglStageTaxonomy,
  route: Extract<SscCglRoute, { kind: 'questions' }>,
): { subject: SscCglSubject; topic: SscCglTopic; subtopic: SscCglSubtopic } | null {
  const subject = taxonomy.subjects.find((row) => row.slug === route.subjectSlug);
  const topic = subject?.topics.find((row) => row.slug === route.topicSlug);
  const subtopic = topic?.subtopics.find((row) => row.slug === route.subtopicSlug);
  return subject && topic && subtopic ? { subject, topic, subtopic } : null;
}

export function findSscCglSubject(
  taxonomy: SscCglStageTaxonomy,
  subjectSlug: string,
): SscCglSubject | null {
  return taxonomy.subjects.find((subject) => subject.slug === subjectSlug) ?? null;
}

export function findSscCglTopic(
  subject: SscCglSubject,
  topicSlug: string,
): SscCglTopic | null {
  return subject.topics.find((topic) => topic.slug === topicSlug) ?? null;
}

const EMPTY_PROGRESS = {
  attempted_count: 0,
  correct_count: 0,
  wrong_count: 0,
  total_time_spent_seconds: 0,
  average_time_spent_seconds: 0,
};

/** Converts a stage-scoped view hierarchy into the existing question-catalog mapping contract. */
export function sscCglTaxonomyToLearningHierarchy(taxonomy: SscCglStageTaxonomy): {
  subjects: ExamLearningSubject[];
  topics: ExamLearningTopic[];
  subtopics: ExamLearningSubtopic[];
} {
  const subjects: ExamLearningSubject[] = taxonomy.subjects.map((subject) => ({
    id: subject.id,
    slug: subject.slug,
    title: subject.title,
    description: subject.description,
    icon_key: null,
    hero_image_url: null,
    sort_order: subject.sortOrder,
    topic_count: subject.topics.length,
    subtopic_count: subject.topics.reduce((total, topic) => total + topic.subtopics.length, 0),
    question_count: 0,
    ...EMPTY_PROGRESS,
  }));
  const topics: ExamLearningTopic[] = taxonomy.subjects.flatMap((subject) =>
    subject.topics.map((topic) => ({
      id: topic.id,
      subject_id: subject.id,
      slug: topic.slug,
      title: topic.title,
      description: topic.description,
      scope: null,
      icon_key: null,
      sort_order: topic.sortOrder,
      priority: topic.sortOrder,
      importance: null,
      is_recommended: false,
      subtopic_count: topic.subtopics.length,
      question_count: 0,
      ...EMPTY_PROGRESS,
    })),
  );
  const subtopics: ExamLearningSubtopic[] = taxonomy.subjects.flatMap((subject) =>
    subject.topics.flatMap((topic) =>
      topic.subtopics.map((subtopic) => ({
        id: subtopic.id,
        subject_id: subject.id,
        topic_id: topic.id,
        slug: subtopic.slug,
        title: subtopic.title,
        description: subtopic.description,
        scope: topic.title,
        sort_order: subtopic.sortOrder,
        priority: subtopic.sortOrder,
        importance: null,
        importance_label: null,
        is_recommended: false,
        question_count: 0,
        ...EMPTY_PROGRESS,
      })),
    ),
  );
  return { subjects, topics, subtopics };
}
