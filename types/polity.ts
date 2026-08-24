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
  /** Human-readable syllabus coverage shown below the topic title. */
  scope?: LocalizedText | null;
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
  /** Human-readable syllabus coverage shown below the topic title. */
  scope?: LocalizedText | null;
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
  /** Broader syllabus context shown below the subtopic title. */
  scope?: LocalizedText | null;
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

/** Structured official/reference entry from questions.source_metadata. */
export type VerifiedSource = {
  title?: string;
  institution?: string;
  url?: string;
  citation?: string | null;
};

/** JSONB payload on questions.source_metadata (Topic 3+ professional format). */
export type SourceMetadata = {
  primary_sources?: VerifiedSource[];
  secondary_sources?: VerifiedSource[];
  evidence_locator?: string;
  confidence?: string;
  source_text?: string;
  relevance_note?: string;
};

export type Question = {
  id: string;
  question_text: LocalizedText;
  options: LocalizedOptions;
  correct_option: string;
  explanation: LocalizedText;
  difficulty: string | null;
  source: string | null;
  source_metadata: SourceMetadata | null;
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
  source_metadata: SourceMetadata | null;
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
