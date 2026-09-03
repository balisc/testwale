import type {
  ExamLearningSnapshot,
  ExamLearningSubject,
  ExamLearningSubtopic,
  ExamLearningTopic,
} from '@/lib/examLearning';
import type { SavedExamPreference } from '@/lib/examPreference';
import type { LocalizedText } from '@/types/polity';

export const SSC_CHSL_EXAM_CODE = 'SSC_CHSL';
export const SSC_CHSL_EXAM_SLUG = 'ssc-combined-higher-secondary-level-examination';

export type SscChslStageCode = 'TIER_I' | 'TIER_II';

export type SscChslStageDefinition = {
  code: SscChslStageCode;
  tag: 'SSC_CHSL_TIER_1' | 'SSC_CHSL_TIER_2';
  tier: 'tier-1' | 'tier-2';
  href: string;
  label: LocalizedText;
  description: LocalizedText;
};

export const SSC_CHSL_STAGES = [
  {
    code: 'TIER_I',
    tag: 'SSC_CHSL_TIER_1',
    tier: 'tier-1',
    href: '/ssc-chsl/tier-1/subjects',
    label: { en: 'Tier 1', hi: 'टियर 1' },
    description: {
      en: 'Computer Based Examination covering Reasoning, Mathematics, English and General Awareness.',
      hi: 'रीजनिंग, गणित, अंग्रेज़ी और सामान्य जागरूकता की कंप्यूटर आधारित परीक्षा।',
    },
  },
  {
    code: 'TIER_II',
    tag: 'SSC_CHSL_TIER_2',
    tier: 'tier-2',
    href: '/ssc-chsl/tier-2/subjects',
    label: { en: 'Tier 2', hi: 'टियर 2' },
    description: {
      en: 'Objective sections plus the qualifying Computer Knowledge and Skill/Typing Test scope.',
      hi: 'वस्तुनिष्ठ अनुभागों के साथ अर्हकारी कंप्यूटर ज्ञान और कौशल/टंकण परीक्षा का दायरा।',
    },
  },
] as const satisfies readonly SscChslStageDefinition[];

export type SscChslStageSnapshot = {
  stage: SscChslStageDefinition;
  snapshot: ExamLearningSnapshot;
};

export type SscChslStageAvailability = {
  stageCode: SscChslStageCode;
  verifiedQuestionCount: number;
  isAvailable: boolean;
};

export type SscChslRoute =
  | { kind: 'subjects'; stage: SscChslStageDefinition }
  | { kind: 'topics'; stage: SscChslStageDefinition; subjectSlug: string }
  | {
      kind: 'subtopics';
      stage: SscChslStageDefinition;
      subjectSlug: string;
      topicSlug: string;
    }
  | {
      kind: 'questions';
      stage: SscChslStageDefinition;
      subjectSlug: string;
      topicSlug: string;
      subtopicSlug: string;
    };

export function isSscChslExamCode(value: string | null | undefined): boolean {
  return String(value ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_') === SSC_CHSL_EXAM_CODE;
}

export function getSscChslStageByCode(
  code: string | null | undefined,
): SscChslStageDefinition | null {
  return SSC_CHSL_STAGES.find((stage) => stage.code === code) ?? null;
}

export function parseSscChslRoute(path: readonly string[]): SscChslRoute | null {
  const stage = SSC_CHSL_STAGES.find((candidate) => candidate.tier === path[0]);
  if (!stage) return null;

  const remaining = path.slice(1).map((segment) => segment.trim().toLowerCase());
  if (remaining.some((segment) => !segment)) return null;
  if (remaining.length === 1 && remaining[0] === 'subjects') {
    return { kind: 'subjects', stage };
  }
  if (remaining.length === 3 && remaining[0] === 'subjects' && remaining[2] === 'topics') {
    return { kind: 'topics', stage, subjectSlug: remaining[1]! };
  }
  if (
    remaining.length === 5
    && remaining[0] === 'subjects'
    && remaining[2] === 'topics'
    && remaining[4] === 'subtopics'
  ) {
    return {
      kind: 'subtopics',
      stage,
      subjectSlug: remaining[1]!,
      topicSlug: remaining[3]!,
    };
  }
  if (
    remaining.length === 7
    && remaining[0] === 'subjects'
    && remaining[2] === 'topics'
    && remaining[4] === 'subtopics'
    && remaining[6] === 'questions'
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

export function getSscChslLegacyRedirect(path: readonly string[]): string | null {
  const stage = SSC_CHSL_STAGES.find((candidate) => candidate.tier === path[0]);
  if (!stage) return null;
  const remaining = path.slice(1).map((segment) => segment.trim().toLowerCase());
  if (remaining.some((segment) => !segment)) return null;
  if (remaining.length === 0) return stage.href;
  const canonicalSegments = new Set(['subjects', 'topics', 'subtopics', 'questions']);
  if (remaining.some((segment) => canonicalSegments.has(segment))) return null;
  if (remaining.length === 1) return getSscChslTopicsHref(stage, remaining[0]!);
  if (remaining.length === 2) {
    return getSscChslSubtopicsHref(stage, remaining[0]!, remaining[1]!);
  }
  if (remaining.length === 3) {
    return getSscChslQuestionsHref(stage, remaining[0]!, remaining[1]!, remaining[2]!);
  }
  return null;
}

export function getSscChslTopicsHref(stage: SscChslStageDefinition, subjectSlug: string): string {
  return `${stage.href}/${subjectSlug}/topics`;
}

export function getSscChslSubtopicsHref(
  stage: SscChslStageDefinition,
  subjectSlug: string,
  topicSlug: string,
): string {
  return `${getSscChslTopicsHref(stage, subjectSlug)}/${topicSlug}/subtopics`;
}

export function getSscChslQuestionsHref(
  stage: SscChslStageDefinition,
  subjectSlug: string,
  topicSlug: string,
  subtopicSlug: string,
): string {
  return `${getSscChslSubtopicsHref(stage, subjectSlug, topicSlug)}/${subtopicSlug}/questions`;
}

export function findSscChslSubject(
  snapshot: ExamLearningSnapshot,
  subjectSlug: string,
): ExamLearningSubject | null {
  return snapshot.subjects.find((subject) => subject.slug === subjectSlug) ?? null;
}

export function findSscChslTopic(
  snapshot: ExamLearningSnapshot,
  subject: ExamLearningSubject,
  topicSlug: string,
): ExamLearningTopic | null {
  return snapshot.topics.find(
    (topic) => topic.subject_id === subject.id && topic.slug === topicSlug,
  ) ?? null;
}

export function findSscChslSubtopic(
  snapshot: ExamLearningSnapshot,
  subject: ExamLearningSubject,
  topic: ExamLearningTopic,
  subtopicSlug: string,
): ExamLearningSubtopic | null {
  return snapshot.subtopics.find(
    (subtopic) => subtopic.subject_id === subject.id
      && subtopic.topic_id === topic.id
      && subtopic.slug === subtopicSlug,
  ) ?? null;
}

export function getSscChslPreferenceHref(
  preference: Pick<SavedExamPreference, 'stageCode'>,
): string {
  return preference.stageCode === 'TIER_II'
    ? SSC_CHSL_STAGES[1].href
    : SSC_CHSL_STAGES[0].href;
}

export function getSscChslLoginHref(pathname: string | null | undefined): string {
  if (!pathname || (pathname !== '/ssc-chsl' && !pathname.startsWith('/ssc-chsl/'))) {
    return '/login';
  }
  if (pathname === '/ssc-chsl') return `/login?redirect=${encodeURIComponent('/ssc-chsl')}`;
  const authReturn = `/ssc-chsl/auth-return?returnTo=${encodeURIComponent(pathname)}`;
  return `/login?redirect=${encodeURIComponent(authReturn)}`;
}
