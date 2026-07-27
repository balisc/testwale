import type { LocalizedText } from '../types/polity';
import type {
  InsightsCoverageSummary,
  InsightsDifficultyRow,
  InsightsFocusNext,
  InsightsFocusSubject,
  InsightsStrongArea,
  InsightsSubjectRow,
  InsightsTopicRow,
} from './profileInsightsTypes';

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function localizedEn(value: LocalizedText): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.en || value.hi || '';
}

function buildPracticeHref(input: {
  subject_slug?: string | null;
  topic_slug?: string | null;
  subtopic_slug?: string | null;
}): string | null {
  const subject = input.subject_slug?.trim();
  const topic = input.topic_slug?.trim();
  const subtopic = input.subtopic_slug?.trim();
  if (!subject) return null;
  if (subject && topic && subtopic) {
    return `/subjects/${subject}/${topic}/practice/${subtopic}`;
  }
  if (subject && topic) return `/subjects/${subject}/${topic}/practice`;
  return `/subjects/${subject}`;
}

/** Minimum unique first attempts before showing subject/topic insight percentages. */
export const INSIGHTS_MIN_SAMPLE = 10;

/** Minimum unique attempts before classifying a weak/focus topic. */
export const INSIGHTS_MIN_FOCUS_SAMPLE = 5;

/** Minimum accuracy to qualify as a strong area. */
export const INSIGHTS_STRONG_ACCURACY = 75;

/** Maximum accuracy (with enough samples) to qualify as focus next. */
export const INSIGHTS_WEAK_ACCURACY = 50;

export type TopicCatalogRow = {
  id: string;
  subject_id: string;
  title: LocalizedText;
  slug: string;
  question_count: number;
};

export type SubjectCatalogRow = {
  id: string;
  title: LocalizedText;
  slug: string;
};

export type TopicProgressInput = {
  topic_id: string | null;
  subject_id: string | null;
  topic_title: LocalizedText;
  topic_slug: string | null;
  subject_slug: string | null;
  unique_questions_count: number;
  accuracy_percent: number;
  wrong_count: number;
};

export type SubjectProgressInput = {
  subject_id: string | null;
  subject_title: LocalizedText;
  subject_slug: string | null;
  unique_questions_count: number;
  accuracy_percent: number;
};

export type DifficultyAttemptInput = {
  is_correct: boolean;
  difficulty: string | null;
};

export function calcTopicProgressPercent(uniqueAttempted: number, totalQuestions: number): number {
  if (totalQuestions <= 0) {
    return uniqueAttempted > 0 ? 100 : 0;
  }
  return clampPercent(Math.round((uniqueAttempted / totalQuestions) * 100));
}

export function classifyTopicStatus(
  uniqueAttempted: number,
  progressPercent: number,
): 'completed' | 'in_progress' | 'not_started' {
  if (uniqueAttempted <= 0) return 'not_started';
  if (progressPercent >= 100) return 'completed';
  return 'in_progress';
}

export function buildCoverageSummary(
  planTopics: Array<{ uniqueAttempted: number; totalQuestions: number }>,
): InsightsCoverageSummary {
  if (planTopics.length === 0) {
    return {
      unit_label: 'topics',
      total: 0,
      completed: 0,
      in_progress: 0,
      not_started: 0,
      has_plan: false,
    };
  }

  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;

  for (const topic of planTopics) {
    const progress = calcTopicProgressPercent(topic.uniqueAttempted, topic.totalQuestions);
    const status = classifyTopicStatus(topic.uniqueAttempted, progress);
    if (status === 'completed') completed += 1;
    else if (status === 'in_progress') inProgress += 1;
    else notStarted += 1;
  }

  return {
    unit_label: 'topics',
    total: planTopics.length,
    completed,
    in_progress: inProgress,
    not_started: notStarted,
    has_plan: true,
  };
}

export function buildSubjectInsightRows(
  rows: SubjectProgressInput[],
  subjectsById: Map<string, SubjectCatalogRow>,
): InsightsSubjectRow[] {
  return rows
    .filter((row) => row.subject_id && row.subject_slug)
    .map((row) => {
      const catalog = subjectsById.get(row.subject_id!);
      return {
        subject_id: row.subject_id!,
        subject_title: catalog?.title ?? row.subject_title,
        subject_slug: row.subject_slug!,
        unique_questions: row.unique_questions_count,
        accuracy_percent: clampPercent(row.accuracy_percent),
        locked: row.unique_questions_count < INSIGHTS_MIN_SAMPLE,
      };
    })
    .sort((a, b) => b.unique_questions - a.unique_questions);
}

export function pickTopSubjects(rows: InsightsSubjectRow[], limit = 3): InsightsSubjectRow[] {
  return rows.slice(0, limit);
}

export function pickFocusSubject(input: {
  subjects: SubjectProgressInput[];
  subjectsById: Map<string, SubjectCatalogRow>;
  explicitSubjectId?: string | null;
}): InsightsFocusSubject | null {
  const { subjects, subjectsById, explicitSubjectId } = input;

  if (explicitSubjectId) {
    const catalog = subjectsById.get(explicitSubjectId);
    const progress = subjects.find((row) => row.subject_id === explicitSubjectId);
    if (catalog && progress?.subject_slug) {
      return {
        subject_id: explicitSubjectId,
        subject_title: catalog.title,
        subject_slug: progress.subject_slug,
      };
    }
  }

  const ranked = [...subjects]
    .filter((row) => row.subject_id && row.subject_slug)
    .sort((a, b) => b.unique_questions_count - a.unique_questions_count);

  const top = ranked[0];
  if (!top?.subject_id || !top.subject_slug) return null;

  const catalog = subjectsById.get(top.subject_id);
  return {
    subject_id: top.subject_id,
    subject_title: catalog?.title ?? top.subject_title,
    subject_slug: top.subject_slug,
  };
}

export function buildTopicInsightRows(input: {
  catalogTopics: TopicCatalogRow[];
  progressRows: TopicProgressInput[];
  subjectSlug: string;
  limit?: number;
}): InsightsTopicRow[] {
  const progressByTopic = new Map(
    input.progressRows
      .filter((row) => row.topic_id)
      .map((row) => [row.topic_id!, row]),
  );

  const rows = input.catalogTopics
    .filter((topic) => topic.question_count > 0)
    .map((topic) => {
      const progress = progressByTopic.get(topic.id);
      const unique = progress?.unique_questions_count ?? 0;
      const progressPercent = calcTopicProgressPercent(unique, topic.question_count);
      return {
        topic_id: topic.id,
        topic_title: topic.title,
        topic_slug: topic.slug,
        subject_slug: input.subjectSlug,
        progress_percent: progressPercent,
        unique_questions: unique,
        total_questions: topic.question_count,
        status: classifyTopicStatus(unique, progressPercent),
        sortAttempts: unique,
        sortInProgress: progressPercent > 0 && progressPercent < 100 ? 1 : 0,
        sortRecent: 0,
      };
    })
    .sort((a, b) => {
      if (b.sortInProgress !== a.sortInProgress) return b.sortInProgress - a.sortInProgress;
      if (b.sortAttempts !== a.sortAttempts) return b.sortAttempts - a.sortAttempts;
      return b.progress_percent - a.progress_percent;
    })
    .slice(0, input.limit ?? 5)
    .map(({ sortAttempts: _a, sortInProgress: _b, sortRecent: _c, ...row }) => row);

  return rows;
}

export function pickStrongArea(rows: TopicProgressInput[]): InsightsStrongArea {
  const candidate = rows
    .filter(
      (row) =>
        row.topic_slug &&
        row.subject_slug &&
        row.unique_questions_count >= INSIGHTS_MIN_SAMPLE &&
        row.accuracy_percent >= INSIGHTS_STRONG_ACCURACY,
    )
    .sort((a, b) => b.accuracy_percent - a.accuracy_percent || b.unique_questions_count - a.unique_questions_count)[0];

  if (!candidate?.topic_slug || !candidate.subject_slug) return null;

  const href = buildPracticeHref({
    subject_slug: candidate.subject_slug,
    topic_slug: candidate.topic_slug,
  });
  if (!href) return null;

  return {
    topic_title: candidate.topic_title,
    topic_slug: candidate.topic_slug,
    subject_slug: candidate.subject_slug,
    accuracy_percent: clampPercent(candidate.accuracy_percent),
    unique_questions: candidate.unique_questions_count,
    practice_href: href,
  };
}

export function pickFocusNext(rows: TopicProgressInput[]): InsightsFocusNext {
  const withMistakes = rows
    .filter(
      (row) =>
        row.topic_slug &&
        row.subject_slug &&
        row.wrong_count > 0 &&
        row.unique_questions_count >= INSIGHTS_MIN_FOCUS_SAMPLE,
    )
    .sort((a, b) => a.accuracy_percent - b.accuracy_percent || b.wrong_count - a.wrong_count)[0];

  const candidate =
    withMistakes ??
    rows
      .filter(
        (row) =>
          row.topic_slug &&
          row.subject_slug &&
          row.unique_questions_count >= INSIGHTS_MIN_FOCUS_SAMPLE &&
          row.accuracy_percent <= INSIGHTS_WEAK_ACCURACY,
      )
      .sort((a, b) => a.accuracy_percent - b.accuracy_percent)[0];

  if (!candidate?.topic_slug || !candidate.subject_slug) return null;

  const href = buildPracticeHref({
    subject_slug: candidate.subject_slug,
    topic_slug: candidate.topic_slug,
  });
  if (!href) return null;

  return {
    topic_title: candidate.topic_title,
    topic_slug: candidate.topic_slug,
    subject_slug: candidate.subject_slug,
    accuracy_percent: clampPercent(candidate.accuracy_percent),
    mistakes_due: candidate.wrong_count,
    unique_questions: candidate.unique_questions_count,
    practice_href: href,
  };
}

const DIFFICULTY_BUCKETS = ['basic', 'intermediate', 'advanced'] as const;
export type DifficultyBucket = (typeof DIFFICULTY_BUCKETS)[number];

export function normalizeDifficultyBucket(raw: string | null | undefined): DifficultyBucket | null {
  const value = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (!value) return null;
  if (value === 'basic' || value === 'easy' || value === 'foundation') return 'basic';
  if (value === 'intermediate' || value === 'medium' || value === 'standard') return 'intermediate';
  if (value === 'advanced' || value === 'hard') return 'advanced';
  return null;
}

export function buildDifficultyInsights(rows: DifficultyAttemptInput[]): InsightsDifficultyRow[] {
  const labels: Record<DifficultyBucket, { en: string; hi: string }> = {
    basic: { en: 'Basic', hi: 'बुनियादी' },
    intermediate: { en: 'Intermediate', hi: 'मध्यम' },
    advanced: { en: 'Advanced', hi: 'उन्नत' },
  };

  const buckets = new Map<DifficultyBucket, { correct: number; total: number }>();
  for (const key of DIFFICULTY_BUCKETS) {
    buckets.set(key, { correct: 0, total: 0 });
  }

  for (const row of rows) {
    const bucket = normalizeDifficultyBucket(row.difficulty);
    if (!bucket) continue;
    const entry = buckets.get(bucket)!;
    entry.total += 1;
    if (row.is_correct) entry.correct += 1;
  }

  return DIFFICULTY_BUCKETS.map((key) => {
    const entry = buckets.get(key)!;
    const insufficient = entry.total < INSIGHTS_MIN_FOCUS_SAMPLE;
    const accuracy =
      entry.total > 0 ? clampPercent(Math.round((entry.correct * 1000) / entry.total) / 10) : null;
    return {
      key,
      label_en: labels[key].en,
      label_hi: labels[key].hi,
      accuracy_percent: insufficient ? null : accuracy,
      unique_questions: entry.total,
      insufficient_data: insufficient,
    };
  });
}

export function matchExamCodeFromTarget(
  targetExam: string | null,
  exams: Array<{ code: string; title: LocalizedText }>,
): string | null {
  if (!targetExam?.trim()) return null;
  const normalized = targetExam.trim().toUpperCase().replace(/[\s-]+/g, '_');

  for (const exam of exams) {
    const code = exam.code.toUpperCase();
    if (normalized.includes(code) || code.includes(normalized)) return exam.code;
    const title = localizedEn(exam.title).toUpperCase().replace(/[\s-]+/g, '_');
    if (title && (normalized.includes(title) || title.includes(normalized))) return exam.code;
  }

  if (/SSC/i.test(targetExam)) return 'SSC';
  if (/UPSC/i.test(targetExam)) return 'UPSC';
  if (/RAILWAY/i.test(targetExam)) return 'RAILWAY';
  return null;
}
