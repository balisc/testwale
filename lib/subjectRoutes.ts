/** Maps legacy short keys (e.g. /polity) to Supabase subject slugs. */
export const LEGACY_SUBJECT_SLUG_MAP: Record<string, string> = {
  polity: 'indian-polity',
};

export function resolveSubjectSlug(routeParam: string): string {
  const normalized = String(routeParam ?? '').trim().toLowerCase();
  return LEGACY_SUBJECT_SLUG_MAP[normalized] ?? normalized;
}

export function getSubjectPageHref(subjectKey: string): string {
  const slug = resolveSubjectSlug(subjectKey);
  if (LEGACY_SUBJECT_SLUG_MAP[subjectKey.toLowerCase()]) {
    return `/subjects/${slug}`;
  }
  return `/${subjectKey}`;
}

/** Reverse map: catalog slug → homepage/search subject key (e.g. indian-polity → polity). */
export function catalogSlugToSubjectKey(catalogSlug: string): string {
  const slug = String(catalogSlug ?? '').trim().toLowerCase();
  for (const [key, mappedSlug] of Object.entries(LEGACY_SUBJECT_SLUG_MAP)) {
    if (mappedSlug === slug) return key;
  }
  return slug;
}
