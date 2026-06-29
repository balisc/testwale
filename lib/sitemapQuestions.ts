import supabase from '@/lib/supabase';
import { buildQuestionUrl, slugifySubject } from '@/lib/slugGenerator';

type LocalizedText = string | { en?: string; hi?: string };

export type SitemapQuestionRow = {
  id: string | number;
  question: LocalizedText;
  topic?: LocalizedText;
  created_at?: string;
};

const PAGE_SIZE = 1000;

function getText(value: LocalizedText | undefined) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.en || value.hi || '';
}

export async function fetchAllSitemapQuestionRows(tableName: string): Promise<SitemapQuestionRow[]> {
  const rows: SitemapQuestionRow[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('id, question, topic, created_at')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const chunk = (data ?? []) as SitemapQuestionRow[];
    if (!chunk.length) {
      break;
    }

    rows.push(...chunk);

    if (chunk.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  return rows;
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
      questionPaths.set(
        path,
        row.created_at ? new Date(row.created_at) : new Date()
      );
    }
  }

  return { topicSlugs, questionPaths };
}
