import supabase from './supabase';
import { getLocalizedText } from './localizedText';
import { catalogSlugToSubjectKey } from './subjectRoutes';
import type { LocalizedText } from '@/types/polity';

export type CatalogSiteStats = {
  questions: number;
  subjects: number;
  topics: number;
};

export type CatalogSearchSuggestion = {
  subjectKey: string;
  topicEn: string;
  topicHi: string;
};

/** Site-wide stats from catalog tables (subjects / topics / questions). */
export async function getCatalogSiteStats(): Promise<CatalogSiteStats | null> {
  const [questionsResult, subjectsResult, topicsResult] = await Promise.all([
    supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('is_verified', true),
    supabase.from('subjects').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('topics').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  if (questionsResult.error || subjectsResult.error || topicsResult.error) {
    return null;
  }

  return {
    questions: questionsResult.count ?? 0,
    subjects: subjectsResult.count ?? 0,
    topics: topicsResult.count ?? 0,
  };
}

/** Search suggestions from catalog topics (replaces broken questions.subject column). */
export async function getCatalogSearchSuggestions(limit = 40): Promise<CatalogSearchSuggestion[]> {
  const { data, error } = await supabase
    .from('topics')
    .select('title, slug, subjects:subject_id (slug)')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(limit);

  if (error || !data?.length) return [];

  const suggestions: CatalogSearchSuggestion[] = [];
  const seen = new Set<string>();

  for (const row of data) {
    const subjectJoin = row.subjects as { slug?: string } | { slug?: string }[] | null;
    const subjectSlug = Array.isArray(subjectJoin)
      ? subjectJoin[0]?.slug
      : subjectJoin?.slug;
    if (!subjectSlug) continue;

    const subjectKey = catalogSlugToSubjectKey(String(subjectSlug));
    const title = row.title as LocalizedText;
    const topicEn = getLocalizedText(title, 'en');
    const topicHi = getLocalizedText(title, 'hi');
    if (!topicEn && !topicHi) continue;

    const key = `${subjectKey}:${topicEn.toLowerCase()}:${topicHi.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    suggestions.push({ subjectKey, topicEn, topicHi });
  }

  return suggestions;
}

/** Sum of question_count from active catalog subjects (fallback stats). */
export async function getCatalogQuestionTotalFromSubjects(): Promise<number | null> {
  const { data, error } = await supabase
    .from('subjects')
    .select('question_count')
    .eq('is_active', true);

  if (error || !data) return null;
  return data.reduce((sum: number, row: { question_count: number | null }) => sum + Number(row.question_count ?? 0), 0);
}
