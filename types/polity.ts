export type LocalizedText = {
  en?: string;
  hi?: string;
};

export type LocalizedOptions = {
  en?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  hi?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
};

export type Subject = {
  id: string;
  title: LocalizedText;
  slug: string;
  description: LocalizedText | null;
  icon_key: string | null;
  hero_image_url: string | null;
  sort_order: number | null;
  topic_count: number | null;
  question_count: number | null;
  is_active: boolean;
};

export type Exam = {
  id: string;
  code: string;
  title: LocalizedText;
  description: LocalizedText | null;
  sort_order: number | null;
  is_active: boolean;
};

export type Topic = {
  id: string;
  subject_id: string;
  title: LocalizedText;
  slug: string;
  description: LocalizedText | null;
  icon_key: string | null;
  sort_order: number | null;
  subtopic_count: number | null;
  question_count: number | null;
  is_active: boolean;
};

export type TopicWithPriority = {
  id: string;
  title: LocalizedText;
  slug: string;
  description: LocalizedText | null;
  icon_key: string | null;
  subtopic_count: number | null;
  question_count: number | null;
  priority: number;
  importance: LocalizedText | string | null;
  is_recommended: boolean;
};

export type Subtopic = {
  id: string;
  topic_id: string;
  title: LocalizedText;
  slug: string;
  description: LocalizedText | null;
  sort_order: number | null;
  question_count: number | null;
  is_active: boolean;
};

export type SubtopicWithExamPriority = Subtopic & {
  /** 1-based rank within topic for selected exam (derived from subtopic_exam_priority order). */
  priority?: number;
  /** Raw priority value from subtopic_exam_priority (used for sorting). */
  exam_priority?: number;
  importance?: string | null;
  importance_label?: LocalizedText | null;
  is_recommended?: boolean;
};

export type Question = {
  id: string;
  question_text: LocalizedText;
  options: LocalizedOptions;
  correct_option: string;
  explanation: LocalizedText;
  difficulty: string | null;
  source: string | null;
  year: number | null;
  pyq_exam_name: string | null;
  exam_tags: string[] | null;
};

/** Public question payload — never includes correct_option or explanation before submit. */
export type PublicQuestion = {
  id: string;
  question_text: LocalizedText;
  options: LocalizedOptions;
  difficulty: string | null;
  source: string | null;
  year: number | null;
  pyq_exam_name: string | null;
  exam_tags: string[] | null;
  attempt_count: number;
  correct_count: number;
};

/** Cursor-paginated public question batch (no answer key fields). */
export type QuestionBatchPage = {
  questions: PublicQuestion[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type OptionKey = 'A' | 'B' | 'C' | 'D';
