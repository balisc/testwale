import type { LocalizedText } from '@/types/polity';

/** Live public.exam_selector_options row shape (verified against PostgREST schema). */
export type ExamSelectorOptionRow = {
  exam_profile_id: string;
  content_exam_id: string | null;
  exam_code: string;
  exam_slug: string;
  official_title: LocalizedText | string | null;
  short_name: string | null;
  display_title: LocalizedText | string | null;
  family_code: string | null;
  content_family_code: string | null;
  conducting_body: string | null;
  profile_category: string | null;
  product_group: string | null;
  recurrence_status: string | null;
  scope_status: string | null;
  can_select: boolean;
  is_coming_soon: boolean;
  availability_reason: string | null;
  sort_order: number | null;
  active_subject_count?: number | null;
  active_topic_count?: number | null;
  active_subtopic_count?: number | null;
  verified_question_count?: number | null;
};

/** Onboarding-related fields exposed by public.user_profiles. */
export type UserProfileOnboardingRow = {
  target_exam_profile_id: string | null;
  target_exam_id: string | null;
  exam_date: string | null;
  exam_onboarding_required: boolean | null;
  exam_onboarding_completed_at: string | null;
};

/** Server-only public.user_exam_preferences row (custom-cookie auth ownership). */
export type UserExamPreferenceRow = {
  user_id: string;
  exam_profile_id: string;
  preferred_tier_code: 'TIER_I' | 'TIER_II' | null;
  preferred_stage_code: string;
  preparation_mode: 'MCQ' | 'WRITTEN';
  created_at: string;
  updated_at: string;
};

/** Published exact-exam syllabus tables used by authenticated learner routes. */
export type ExamSyllabusVersionRow = {
  id: string;
  exam_profile_id: string;
  version_code: string;
  publication_status: string;
  is_current: boolean;
  title: LocalizedText | string | null;
};

export type ExamSyllabusNodeRow = {
  id: string;
  syllabus_version_id: string;
  parent_node_id: string | null;
  node_code: string;
  node_type: string;
  title: LocalizedText | string | null;
  description: LocalizedText | string | null;
  sort_order: number | null;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
};
