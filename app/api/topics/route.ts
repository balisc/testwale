import { NextResponse } from 'next/server';
import questionsData from '@/data/questions.json';
import { fetchCatalogTopicLabels } from '@/lib/catalogTopicList';

export const dynamic = 'force-dynamic';

function topicsFromLocalJson(): Array<{ en: string; hi: string }> {
  return Array.from(
    new Set(
      questionsData
        .map((row) => {
          const topicValue = (row as { topic?: { en?: string; hi?: string } | string }).topic;
          if (!topicValue) return '';
          if (typeof topicValue === 'string') {
            return topicValue;
          }
          return topicValue.en || topicValue.hi || '';
        })
        .filter(Boolean),
    ),
  ).map((topic) => ({ en: String(topic), hi: String(topic) }));
}

export async function GET() {
  const catalogTopics = await fetchCatalogTopicLabels('history');
  const headers = { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' };
  if (catalogTopics.length > 0) {
    return NextResponse.json({ topics: catalogTopics }, { headers });
  }

  return NextResponse.json({ topics: topicsFromLocalJson() }, { headers });
}
