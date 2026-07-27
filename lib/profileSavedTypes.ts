export type SavedQueueBucketKey = 'recent' | 'this_month' | 'older';

export type SavedQueueBucket = {
  key: SavedQueueBucketKey;
  label_en: string;
  label_hi: string;
  count: number;
};

export type SavedRevisionQueue = {
  has_revision_schedule: false;
  title_en: string;
  title_hi: string;
  explanation_en: string;
  explanation_hi: string;
  buckets: SavedQueueBucket[];
  total_actionable: number;
  start_href: string | null;
  start_label_en: string | null;
  start_label_hi: string | null;
};

export type SavedMistakeRecovery = {
  total_mistakes: number;
  recovered_count: number;
  unresolved_count: number;
  recovery_percent: number | null;
  recovered_this_week: number;
  has_mistakes: boolean;
};

export type SavedMistakeStatus = 'recently_missed' | 'incorrect_twice' | 'unresolved';

export type SavedMistakeRow = {
  question_id: string;
  title: string;
  subject_title: string;
  status: SavedMistakeStatus;
  review_href: string | null;
  attempted_at: string;
};

export type SavedLearningCounts = {
  bookmarks: number;
  notes: number;
  reported_questions: number;
  has_recently_viewed: false;
};

export type SavedRecentItemType = 'bookmark' | 'note';

export type SavedRecentItem = {
  id: string;
  type: SavedRecentItemType;
  title: string;
  context: string | null;
  preview: string | null;
  timestamp: string;
  timestamp_label_en: string;
  timestamp_label_hi: string;
  href: string | null;
};

export type ProfileSavedData = {
  has_revision_schedule: false;
  revision_queue: SavedRevisionQueue;
  mistake_recovery: SavedMistakeRecovery;
  mistakes_to_review: SavedMistakeRow[];
  saved_learning: SavedLearningCounts;
  recent_saved_items: SavedRecentItem[];
  has_any_data: boolean;
  all_mistakes_recovered: boolean;
  caught_up: boolean;
};
