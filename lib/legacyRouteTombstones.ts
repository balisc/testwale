/**
 * Verified legacy quiz URLs whose content was permanently removed and which
 * have no semantically equivalent published catalogue destination.
 *
 * Keep this migration list narrow. New catalogue URLs must never be inferred
 * from a similar title; add a redirect only after an exact replacement exists.
 */
const REMOVED_LEGACY_TOPICS: Readonly<Record<string, readonly string[]>> = {
  economics: [
    'social-security',
    'growthsustainability-balance',
    'first-to-twelfth-five-year-plans',
    'education',
    'aadhaar-enabled-delivery',
    'ease-of-doing-business',
  ],
};

const REMOVED_PATHS = new Set(
  Object.entries(REMOVED_LEGACY_TOPICS).flatMap(([subject, topicSlugs]) =>
    topicSlugs.map((topicSlug) => `/${subject}/topics/${topicSlug}`),
  ),
);

export function isPermanentlyRemovedLegacyTopicPath(pathname: string): boolean {
  const normalized = `/${pathname.split('?')[0]!.split('#')[0]!.split('/').filter(Boolean).join('/')}`
    .toLowerCase();
  return REMOVED_PATHS.has(normalized);
}

export function permanentlyRemovedLegacyTopicPaths(): readonly string[] {
  return [...REMOVED_PATHS];
}
