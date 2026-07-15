import supabase, { SUPABASE_AVAILABLE } from './supabase';
import { getLocalizedText } from './localizedText';
import { resolveSubjectSlug } from './subjectRoutes';
import { MAX_LEGACY_TOPIC_SCAN } from './supabaseQueryLimits';

export type TopicItem = {
  en: string;
  hi: string;
  count: number;
};

function sanitizeTopicText(value: string): string {
  return String(value)
    .replace(/[\u0000-\u001F\u007F-\u009F]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Last-resort topic list when the catalog snapshot is empty.
 * Uses subjects → topics (and optional questions.topic_id counts).
 * Never reads questions.subject / questions.topic (those columns do not exist).
 */
export async function fetchTopicsFromQuestions(subjectKey: string, _subCategory?: string) {
  if (!SUPABASE_AVAILABLE) {
    console.warn('Supabase is not configured; skipping topic fallback.');
    return [];
  }

  const subjectSlug = resolveSubjectSlug(subjectKey);
  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .select('id')
    .eq('slug', subjectSlug)
    .eq('is_active', true)
    .maybeSingle();

  if (subjectError) {
    console.warn('Subject lookup for topic fallback failed:', subjectError.message);
    return [];
  }

  if (!subject?.id) {
    return [];
  }

  const { data: topics, error: topicsError } = await supabase
    .from('topics')
    .select('id, title, question_count')
    .eq('subject_id', subject.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(MAX_LEGACY_TOPIC_SCAN);

  if (topicsError) {
    console.warn('Topics fallback query failed:', topicsError.message);
    return [];
  }

  if (!Array.isArray(topics) || topics.length === 0) {
    return [];
  }

  const topicMap = new Map<string, TopicItem>();

  for (const row of topics) {
    const en = sanitizeTopicText(getLocalizedText(row.title, 'en'));
    const hi = sanitizeTopicText(getLocalizedText(row.title, 'hi')) || en;
    if (!en && !hi) continue;

    const key = `${en}||${hi}`;
    const count =
      typeof row.question_count === 'number' && Number.isFinite(row.question_count)
        ? row.question_count
        : 0;

    const existing = topicMap.get(key);
    if (existing) {
      existing.count += count;
    } else {
      topicMap.set(key, { en, hi, count });
    }
  }

  return Array.from(topicMap.values());
}
