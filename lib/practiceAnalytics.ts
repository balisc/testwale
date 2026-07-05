import type { LocalizedText } from '@/types/polity';

export type AttemptOverview = {
  total_attempts: number;
  unique_questions_attempted: number;
  correct_count: number;
  wrong_count: number;
  accuracy_percent: number;
};

export type SubjectProgressRow = {
  subject_id: string | null;
  subject_title: LocalizedText;
  subject_slug: string | null;
  attempts_count: number;
  unique_questions_count: number;
  correct_count: number;
  wrong_count: number;
  accuracy_percent: number;
};

export type TopicProgressRow = {
  topic_id: string | null;
  subject_id: string | null;
  topic_title: LocalizedText;
  topic_slug: string | null;
  subject_title: LocalizedText;
  subject_slug: string | null;
  attempts_count: number;
  unique_questions_count: number;
  correct_count: number;
  wrong_count: number;
  accuracy_percent: number;
};

export type SubtopicProgressRow = {
  subtopic_id: string | null;
  topic_id: string | null;
  subject_id: string | null;
  subtopic_title: LocalizedText;
  subtopic_slug: string | null;
  topic_title: LocalizedText;
  topic_slug: string | null;
  subject_title: LocalizedText;
  subject_slug: string | null;
  attempts_count: number;
  unique_questions_count: number;
  correct_count: number;
  wrong_count: number;
  accuracy_percent: number;
};

export type RecentAttemptRow = {
  id: string;
  question_id: string;
  question_text: LocalizedText;
  subject_id: string | null;
  subject_title: LocalizedText;
  topic_id: string | null;
  topic_title: LocalizedText;
  subtopic_id: string | null;
  subtopic_title: LocalizedText;
  selected_option: string;
  correct_option: string;
  is_correct: boolean;
  attempted_at: string;
};

export type UserProgressDashboard = {
  overview: AttemptOverview;
  by_subject: SubjectProgressRow[];
  by_topic: TopicProgressRow[];
  by_subtopic: SubtopicProgressRow[];
  recent_attempts: RecentAttemptRow[];
};

export type RecordQuestionAttemptInput = {
  questionId: string;
  subjectId?: string | null;
  topicId?: string | null;
  subtopicId?: string | null;
  selectedOption: string;
  correctOption: string;
  isCorrect: boolean;
  timeSpentSeconds?: number | null;
};

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeOverview(raw: Record<string, unknown> | null | undefined): AttemptOverview {
  return {
    total_attempts: toNumber(raw?.total_attempts),
    unique_questions_attempted: toNumber(raw?.unique_questions_attempted),
    correct_count: toNumber(raw?.correct_count),
    wrong_count: toNumber(raw?.wrong_count),
    accuracy_percent: toNumber(raw?.accuracy_percent),
  };
}

function normalizeSubjectRow(raw: Record<string, unknown>): SubjectProgressRow {
  return {
    subject_id: raw.subject_id != null ? String(raw.subject_id) : null,
    subject_title: (raw.subject_title ?? null) as LocalizedText,
    subject_slug: raw.subject_slug != null ? String(raw.subject_slug) : null,
    attempts_count: toNumber(raw.attempts_count),
    unique_questions_count: toNumber(raw.unique_questions_count),
    correct_count: toNumber(raw.correct_count),
    wrong_count: toNumber(raw.wrong_count),
    accuracy_percent: toNumber(raw.accuracy_percent),
  };
}

function normalizeTopicRow(raw: Record<string, unknown>): TopicProgressRow {
  return {
    topic_id: raw.topic_id != null ? String(raw.topic_id) : null,
    subject_id: raw.subject_id != null ? String(raw.subject_id) : null,
    topic_title: (raw.topic_title ?? null) as LocalizedText,
    topic_slug: raw.topic_slug != null ? String(raw.topic_slug) : null,
    subject_title: (raw.subject_title ?? null) as LocalizedText,
    subject_slug: raw.subject_slug != null ? String(raw.subject_slug) : null,
    attempts_count: toNumber(raw.attempts_count),
    unique_questions_count: toNumber(raw.unique_questions_count),
    correct_count: toNumber(raw.correct_count),
    wrong_count: toNumber(raw.wrong_count),
    accuracy_percent: toNumber(raw.accuracy_percent),
  };
}

function normalizeSubtopicRow(raw: Record<string, unknown>): SubtopicProgressRow {
  return {
    subtopic_id: raw.subtopic_id != null ? String(raw.subtopic_id) : null,
    topic_id: raw.topic_id != null ? String(raw.topic_id) : null,
    subject_id: raw.subject_id != null ? String(raw.subject_id) : null,
    subtopic_title: (raw.subtopic_title ?? null) as LocalizedText,
    subtopic_slug: raw.subtopic_slug != null ? String(raw.subtopic_slug) : null,
    topic_title: (raw.topic_title ?? null) as LocalizedText,
    topic_slug: raw.topic_slug != null ? String(raw.topic_slug) : null,
    subject_title: (raw.subject_title ?? null) as LocalizedText,
    subject_slug: raw.subject_slug != null ? String(raw.subject_slug) : null,
    attempts_count: toNumber(raw.attempts_count),
    unique_questions_count: toNumber(raw.unique_questions_count),
    correct_count: toNumber(raw.correct_count),
    wrong_count: toNumber(raw.wrong_count),
    accuracy_percent: toNumber(raw.accuracy_percent),
  };
}

function normalizeRecentRow(raw: Record<string, unknown>): RecentAttemptRow {
  return {
    id: String(raw.id ?? ''),
    question_id: String(raw.question_id ?? ''),
    question_text: (raw.question_text ?? null) as LocalizedText,
    subject_id: raw.subject_id != null ? String(raw.subject_id) : null,
    subject_title: (raw.subject_title ?? null) as LocalizedText,
    topic_id: raw.topic_id != null ? String(raw.topic_id) : null,
    topic_title: (raw.topic_title ?? null) as LocalizedText,
    subtopic_id: raw.subtopic_id != null ? String(raw.subtopic_id) : null,
    subtopic_title: (raw.subtopic_title ?? null) as LocalizedText,
    selected_option: String(raw.selected_option ?? ''),
    correct_option: String(raw.correct_option ?? ''),
    is_correct: Boolean(raw.is_correct),
    attempted_at: String(raw.attempted_at ?? ''),
  };
}

export function normalizeProgressDashboard(raw: Record<string, unknown>): UserProgressDashboard {
  const overview = normalizeOverview(raw.overview as Record<string, unknown> | undefined);

  const bySubject = Array.isArray(raw.by_subject)
    ? (raw.by_subject as Record<string, unknown>[]).map(normalizeSubjectRow)
    : [];

  const byTopic = Array.isArray(raw.by_topic)
    ? (raw.by_topic as Record<string, unknown>[]).map(normalizeTopicRow)
    : [];

  const bySubtopic = Array.isArray(raw.by_subtopic)
    ? (raw.by_subtopic as Record<string, unknown>[]).map(normalizeSubtopicRow)
    : [];

  const recentAttempts = Array.isArray(raw.recent_attempts)
    ? (raw.recent_attempts as Record<string, unknown>[]).map(normalizeRecentRow)
    : [];

  return {
    overview,
    by_subject: bySubject,
    by_topic: byTopic,
    by_subtopic: bySubtopic,
    recent_attempts: recentAttempts,
  };
}
