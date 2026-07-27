export type ProfileTabId = 'overview' | 'insights' | 'activity' | 'saved' | 'goals';

/** Temporary rollout gate — only Overview is public until other tabs are re-enabled. */
export const PROFILE_TAB_ENABLED: Record<ProfileTabId, boolean> = {
  overview: true,
  insights: false,
  activity: false,
  saved: false,
  goals: false,
};

export function isProfileTabEnabled(tab: ProfileTabId): boolean {
  return PROFILE_TAB_ENABLED[tab];
}

export function profileTabHref(tab: ProfileTabId): string | null {
  if (!isProfileTabEnabled(tab)) return null;
  switch (tab) {
    case 'insights':
      return '/profile/insights';
    case 'activity':
      return '/profile/activity';
    case 'saved':
      return '/profile/saved';
    case 'goals':
      return '/profile/goals';
    default:
      return '/profile';
  }
}

export function profileTabRedirectPath(tab: ProfileTabId): string {
  return profileTabHref(tab) ?? '/profile';
}
