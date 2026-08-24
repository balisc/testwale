import type { ExamSelectorOption } from '@/lib/examSelector';

export type ExactExamMappingCounts = {
  activeSubjectCount: number;
  activeTopicCount: number;
  activeSubtopicCount: number;
  verifiedQuestionCount: number;
};

export type ExamReadinessInput = {
  profileActive: boolean;
  profileSelectable?: boolean;
  administrativelyDisabled: boolean;
  scopeReady?: boolean;
  contentExamId: string | null;
  currentPublishedVersionCount?: number;
  hierarchyValid?: boolean;
  stageMappingComplete?: boolean;
  counts: ExactExamMappingCounts;
};

export type ExamReadiness = {
  canSelect: boolean;
  isComingSoon: boolean;
  availabilityReason:
    | 'ready'
    | 'profile_inactive'
    | 'profile_not_selectable'
    | 'administratively_disabled'
    | 'scope_not_ready'
    | 'content_family_unmapped'
    | 'current_published_syllabus_missing'
    | 'multiple_current_published_syllabi'
    | 'subject_mapping_missing'
    | 'topic_mapping_missing'
    | 'subtopic_mapping_missing'
    | 'broken_hierarchy'
    | 'stage_mapping_incomplete'
    | 'verified_questions_missing';
};

export function deriveExamReadiness(input: ExamReadinessInput): ExamReadiness {
  let availabilityReason: ExamReadiness['availabilityReason'] = 'ready';
  if (!input.profileActive) availabilityReason = 'profile_inactive';
  else if (input.profileSelectable === false) availabilityReason = 'profile_not_selectable';
  else if (input.administrativelyDisabled) availabilityReason = 'administratively_disabled';
  else if (input.scopeReady === false) availabilityReason = 'scope_not_ready';
  else if (!input.contentExamId) availabilityReason = 'content_family_unmapped';
  else if (input.currentPublishedVersionCount === 0) availabilityReason = 'current_published_syllabus_missing';
  else if ((input.currentPublishedVersionCount ?? 1) > 1) availabilityReason = 'multiple_current_published_syllabi';
  else if (input.counts.activeSubjectCount < 1) availabilityReason = 'subject_mapping_missing';
  else if (input.counts.activeTopicCount < 1) availabilityReason = 'topic_mapping_missing';
  else if (input.counts.activeSubtopicCount < 1) availabilityReason = 'subtopic_mapping_missing';
  else if (input.hierarchyValid === false) availabilityReason = 'broken_hierarchy';
  else if (input.stageMappingComplete === false) availabilityReason = 'stage_mapping_incomplete';
  else if (input.counts.verifiedQuestionCount < 1) availabilityReason = 'verified_questions_missing';

  const canSelect = availabilityReason === 'ready';
  return { canSelect, isComingSoon: !canSelect, availabilityReason };
}

export function applyExamReadiness(
  option: ExamSelectorOption,
  input: Omit<ExamReadinessInput, 'contentExamId'>,
): ExamSelectorOption {
  const readiness = deriveExamReadiness({ ...input, contentExamId: option.content_exam_id });
  return {
    ...option,
    can_select: readiness.canSelect,
    is_coming_soon: readiness.isComingSoon,
    availability_reason: readiness.availabilityReason,
    active_subject_count: input.counts.activeSubjectCount,
    active_topic_count: input.counts.activeTopicCount,
    active_subtopic_count: input.counts.activeSubtopicCount,
    verified_question_count: input.counts.verifiedQuestionCount,
  };
}
