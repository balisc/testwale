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

async function countForColumn(tableName: string, column: string, value: string): Promise<number> {
  if (!value) return 0;

  const result: any = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })
    .eq(column, value);

  if (result.error) {
    console.warn(`Topic count query failed for ${column}=${value}:`, result.error.message);
    return 0;
  }

  return typeof result.count === 'number' ? result.count : 0;
}

async function countForJsonPath(tableName: string, path: string, value: string): Promise<number> {
  if (!value) return 0;

  const result: any = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })
    .filter(path, 'eq', value);

  if (result.error) {
    console.warn(`Topic count query failed for ${path}=${value}:`, result.error.message);
    return 0;
  }

  return typeof result.count === 'number' ? result.count : 0;
}

export async function fetchExactTopicCounts(
  tableName: string,
  topics: TopicCountInput[]
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
        countForColumn(tableName, 'topic_en', normalizedEn),
        countForColumn(tableName, 'topic_hi', normalizedHi),
        countForJsonPath(tableName, 'topic->>en', normalizedEn),
        countForJsonPath(tableName, 'topic->>hi', normalizedHi),
        countForColumn(tableName, 'topic', normalizedEn || normalizedHi),
      ]);

      counts.set(topicKey, Math.max(topicEnCount, topicHiCount, topicJsonEnCount, topicJsonHiCount, topicRawCount));
    })
  );

  return counts;
}
