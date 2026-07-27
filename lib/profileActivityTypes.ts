export type ActivityPeriodDays = 7 | 30 | 90 | 'all';

export type ActivitySummaryMetrics = {
  unique_questions: number;
  correct: number;
  incorrect: number;
  avg_answer_seconds: number | null;
  has_recorded_time: boolean;
};

export type ActivityAccuracyTrendPoint = {
  key: string;
  label: string;
  accuracy_percent: number | null;
  attempts: number;
};

export type ActivityAccuracyTrend = {
  current_accuracy_percent: number;
  change_points: number | null;
  points: ActivityAccuracyTrendPoint[];
};

export type ActivityRetryImprovement = {
  locked: boolean;
  cohort_size: number;
  first_attempt_accuracy_percent: number;
  after_retry_accuracy_percent: number;
  improvement_points: number;
  mistakes_corrected: number;
};

export type ActivityTimeConsistency = {
  total_study_seconds: number;
  has_recorded_time: boolean;
  active_days: number;
  current_streak_days: number;
  longest_streak_days: number;
  daily_minutes: Array<{ key: string; label: string; minutes: number }>;
};

export type ActivityMixRow = {
  key: string;
  label_en: string;
  label_hi: string;
  count: number;
  percent: number;
};

export type ActivityPracticeMix = {
  difficulty: ActivityMixRow[];
  subjects: ActivityMixRow[];
  exam_tags_omitted: boolean;
};

export type ActivityRecentItem = {
  title: string;
  correct: number;
  total: number;
  accuracy_percent: number;
  duration_seconds: number | null;
  created_at: string;
  href: string | null;
  action: 'view' | 'review' | null;
};

export type ProfileActivityData = {
  period: ActivityPeriodDays;
  has_genuine_sessions: false;
  summary: ActivitySummaryMetrics;
  accuracy_trend: ActivityAccuracyTrend;
  retry_improvement: ActivityRetryImprovement;
  time_consistency: ActivityTimeConsistency;
  practice_mix: ActivityPracticeMix;
  recent_activity: ActivityRecentItem[];
  has_any_attempts: boolean;
};
