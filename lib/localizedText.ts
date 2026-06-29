export type LocalizedText = string | { en?: string; hi?: string } | null | undefined;

export function getLocalizedText(value: LocalizedText, locale: 'en' | 'hi' = 'en') {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] || value.en || value.hi || '';
}

export function getTopicText(row: Record<string, any>, locale: 'en' | 'hi' = 'en') {
  return getLocalizedText(row.topic, locale) || String(row.topic_en ?? row.topic_hi ?? '').trim();
}

export function isPublicQuestionRow(row: any) {
  const status = typeof row?.status === 'string' ? row.status.trim().toLowerCase() : '';
  return !status || status === 'active' || status === 'published';
}
