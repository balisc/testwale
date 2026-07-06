import supabase from './supabase';
import { catalogSlugToSubjectKey } from './subjectRoutes';
import { SUBJECTS } from './subjects';

/**
 * Homepage subject question counts from catalog `subjects.question_count` only.
 * Does not probe legacy *_questions tables or schema columns.
 */
async function loadCatalogSubjectCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = Object.fromEntries(
    SUBJECTS.map((subject) => [subject.key, 0]),
  );

  const { data: catalogRows, error } = await supabase
    .from('subjects')
    .select('slug, question_count')
    .eq('is_active', true);

  if (!error && catalogRows) {
    for (const row of catalogRows) {
      const slug = String(row.slug ?? '').trim();
      if (!slug) continue;
      const key = catalogSlugToSubjectKey(slug);
      if (key in counts) {
        counts[key] = Number(row.question_count ?? 0);
      }
    }
  }

  return counts;
}

/** @deprecated Use loadCatalogSubjectCounts — kept for call-site compatibility. */
export async function getFastHomepageSubjectCounts(): Promise<Record<string, number>> {
  return loadCatalogSubjectCounts();
}

export async function getHomepageSubjectCounts(): Promise<Record<string, number>> {
  return loadCatalogSubjectCounts();
}
