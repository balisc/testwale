import supabase from '@/lib/supabase';
import { buildQuestionUrl, slugifySubject } from '@/lib/slugGenerator';
import { SITEMAP_LEGACY_QUESTION_CAP } from '@/lib/supabaseQueryLimits';

type LocalizedText = string | { en?: string; hi?: string };

export type SitemapQuestionRow = {
  id: string | number;
  question: LocalizedText;
  topic?: LocalizedText;
  created_at?: string;
};

function getText(value: LocalizedText | undefined) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.en || value.hi || '';
}

/**
 * Egress-safe legacy question rows for sitemap slug generation.
 * Disabled by default (SITEMAP_LEGACY_QUESTION_CAP=0).
 * Selects only id + slug fields (question/topic text), never options/explanation.
 * For full per-question SEO URLs, export static JSON to R2/CDN later.
 */
export async function fetchCappedSitemapQuestionRows(tableName: string): Promise<SitemapQuestionRow[]> {
  if (SITEMAP_LEGACY_QUESTION_CAP <= 0) {
    return [];
  }

  const { data, error } = await supabase
    .from(tableName)
    .select('id, question, topic, created_at')
    .order('id', { ascending: true })
    .limit(SITEMAP_LEGACY_QUESTION_CAP);

  if (error) {
    throw error;
  }

  return (data ?? []) as SitemapQuestionRow[];
}

/** @deprecated Use fetchCappedSitemapQuestionRows — unlimited pagination removed for egress safety. */
export async function fetchAllSitemapQuestionRows(tableName: string): Promise<SitemapQuestionRow[]> {
  return fetchCappedSitemapQuestionRows(tableName);
}

export function collectSitemapPathsFromRows(rows: SitemapQuestionRow[]) {
  const topicSlugs = new Set<string>();
  const questionPaths = new Map<string, Date>();

  for (const row of rows) {
    const topic = getText(row.topic) || '';
    const topicSlug = slugifySubject(topic);
    if (topicSlug) {
      topicSlugs.add(topicSlug);
    }

    if (row.id && row.question) {
      const path = buildQuestionUrl(topic, String(row.id), row.question);
      questionPaths.set(path, row.created_at ? new Date(row.created_at) : new Date());
    }
  }

  return { topicSlugs, questionPaths };
}
