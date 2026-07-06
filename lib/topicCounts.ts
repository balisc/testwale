import supabase from './supabase';

export type TopicCountInput = {
  en: string;
  hi: string;
};

export type TopicCountMap = Map<string, number>;

export function buildTopicCountKey(topic: TopicCountInput): string {
  return `${topic.en}||${topic.hi}`;
}

export function normalizeTopicValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function escapeForLike(value: string) {
  return value.replace(/([%_\\])/g, '\\$1');
}

function normalizeSubjectSearchValue(value: string) {
  return value
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isUnknownColumnError(error: any) {
  const message = String(error?.message ?? '').replace(/\s+/g, ' ');
  return /column .* does not exist|invalid input syntax for type boolean|operator does not exist|Could not find the table|invalid input syntax for type json/i.test(message);
}

function addSubjectFilter(query: any, subjectKey: string, subjectColumn = 'subject') {
  const escaped = escapeForLike(subjectKey);
  const escapedWithSpaces = escapeForLike(normalizeSubjectSearchValue(subjectKey));
  return query.or(
    `${subjectColumn}->>en.ilike.%${escaped}%,${subjectColumn}->>hi.ilike.%${escaped}%,${subjectColumn}->>en.ilike.%${escapedWithSpaces}%,${subjectColumn}->>hi.ilike.%${escapedWithSpaces}%`
  );
}

async function countForColumn(
  tableName: string,
  column: string,
  value: string,
  subjectKey?: string,
  subjectColumn = 'subject'
): Promise<number> {
  if (!value) return 0;

  let query: any = supabase.from(tableName).select('id', { count: 'exact', head: true }).eq(column, value);
  if (subjectKey) {
    query = addSubjectFilter(query, subjectKey, subjectColumn);
  }

  const result: any = await query;

  if (result.error) {
    if (isUnknownColumnError(result.error)) {
      return 0;
    }
    console.warn(`Topic count query failed for ${column}=${value}:`, result.error.message);
    return 0;
  }

  return typeof result.count === 'number' ? result.count : 0;
}

async function countForJsonPath(
  tableName: string,
  path: string,
  value: string,
  subjectKey?: string,
  subjectColumn = 'subject'
): Promise<number> {
  if (!value) return 0;

  let query: any = supabase.from(tableName).select('id', { count: 'exact', head: true }).filter(path, 'eq', value);
  if (subjectKey) {
    query = addSubjectFilter(query, subjectKey, subjectColumn);
  }

  const result: any = await query;

  if (result.error) {
    if (isUnknownColumnError(result.error)) {
      return 0;
    }
    console.warn(`Topic count query failed for ${path}=${value}:`, result.error.message);
    return 0;
  }

  return typeof result.count === 'number' ? result.count : 0;
}

async function countForTextLike(
  tableName: string,
  column: string,
  value: string,
  subjectKey?: string,
  subjectColumn = 'subject'
): Promise<number> {
  if (!value) return 0;

  const escaped = escapeForLike(value);
  let query: any = supabase.from(tableName).select('id', { count: 'exact', head: true }).filter(column, 'ilike', `%${escaped}%`);
  if (subjectKey) {
    query = addSubjectFilter(query, subjectKey, subjectColumn);
  }

  const result: any = await query;

  if (result.error) {
    if (isUnknownColumnError(result.error)) {
      return 0;
    }
    console.warn(`Topic count query failed for ${column} LIKE ${value}:`, result.error.message);
    return 0;
  }

  return typeof result.count === 'number' ? result.count : 0;
}

export async function fetchExactTopicCounts(
  tableName: string,
  topics: TopicCountInput[],
  subjectKey?: string,
  subjectColumn = 'subject'
): Promise<TopicCountMap> {
  const counts = new Map<string, number>();

  await Promise.all(
    topics.map(async (topic) => {
      const normalizedEn = normalizeTopicValue(topic.en);
      const normalizedHi = normalizeTopicValue(topic.hi);
      const topicKey = buildTopicCountKey(topic);

      if (!normalizedEn && !normalizedHi) {
        counts.set(topicKey, 0);
        return;
      }

      const [topicEnCount, topicHiCount, topicJsonEnCount, topicJsonHiCount, topicRawCount] = await Promise.all([
        countForColumn(tableName, 'topic_en', normalizedEn, subjectKey, subjectColumn),
        countForColumn(tableName, 'topic_hi', normalizedHi, subjectKey, subjectColumn),
        countForJsonPath(tableName, 'topic->>en', normalizedEn, subjectKey, subjectColumn),
        countForJsonPath(tableName, 'topic->>hi', normalizedHi, subjectKey, subjectColumn),
        countForTextLike(tableName, 'topic', normalizedEn || normalizedHi, subjectKey, subjectColumn),
      ]);

      counts.set(topicKey, Math.max(topicEnCount, topicHiCount, topicJsonEnCount, topicJsonHiCount, topicRawCount));
    })
  );

  return counts;
}
