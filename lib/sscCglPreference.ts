export const SSC_CGL_PREFERENCE_TIERS = ['TIER_I', 'TIER_II'] as const;
export const SSC_CGL_EXAM_CODE = 'SSC_CGL';

export type SscCglPreferenceTier = (typeof SSC_CGL_PREFERENCE_TIERS)[number];
export type SscCglPreferenceStage =
  | 'TIER_I'
  | 'TIER_II_PAPER_I'
  | 'TIER_II_PAPER_II'
  | 'TIER_II_PAPER_III';

export type SscCglPreference = {
  tierCode: SscCglPreferenceTier;
  stageCode: SscCglPreferenceStage;
  updatedAt: string;
};

export type SscCglTierAvailability = {
  tierCode: SscCglPreferenceTier;
  defaultStageCode: SscCglPreferenceStage;
  verifiedQuestionCount: number;
  isAvailable: boolean;
};

export const EMPTY_SSC_CGL_TIER_AVAILABILITY: SscCglTierAvailability[] = [
  {
    tierCode: 'TIER_I',
    defaultStageCode: 'TIER_I',
    verifiedQuestionCount: 0,
    isAvailable: false,
  },
  {
    tierCode: 'TIER_II',
    defaultStageCode: 'TIER_II_PAPER_I',
    verifiedQuestionCount: 0,
    isAvailable: false,
  },
];

export function isSscCglPreferenceTier(value: unknown): value is SscCglPreferenceTier {
  return typeof value === 'string' && SSC_CGL_PREFERENCE_TIERS.includes(value as SscCglPreferenceTier);
}

export function defaultSscCglStageForTier(tierCode: SscCglPreferenceTier): SscCglPreferenceStage {
  return tierCode === 'TIER_I' ? 'TIER_I' : 'TIER_II_PAPER_I';
}

export function getSscCglPreferenceHref(preference: Pick<SscCglPreference, 'tierCode' | 'stageCode'>): string {
  if (preference.tierCode === 'TIER_I') return '/ssc-cgl/tier-1/subjects';
  if (preference.stageCode === 'TIER_II_PAPER_II') return '/ssc-cgl/tier-2/paper-2/subjects';
  if (preference.stageCode === 'TIER_II_PAPER_III') return '/ssc-cgl/tier-2/paper-3/subjects';
  return '/ssc-cgl/tier-2/paper-1/subjects';
}

export function getSscCglLoginHref(pathname: string | null | undefined): string {
  if (!pathname || (pathname !== '/ssc-cgl' && !pathname.startsWith('/ssc-cgl/'))) return '/login';
  if (pathname === '/ssc-cgl') return `/login?redirect=${encodeURIComponent('/ssc-cgl')}`;

  const authReturn = `/ssc-cgl/auth-return?returnTo=${encodeURIComponent(pathname)}`;
  return `/login?redirect=${encodeURIComponent(authReturn)}`;
}
