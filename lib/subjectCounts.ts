import supabase from './supabase';
import { catalogSlugToSubjectKey, resolveSubjectSlug } from './subjectRoutes';
import { SUBJECTS } from './subjects';
import { getActiveQuestionCount } from './questionCounts';

/** Fast homepage counts: single catalog query, optional legacy for featured subjects only. */
export async function getFastHomepageSubjectCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = Object.fromEntries(
    SUBJECTS.map((subject) => [subject.key, 0]),
  );

  const { data: catalogRows, error: catalogError } = await supabase
    .from('subjects')
    .select('slug, question_count')
    .eq('is_active', true);

  if (!catalogError && catalogRows) {
    for (const row of catalogRows) {
      const slug = String(row.slug ?? '').trim();
      if (!slug) continue;
      const key = catalogSlugToSubjectKey(slug);
      if (key in counts) {
        counts[key] = Number(row.question_count ?? 0);
      }
    }
  }

  const legacyKeys = (['history', 'science'] as const).filter((key) => (counts[key] ?? 0) === 0);
  if (legacyKeys.length > 0) {
    await Promise.all(
      legacyKeys.map(async (key) => {
        const subject = SUBJECTS.find((s) => s.key === key);
        if (!subject) return;
        try {
          counts[key] = await getActiveQuestionCount(subject.table);
        } catch {
          counts[key] = 0;
        }
      }),
    );
  }

  return counts;
}

/**
 * Question counts for homepage / subject cards.
 * Prefers catalog `subjects.question_count` (same source as /subjects/indian-polity).
 * Falls back to legacy per-subject question tables.
 */
export async function getHomepageSubjectCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = Object.fromEntries(
    SUBJECTS.map((subject) => [subject.key, 0]),
  );

  const { data: catalogRows, error: catalogError } = await supabase
    .from('subjects')
    .select('slug, question_count')
    .eq('is_active', true);

  const catalogCountBySlug = new Map<string, number>();
  if (!catalogError && catalogRows) {
    for (const row of catalogRows) {
      const slug = String(row.slug ?? '').trim();
      if (!slug) continue;
      catalogCountBySlug.set(slug, Number(row.question_count ?? 0));
    }
  }

  await Promise.all(
    SUBJECTS.map(async (subject) => {
      const catalogSlug = resolveSubjectSlug(subject.key);

      if (catalogCountBySlug.has(catalogSlug)) {
        counts[subject.key] = catalogCountBySlug.get(catalogSlug) ?? 0;
        return;
      }

      try {
        counts[subject.key] = await getActiveQuestionCount(subject.table);
      } catch {
        counts[subject.key] = 0;
      }
    }),
  );

  return counts;
}
