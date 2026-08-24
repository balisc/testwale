import type { LocalizedText } from '@/types/polity';
import type { UserProgressDashboard } from '@/lib/practiceAnalytics';
import type { PracticeProgress } from '@/lib/practice';

export type ExamLearningExam = {
  id: string;
  profile_id?: string;
  syllabus_version_id?: string;
  syllabus_version_code?: string;
  code: string;
  /** Tag actually stored in questions.exam_tags (for example SSC for SSC_CGL). */
  question_tag?: string;
  title: LocalizedText;
  target_date: string;
};

export type ExamLearningOverview = {
  total_questions: number;
  attempted_count: number;
  correct_count: number;
  wrong_count: number;
  total_time_spent_seconds: number;
  average_time_spent_seconds: number;
  completion_percent: number;
  accuracy_percent: number;
};

type LearningProgressFields = {
  attempted_count: number;
  correct_count: number;
  wrong_count: number;
  total_time_spent_seconds: number;
  average_time_spent_seconds: number;
};

export type ExamLearningSubject = LearningProgressFields & {
  id: string;
  /** Active question-catalog subject backing this published syllabus node. */
  content_id?: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText | null;
  icon_key: string | null;
  hero_image_url: string | null;
  sort_order: number | null;
  topic_count: number;
  subtopic_count: number;
  question_count: number;
};

export type ExamLearningTopic = LearningProgressFields & {
  id: string;
  /** Active question-catalog topic backing this published syllabus node. */
  content_id?: string;
  content_subject_id?: string;
  subject_id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText | null;
  scope?: LocalizedText | null;
  icon_key: string | null;
  sort_order: number | null;
  priority: number | null;
  importance: LocalizedText | string | null;
  is_recommended: boolean;
  subtopic_count: number;
  question_count: number;
};

export type ExamLearningSubtopic = LearningProgressFields & {
  id: string;
  /** Active question-catalog IDs used by question/practice APIs. */
  content_id?: string;
  content_topic_id?: string;
  content_subject_id?: string;
  topic_id: string;
  subject_id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText | null;
  scope?: LocalizedText | null;
  sort_order: number | null;
  priority: number | null;
  importance: string | null;
  importance_label: LocalizedText | null;
  is_recommended: boolean;
  question_count: number;
};

export type ExamLearningAttempt = {
  question_id: string;
  subject_id: string | null;
  topic_id: string | null;
  subtopic_id: string | null;
  is_correct: boolean;
  time_spent_seconds: number | null;
};

export type ExamLearningRecentActivity = {
  question_id: string;
  subject_id: string;
  topic_id: string;
  subtopic_id: string | null;
  is_correct: boolean;
  attempted_at: string;
  question_text: LocalizedText;
  subject_title: LocalizedText;
  topic_title: LocalizedText;
};

export type ExamLearningSnapshot = {
  exam: ExamLearningExam;
  overview: ExamLearningOverview;
  subjects: ExamLearningSubject[];
  topics: ExamLearningTopic[];
  subtopics: ExamLearningSubtopic[];
  recent_activity: ExamLearningRecentActivity[];
};

function attemptMetrics(rows: ExamLearningAttempt[]): LearningProgressFields {
  const questions = new Map<string, boolean>();
  let totalTime = 0;
  let timedAttempts = 0;

  for (const row of rows) {
    questions.set(row.question_id, (questions.get(row.question_id) ?? false) || row.is_correct);
    if (Number.isFinite(row.time_spent_seconds) && (row.time_spent_seconds ?? -1) >= 0) {
      totalTime += Math.round(row.time_spent_seconds!);
      timedAttempts += 1;
    }
  }

  const attempted = questions.size;
  const correct = [...questions.values()].filter(Boolean).length;
  return {
    attempted_count: attempted,
    correct_count: correct,
    wrong_count: attempted - correct,
    total_time_spent_seconds: totalTime,
    average_time_spent_seconds:
      timedAttempts > 0 ? Math.round((totalTime / timedAttempts) * 100) / 100 : 0,
  };
}

/** Applies persisted attempt history to the published exam hierarchy. */
export function applyAttemptHistoryToSnapshot(
  snapshot: ExamLearningSnapshot,
  attempts: ExamLearningAttempt[],
): ExamLearningSnapshot {
  const allowedSubtopics = new Set(
    snapshot.subtopics.map((row) => row.content_id).filter((id): id is string => Boolean(id)),
  );
  const scoped = attempts.filter(
    (row) => row.subtopic_id != null && allowedSubtopics.has(row.subtopic_id),
  );
  const overviewMetrics = attemptMetrics(scoped);

  const subjects = snapshot.subjects.map((row) => ({
    ...row,
    ...attemptMetrics(scoped.filter((attempt) => attempt.subject_id === row.content_id)),
  }));
  const topics = snapshot.topics.map((row) => ({
    ...row,
    ...attemptMetrics(scoped.filter((attempt) => attempt.topic_id === row.content_id)),
  }));
  const subtopics = snapshot.subtopics.map((row) => ({
    ...row,
    ...attemptMetrics(scoped.filter((attempt) => attempt.subtopic_id === row.content_id)),
  }));

  return {
    ...snapshot,
    overview: {
      ...snapshot.overview,
      ...overviewMetrics,
      completion_percent: progressPercent(overviewMetrics.attempted_count, snapshot.overview.total_questions),
      accuracy_percent: accuracy(overviewMetrics.correct_count, overviewMetrics.attempted_count),
    },
    subjects,
    topics,
    subtopics,
  };
}

export function entityIsIncluded(
  snapshot: ExamLearningSnapshot,
  entity: 'subject' | 'topic' | 'subtopic',
  id: string,
): boolean {
  const rows =
    entity === 'subject'
      ? snapshot.subjects
      : entity === 'topic'
        ? snapshot.topics
        : snapshot.subtopics;
  return rows.some((row) => row.id === id || row.content_id === id);
}

export function progressPercent(attempted: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((Math.max(0, attempted) * 10000) / total) / 100);
}

function accuracy(correct: number, attempted: number): number {
  return attempted > 0 ? Math.round((correct * 10000) / attempted) / 100 : 0;
}

export function snapshotToProgressDashboard(snapshot: ExamLearningSnapshot): UserProgressDashboard {
  return {
    overview: {
      total_attempts: snapshot.overview.attempted_count,
      unique_questions_attempted: snapshot.overview.attempted_count,
      correct_count: snapshot.overview.correct_count,
      wrong_count: snapshot.overview.wrong_count,
      accuracy_percent: snapshot.overview.accuracy_percent,
      total_time_spent_seconds: snapshot.overview.total_time_spent_seconds,
      average_time_spent_seconds: snapshot.overview.average_time_spent_seconds,
    },
    by_subject: snapshot.subjects.map((row) => ({
      subject_id: row.id, subject_title: row.title, subject_slug: row.slug,
      attempts_count: row.attempted_count, unique_questions_count: row.attempted_count,
      correct_count: row.correct_count, wrong_count: row.wrong_count,
      accuracy_percent: accuracy(row.correct_count, row.attempted_count),
      total_time_spent_seconds: row.total_time_spent_seconds,
      average_time_spent_seconds: row.average_time_spent_seconds,
    })),
    by_topic: snapshot.topics.map((row) => {
      const subject = snapshot.subjects.find((item) => item.id === row.subject_id);
      return {
        topic_id: row.id, subject_id: row.subject_id, topic_title: row.title, topic_slug: row.slug,
        subject_title: subject?.title ?? {}, subject_slug: subject?.slug ?? null,
        attempts_count: row.attempted_count, unique_questions_count: row.attempted_count,
        correct_count: row.correct_count, wrong_count: row.wrong_count,
        accuracy_percent: accuracy(row.correct_count, row.attempted_count),
        total_time_spent_seconds: row.total_time_spent_seconds,
        average_time_spent_seconds: row.average_time_spent_seconds,
      };
    }),
    by_subtopic: snapshot.subtopics.map((row) => {
      const topic = snapshot.topics.find((item) => item.id === row.topic_id);
      const subject = snapshot.subjects.find((item) => item.id === row.subject_id);
      return {
        subtopic_id: row.id, topic_id: row.topic_id, subject_id: row.subject_id,
        subtopic_title: row.title, subtopic_slug: row.slug,
        topic_title: topic?.title ?? {}, topic_slug: topic?.slug ?? null,
        subject_title: subject?.title ?? {}, subject_slug: subject?.slug ?? null,
        attempts_count: row.attempted_count, unique_questions_count: row.attempted_count,
        correct_count: row.correct_count, wrong_count: row.wrong_count,
        accuracy_percent: accuracy(row.correct_count, row.attempted_count),
        total_time_spent_seconds: row.total_time_spent_seconds,
        average_time_spent_seconds: row.average_time_spent_seconds,
      };
    }),
    recent_attempts: snapshot.recent_activity.map((row) => {
      const subtopic = snapshot.subtopics.find((item) => item.id === row.subtopic_id);
      return {
        id: `${row.question_id}:${row.attempted_at}`, question_id: row.question_id,
        question_text: row.question_text, subject_id: row.subject_id, subject_title: row.subject_title,
        topic_id: row.topic_id, topic_title: row.topic_title, subtopic_id: row.subtopic_id,
        subtopic_title: subtopic?.title ?? {}, selected_option: '', correct_option: '',
        is_correct: row.is_correct, attempted_at: row.attempted_at, time_spent_seconds: null,
      };
    }),
  };
}

export function snapshotToPracticeProgress(
  snapshot: ExamLearningSnapshot,
  scope: { subjectId?: string | null; topicId?: string | null; subtopicId?: string | null },
): PracticeProgress | null {
  const selectedRow = scope.subtopicId
    ? snapshot.subtopics.find((row) => row.id === scope.subtopicId || row.content_id === scope.subtopicId)
    : scope.topicId
      ? snapshot.topics.find((row) => row.id === scope.topicId || row.content_id === scope.topicId)
      : scope.subjectId
        ? snapshot.subjects.find((row) => row.id === scope.subjectId || row.content_id === scope.subjectId)
        : null;
  if ((scope.subjectId || scope.topicId || scope.subtopicId) && !selectedRow) return null;
  const attempted = selectedRow?.attempted_count ?? snapshot.overview.attempted_count;
  const correct = selectedRow?.correct_count ?? snapshot.overview.correct_count;
  return {
    attempted,
    correct,
    wrong: Math.max(0, attempted - correct),
    accuracy: accuracy(correct, attempted),
    bySubject: snapshot.subjects.map((row) => ({
      subject_id: row.id, attempted: row.attempted_count, correct: row.correct_count,
      accuracy: accuracy(row.correct_count, row.attempted_count),
    })),
    byTopic: snapshot.topics.map((row) => ({
      topic_id: row.id, attempted: row.attempted_count, correct: row.correct_count,
      accuracy: accuracy(row.correct_count, row.attempted_count),
    })),
  };
}
