export type GoalPeriodKey = 'daily' | 'weekly' | 'monthly';

export type GoalProgressRow = {
  key: GoalPeriodKey;
  label_en: string;
  label_hi: string;
  actual: number;
  target: number;
  percent: number;
  achieved: boolean;
};

export type GoalsAchievementCard = {
  id: string;
  title_en: string;
  title_hi: string;
  progress_label_en: string;
  progress_label_hi: string;
  unlocked: boolean;
  derived: true;
};

export type ProfileGoalsExamTarget = {
  name: string | null;
  exam_date_set: false;
  days_remaining: null;
  days_remaining_label_en: string;
  days_remaining_label_hi: string;
};

export type ProfileGoalsPeerComparison = {
  available: false;
};

export type ProfileGoalsPreferences = {
  display_name: string;
  email_masked: string;
  target_exam: string | null;
  membership_label_en: string;
  membership_label_hi: string;
  membership_available: boolean;
  reminders_supported: false;
  visibility_supported: false;
  joined_label_en: string;
  joined_label_hi: string;
  joined_source: 'users.created_at';
};

export type ProfileGoalsData = {
  goal_rows: GoalProgressRow[];
  goal_progress_note_en: string;
  goal_progress_note_hi: string;
  exam_target: ProfileGoalsExamTarget;
  readiness: {
    score: number | null;
    label: string;
    locked: boolean;
    percent: number | null;
    explanation_en: string;
    explanation_hi: string;
  };
  achievements: GoalsAchievementCard[];
  next_milestone_en: string | null;
  next_milestone_hi: string | null;
  peer_comparison: ProfileGoalsPeerComparison;
  preferences: ProfileGoalsPreferences;
  targets: {
    daily_goal: number;
    weekly_goal: number;
    monthly_goal: number;
  };
  has_attempts: boolean;
};
