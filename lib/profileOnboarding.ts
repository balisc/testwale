import type { UserProfileSettings } from '@/lib/profileAnalytics';

export function needsProfileOnboarding(profile: Pick<UserProfileSettings, 'target_exam' | 'exam_date'>): boolean {
  return !profile.target_exam?.trim() || !profile.exam_date?.trim();
}
