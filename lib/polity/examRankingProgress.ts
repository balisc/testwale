import type {
  PolityEntityProgress,
  PolityProgressState,
  PolitySubtopicRankingRow,
  PolityTopicRankingRow,
} from '@/types/polityExamRankingV2';
import type { SubtopicProgressRow, TopicProgressRow, UserProgressDashboard } from '@/lib/practiceAnalytics';

export function deriveProgressState(attempted: number, total: number | null): PolityProgressState {
  const safeAttempted = Math.max(0, attempted);
  const safeTotal = total != null && total > 0 ? total : null;

  if (safeTotal != null) {
    if (safeAttempted >= safeTotal) return 'completed';
    if (safeAttempted > 0) return 'in_progress';
    return 'not_started';
  }

  if (safeAttempted > 0) return 'in_progress';
  return 'not_started';
}

export function deriveEntityProgress(attempted: number, total: number | null): PolityEntityProgress {
  const state = deriveProgressState(attempted, total);
  const percent =
    total != null && total > 0 ? Math.min(100, Math.round((Math.max(0, attempted) / total) * 100)) : null;

  return {
    state,
    attempted: Math.max(0, attempted),
    total: total != null && total > 0 ? total : null,
    percent,
  };
}

export type PolityRankingProgressMaps = {
  byTopicId: Map<string, PolityEntityProgress>;
  bySubtopicId: Map<string, PolityEntityProgress>;
  overall: PolityEntityProgress | null;
};

export function buildRankingProgressMaps(
  dashboard: UserProgressDashboard | null,
  topics: PolityTopicRankingRow[],
  subtopics: PolitySubtopicRankingRow[],
): PolityRankingProgressMaps {
  const byTopicId = new Map<string, PolityEntityProgress>();
  const bySubtopicId = new Map<string, PolityEntityProgress>();

  const topicProgressById = new Map<string, TopicProgressRow>();
  for (const row of dashboard?.by_topic ?? []) {
    if (row.topic_id) topicProgressById.set(row.topic_id, row);
  }

  const subtopicProgressById = new Map<string, SubtopicProgressRow>();
  for (const row of dashboard?.by_subtopic ?? []) {
    if (row.subtopic_id) subtopicProgressById.set(row.subtopic_id, row);
  }

  for (const topic of topics) {
    const progress = topicProgressById.get(topic.topic_id);
    byTopicId.set(
      topic.topic_id,
      deriveEntityProgress(
        progress?.unique_questions_count ?? 0,
        topic.topic.question_count,
      ),
    );
  }

  for (const subtopic of subtopics) {
    const progress = subtopicProgressById.get(subtopic.subtopic_id);
    bySubtopicId.set(
      subtopic.subtopic_id,
      deriveEntityProgress(
        progress?.unique_questions_count ?? 0,
        subtopic.subtopic.question_count,
      ),
    );
  }

  let overall: PolityEntityProgress | null = null;
  if (dashboard) {
    const totalQuestions = subtopics.reduce(
      (sum, row) => sum + Math.max(0, row.subtopic.question_count ?? 0),
      0,
    );
    overall = deriveEntityProgress(
      dashboard.overview.unique_questions_attempted,
      totalQuestions > 0 ? totalQuestions : null,
    );
  }

  return { byTopicId, bySubtopicId, overall };
}

export function resolveTopicActionLabel(
  progress: PolityEntityProgress,
  language: 'en' | 'hi',
): string {
  if (progress.state === 'completed') {
    return language === 'hi' ? 'पुनरावृत्ति' : 'Revise';
  }
  if (progress.state === 'in_progress') {
    return language === 'hi' ? 'अभ्यास' : 'Practice';
  }
  return language === 'hi' ? 'अध्ययन' : 'Study';
}

export function buildPracticeHref(
  subjectSlug: string,
  topicSlug: string,
  subtopicSlug: string | null,
  examCode: string | null,
): string {
  const base = subtopicSlug
    ? `/subjects/${subjectSlug}/${topicSlug}/${subtopicSlug}/practice`
    : `/subjects/${subjectSlug}/${topicSlug}/practice`;
  if (!examCode) return base;
  return `${base}?exam=${encodeURIComponent(examCode)}`;
}

export function buildTopicHref(subjectSlug: string, topicSlug: string, examCode: string | null): string {
  const base = `/subjects/${subjectSlug}/${topicSlug}`;
  if (!examCode) return base;
  return `${base}?exam=${encodeURIComponent(examCode)}`;
}

export function buildRevisionHref(
  subjectSlug: string,
  topicSlug: string,
  subtopicSlug: string,
  examCode: string | null,
  published: boolean,
): string | null {
  if (!published) return null;
  const base = `/subjects/${subjectSlug}/${topicSlug}/${subtopicSlug}/revision`;
  if (!examCode) return base;
  return `${base}?exam=${encodeURIComponent(examCode)}`;
}
