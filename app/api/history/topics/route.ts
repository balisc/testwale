import { NextResponse } from 'next/server';
import questionsData from '@/data/questions.json';
import supabase from '@/lib/supabase';
import { MAX_LEGACY_TOPIC_SCAN } from '@/lib/supabaseQueryLimits';

export const dynamic = 'force-dynamic';

function extractTopicText(rawTopic: unknown): string {
  if (rawTopic === null || rawTopic === undefined) {
    return '';
  }

  let text = '';
  if (typeof rawTopic === 'string') {
    text = rawTopic.trim();
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed)) {
          text = parsed.map((item) => String(item).trim()).join(' ');
        } else {
          text = String((parsed as any).en ?? (parsed as any).hi ?? Object.values(parsed).join(' ')).trim();
        }
      }
    } catch {
      // Keep raw text.
    }
  } else if (Array.isArray(rawTopic)) {
    text = rawTopic.map((item) => String(item).trim()).join(' ');
  } else if (typeof rawTopic === 'object') {
    text = String((rawTopic as any).en ?? (rawTopic as any).hi ?? Object.values(rawTopic).join(' ')).trim();
  } else {
    text = String(rawTopic).trim();
  }

  return text.trim();
}

async function fetchHistoryTopicsFromSupabase(): Promise<string[]> {
  const rpcResult = await supabase.rpc('topic_group_counts', {
    category: null,
    table_name: 'history_questions',
  });

  if (!rpcResult.error && Array.isArray(rpcResult.data) && rpcResult.data.length > 0) {
    return Array.from(
      new Set(
        rpcResult.data
          .map((row: any) => extractTopicText(row.topic))
          .filter(Boolean),
      ),
    );
  }

  const { data, error } = await supabase
    .from('history_questions')
    .select('topic')
    .not('topic', 'is', null)
    .order('id', { ascending: true })
    .limit(MAX_LEGACY_TOPIC_SCAN);

  if (error) {
    throw error;
  }

  return Array.from(
    new Set(
      (data ?? [])
        .map((row: any) => extractTopicText(row.topic))
        .filter(Boolean),
    ),
  );
}

export async function GET() {
  try {
    const topics = await fetchHistoryTopicsFromSupabase();
    return NextResponse.json({ topics });
  } catch (error) {
    console.warn('History topics API fallback to local JSON:', error instanceof Error ? error.message : error);
    const fallbackTopics = Array.from(
      new Set(
        questionsData
          .map((row: any) => {
            if (!row.topic) return '';
            return typeof row.topic === 'string' ? row.topic : row.topic.en || row.topic.hi || '';
          })
          .filter(Boolean),
      ),
    );
    return NextResponse.json({ topics: fallbackTopics });
  }
}
