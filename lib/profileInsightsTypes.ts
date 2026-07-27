import type { LocalizedText } from '@/types/polity';

export type InsightsSubjectRow = {
  subject_id: string;
  subject_title: LocalizedText;
  subject_slug: string;
  unique_questions: number;
  accuracy_percent: number;
  locked: boolean;
};

export type InsightsCoverageSummary = {
  unit_label: 'topics';
  total: number;
  completed: number;
  in_progress: number;
  not_started: number;
  has_plan: boolean;
};

export type InsightsTopicRow = {
  topic_id: string;
  topic_title: LocalizedText;
  topic_slug: string;
  subject_slug: string;
  progress_percent: number;
  unique_questions: number;
  total_questions: number;
  status: 'completed' | 'in_progress' | 'not_started';
};

export type InsightsFocusSubject = {
  subject_id: string;
  subject_title: LocalizedText;
  subject_slug: string;
};

export type InsightsStrongArea = {
  topic_title: LocalizedText;
  topic_slug: string;
  subject_slug: string;
  accuracy_percent: number;
  unique_questions: number;
  practice_href: string;
} | null;

export type InsightsFocusNext = {
  topic_title: LocalizedText;
  topic_slug: string;
  subject_slug: string;
  accuracy_percent: number;
  mistakes_due: number;
  unique_questions: number;
  practice_href: string;
} | null;

export type InsightsDifficultyRow = {
  key: 'basic' | 'intermediate' | 'advanced';
  label_en: string;
  label_hi: string;
  accuracy_percent: number | null;
  unique_questions: number;
  insufficient_data: boolean;
};

export type ProfileInsightsData = {
  target_exam: string | null;
  coverage: InsightsCoverageSummary;
  subjects: InsightsSubjectRow[];
  focus_subject: InsightsFocusSubject | null;
  focus_topics: InsightsTopicRow[];
  strong_area: InsightsStrongArea;
  focus_next: InsightsFocusNext;
  by_difficulty: InsightsDifficultyRow[];
  has_any_attempts: boolean;
};
