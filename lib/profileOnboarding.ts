import type { UserProfileSettings } from '@/lib/profileAnalytics';
import { needsExamOnboarding } from '@/lib/examOnboarding';

export function needsProfileOnboarding(
  profile: Pick<UserProfileSettings, 'exam_onboarding_required' | 'exam_onboarding_completed_at'>,
): boolean {
  return needsExamOnboarding({
    required: profile.exam_onboarding_required,
    completedAt: profile.exam_onboarding_completed_at,
    targetExamProfileId: null,
    targetExamId: null,
    targetExamDate: null,
  });
}
