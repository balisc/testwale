import { NextResponse } from 'next/server';
import questionsData from '@/data/questions.json';
import { fetchCatalogTopicLabels } from '@/lib/catalogTopicList';

export const dynamic = 'force-dynamic';

function topicsFromLocalJson(): string[] {
  return Array.from(
    new Set(
      questionsData
        .map((row: { topic?: { en?: string; hi?: string } | string }) => {
          if (!row.topic) return '';
          return typeof row.topic === 'string' ? row.topic : row.topic.en || row.topic.hi || '';
        })
        .filter(Boolean),
    ),
  );
}

export async function GET() {
  const catalogTopics = await fetchCatalogTopicLabels('history');
  if (catalogTopics.length > 0) {
    return NextResponse.json({ topics: catalogTopics.map((topic) => topic.en).filter(Boolean) });
  }

  return NextResponse.json({ topics: topicsFromLocalJson() });
}
