const TOPIC_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'by',
  'for',
  'from',
  'in',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
  '&',
]);

const TOPIC_TOKEN_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\b(sultanates|sultanate)s?\b/gu, 'sultanate'],
  [/\b(kingdoms|kingdom)\b/gu, 'kingdom'],
  [/\b(movements|movement)\b/gu, 'movement'],
  [/\b(empires|empire)\b/gu, 'empire'],
  [/\b(dynasties|dynasty)\b/gu, 'dynasty'],
  [/\b(saints|saint)\b/gu, 'saint'],
  [/\b(cultures|culture)\b/gu, 'culture'],
  [/\b(administrations|administration)\b/gu, 'administration'],
  [/\b(economies|economy)\b/gu, 'economy'],
  [/\b(polities|polity)\b/gu, 'polity'],
];

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function extractTopicText(value: unknown): string {
  if (value === null || value === undefined) return '';

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';

    const parsed = tryParseJson(trimmed);
    if (parsed !== null) {
      return extractTopicText(parsed);
    }

    return trimmed;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => extractTopicText(entry)).filter(Boolean).join(' ');
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;

    const directText = [record.en, record.hi, record.label, record.name, record.title]
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .find(Boolean);

    if (directText) {
      return directText;
    }

    return Object.values(record)
      .map((entry) => extractTopicText(entry))
      .filter(Boolean)
      .join(' ');
  }

  return String(value).trim();
}

export function normalizeTopicText(value: unknown): string {
  const text = extractTopicText(value);

  let normalized = String(text)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u0000-\u001F\u007F-\u009F]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  for (const [pattern, replacement] of TOPIC_TOKEN_REPLACEMENTS) {
    normalized = normalized.replace(pattern, replacement);
  }

  return normalized;
}

function getTopicTokens(value: unknown): string[] {
  const normalized = normalizeTopicText(value);
  if (!normalized) return [];

  return normalized
    .split(' ')
    .filter(Boolean)
    .filter((token) => !TOPIC_STOP_WORDS.has(token));
}

function stripCategoryAliases(value: unknown): string {
  const normalized = normalizeTopicText(value);
  if (!normalized) {
    return '';
  }

  return normalized
    .replace(/\b(history|histories|india|indian)\b/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function topicMatches(topicText: unknown, targetText: unknown): boolean {
  const topicNormalized = normalizeTopicText(topicText);
  const targetNormalized = normalizeTopicText(targetText);

  if (!topicNormalized || !targetNormalized) {
    return false;
  }

  if (topicNormalized === targetNormalized) {
    return true;
  }

  if (topicNormalized.includes(targetNormalized) || targetNormalized.includes(topicNormalized)) {
    return true;
  }

  const topicTokens = getTopicTokens(topicText);
  const targetTokens = getTopicTokens(targetText);

  if (!topicTokens.length || !targetTokens.length) {
    return false;
  }

  const matchedTokenCount = topicTokens.filter((token) => targetTokens.includes(token)).length;
  const overlapRatio = matchedTokenCount / Math.min(topicTokens.length, targetTokens.length);

  if (overlapRatio >= 0.6) {
    return true;
  }

  return topicTokens.join(' ').includes(targetTokens.join(' ')) || targetTokens.join(' ').includes(topicTokens.join(' '));
}

export function subCategoryMatches(value: unknown, target: unknown): boolean {
  const normalizedTarget = normalizeTopicText(target);
  if (!normalizedTarget) {
    return false;
  }

  const normalizedValue = normalizeTopicText(value);
  if (!normalizedValue) {
    return false;
  }

  if (
    normalizedValue === normalizedTarget ||
    normalizedValue.includes(normalizedTarget) ||
    normalizedTarget.includes(normalizedValue)
  ) {
    return true;
  }

  const targetBase = stripCategoryAliases(target);
  const valueBase = stripCategoryAliases(value);

  if (targetBase && valueBase) {
    if (valueBase === targetBase || valueBase.includes(targetBase) || targetBase.includes(valueBase)) {
      return true;
    }
  }

  const targetTokens = getTopicTokens(target);
  const valueTokens = getTopicTokens(value);

  if (!targetTokens.length || !valueTokens.length) {
    return false;
  }

  const overlapRatio = valueTokens.filter((token) => targetTokens.includes(token)).length / Math.min(valueTokens.length, targetTokens.length);
  return overlapRatio >= 0.35;
}
