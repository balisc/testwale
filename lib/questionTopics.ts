import supabase, { SUPABASE_AVAILABLE } from './supabase';
import { subCategoryMatches } from './topicMatching';
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

function parseTopicFields(row: any) {
  const rawTopic = row.topic;
  let topicEn = '';
  let topicHi = '';

  if (rawTopic) {
    if (typeof rawTopic === 'string') {
      const trimmed = rawTopic.trim();
      if (trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          topicEn = String(parsed.en ?? parsed.hi ?? '').trim();
          topicHi = String(parsed.hi ?? parsed.en ?? '').trim();
        } catch {
          topicEn = trimmed;
          topicHi = trimmed;
        }
      } else {
        topicEn = trimmed;
        topicHi = trimmed;
      }
    } else if (typeof rawTopic === 'object') {
      topicEn = String(rawTopic.en ?? rawTopic.hi ?? '').trim();
      topicHi = String(rawTopic.hi ?? rawTopic.en ?? '').trim();
    }
  }

  if (!topicEn && !topicHi) {
    topicEn = String(row.topic_en ?? '').trim();
    topicHi = String(row.topic_hi ?? '').trim();
  }

  return {
    topicEn: sanitizeTopicText(topicEn),
    topicHi: sanitizeTopicText(topicHi),
  };
}

function extractSubCategoryValue(rawSubCategory: unknown) {
  if (rawSubCategory === null || rawSubCategory === undefined) {
    return '';
  }

  let value = '';
  if (typeof rawSubCategory === 'string') {
    value = rawSubCategory.trim();
  } else if (typeof rawSubCategory === 'object') {
    if (Array.isArray(rawSubCategory)) {
      value = rawSubCategory.map((item) => String(item).trim()).join(' ');
    } else {
      value = String((rawSubCategory as any).en ?? (rawSubCategory as any).hi ?? Object.values(rawSubCategory).join(' ')).trim();
    }
  } else {
    value = String(rawSubCategory).trim();
  }

  if (!value) {
    return '';
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object') {
      return String((parsed as any).en ?? (parsed as any).hi ?? Object.values(parsed).join(' ')).trim();
    }
  } catch {
    // ignore invalid JSON
  }

  return value;
}

function normalizeCategorySearchValue(value: string) {
  return value
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTextValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        return extractTextValue(parsed);
      }
    } catch {
      // ignore invalid JSON and fall back to the plain string
    }

    return trimmed;
  }

  if (Array.isArray(value)) {
    return value.map((item) => extractTextValue(item)).filter(Boolean).join(' ');
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const directText = [record.en, record.hi, record.label, record.name, record.title]
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .find(Boolean);

    if (directText) {
      return directText;
    }

    return Object.values(record).map((entry) => extractTextValue(entry)).filter(Boolean).join(' ');
  }

  return String(value).trim();
}

function doesSubCategoryMatch(row: any, subCategory: string) {
  const target = normalizeCategorySearchValue(subCategory);
  if (!target) {
    return false;
  }

  const explicitValue = extractTextValue(row?.sub_category);
  if (subCategoryMatches(explicitValue, target)) {
    return true;
  }

  const candidateValues = [row?.topic, row?.topic_en, row?.topic_hi, row?.sub_category, row?.sub_category_en, row?.sub_category_hi];

  for (const candidate of candidateValues) {
    if (subCategoryMatches(candidate, target)) {
      return true;
    }
  }

  return false;
}

function normalizeSubjectSearchValue(value: string) {
  return value
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function subjectMatches(rawSubject: unknown, subjectKey: string) {
  if (rawSubject === null || rawSubject === undefined) {
    return false;
  }

  let value = '';
  if (typeof rawSubject === 'string') {
    value = rawSubject.trim();
  } else if (typeof rawSubject === 'object') {
    if (Array.isArray(rawSubject)) {
      value = rawSubject.map((item) => String(item).trim()).join(' ');
    } else {
      value = String((rawSubject as any).en ?? (rawSubject as any).hi ?? Object.values(rawSubject).join(' ')).trim();
    }
  } else {
    value = String(rawSubject).trim();
  }

  if (!value) {
    return false;
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object') {
      value = String((parsed as any).en ?? (parsed as any).hi ?? Object.values(parsed).join(' ')).trim();
    }
  } catch {
    // ignore invalid JSON
  }

  const normalizedValue = normalizeSubjectSearchValue(value);
  const normalizedKey = normalizeSubjectSearchValue(subjectKey);

  return normalizedValue.includes(normalizedKey);
}

function escapeForLike(value: string) {
  return value.replace(/([%_\\])/g, '\\$1');
}

function isJsonSyntaxError(error: any) {
  const message = String(error?.message ?? '').toLowerCase();
  return message.includes('invalid input syntax for type json');
}

function addSubjectFilter(query: any, subjectKey: string) {
  const escaped = escapeForLike(subjectKey);
  const escapedWithSpaces = escapeForLike(normalizeSubjectSearchValue(subjectKey));
  return query.or(
    `subject->>en.ilike.%${escaped}%,subject->>hi.ilike.%${escaped}%,subject->>en.ilike.%${escapedWithSpaces}%,subject->>hi.ilike.%${escapedWithSpaces}%`
  );
}

function dedupeTopics(rows: any[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = JSON.stringify({
      topic: row.topic,
    });
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export async function fetchTopicsFromQuestions(subjectKey: string, subCategory?: string) {
  // Last-resort fallback: unified `questions` table only (never legacy *_questions tables).
  if (!SUPABASE_AVAILABLE) {
    console.warn('Supabase is not configured; skipping topic fallback.');
    return [];
  }

  const selectFields = 'topic, subject, sub_category';
  let query = supabase
    .from('questions')
    .select(selectFields)
    .not('topic', 'is', null)
    .range(0, MAX_LEGACY_TOPIC_SCAN - 1);

  query = addSubjectFilter(query, subjectKey);

  let result: any;
  try {
    result = await query;
  } catch (error) {
    result = { data: null, error: error as Error };
  }

  if (result.error || !Array.isArray(result.data) || result.data.length === 0) {
    if (result.error && !isJsonSyntaxError(result.error)) {
      console.warn('Subject topic query failed:', result.error.message ?? result.error);
    }
    return [];
  }

  let rows = result.data as any[];

  if (subCategory) {
    rows = rows.filter((row) => doesSubCategoryMatch(row, subCategory));
  }

  rows = dedupeTopics(rows);

  const topicMap = new Map<string, TopicItem>();

  for (const row of rows) {
    const { topicEn, topicHi } = parseTopicFields(row);
    if (!topicEn && !topicHi) continue;
    const key = `${topicEn}||${topicHi}`;
    const existing = topicMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      topicMap.set(key, { en: topicEn, hi: topicHi, count: 1 });
    }
  }

  return Array.from(topicMap.values());
}
