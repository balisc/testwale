type LocalizedText = string | { en?: string; hi?: string };

export function slugifySubject(subject: string | LocalizedText): string {
  let subjectText = typeof subject === 'string' ? subject : getText(subject);
  return String(subjectText)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const ENGLISH_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'which', 'what', 'who', 'why', 'how',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'of', 'for', 'in', 'on', 'at', 'by', 'to', 'from', 'with', 'without',
  'that', 'this', 'these', 'those', 'as', 'into', 'about', 'over', 'under', 'after', 'before', 'between', 'among',
  'its', 'it', 'their', 'they', 'them', 'such', 'may', 'can', 'will', 'should', 'could', 'would', 'do', 'does', 'did'
]);

const HINDI_STOPWORDS = new Set([
  'क्या', 'कौन', 'कहाँ', 'कैसे', 'क्यों', 'का', 'की', 'के', 'है', 'हैं', 'था', 'थे', 'हुआ', 'हुई', 'हो', 'और', 'या', 'तो', 'पर', 'से', 'कि', 'यह', 'ये'
]);

function normalizeText(value: string): string {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const SEO_SLUG_WORD_COUNT = 5;

function extractKeywords(text: string, language: 'en' | 'hi' = 'en'): string {
  if (!text) return '';

  if (language === 'hi') {
    const words = text
      .split(/\s+/)
      .filter((word) => word.length > 0 && !HINDI_STOPWORDS.has(word))
      .slice(0, SEO_SLUG_WORD_COUNT);

    const fallback = text
      .split(/\s+/)
      .filter((word) => word.length > 0)
      .slice(0, SEO_SLUG_WORD_COUNT);

    const selected = words.length >= SEO_SLUG_WORD_COUNT ? words : fallback;
    return transliterateHindiToEnglish(selected.join(' ')).toLowerCase();
  }

  const cleaned = normalizeText(text).trim();
  const words = cleaned.split(/\s+/).filter((word) => word.length > 0);

  // Keep first N meaningful content words for readable, unique SEO slugs.
  const filtered = words.filter((word) => {
    const lower = word.toLowerCase();
    return !ENGLISH_STOPWORDS.has(lower) && lower.length > 1;
  });

  const selected =
    filtered.length >= SEO_SLUG_WORD_COUNT
      ? filtered.slice(0, SEO_SLUG_WORD_COUNT)
      : words.slice(0, SEO_SLUG_WORD_COUNT);

  return selected.join('-').toLowerCase();
}

function transliterateHindiToEnglish(text: string): string {
  const hindiToEnglish: Record<string, string> = {
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
    'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
    'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  };

  let result = '';
  for (const char of text) {
    result += hindiToEnglish[char] || char;
  }

  return result
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getText(value: LocalizedText | null | undefined, locale: 'en' | 'hi' = 'en'): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] || value.en || value.hi || Object.values(value)[0] || '';
}

function stripTopicPrefix(text: string): string {
  const trimmed = String(text || '').trim();
  const match = trimmed.match(/^(.+?)\s*[-:|]\s*(.+)$/);
  if (!match) return trimmed;

  const prefix = match[1].trim();
  const remainder = match[2].trim();
  const words = prefix.split(/\s+/).filter(Boolean);
  const questionWords = /^(what|which|who|where|when|why|how|is|are|can|could|should|would|do|does|did|has|have|had|will|shall|क्या|कौन|कहाँ|कैसे|क्यों|कितना|कितनी|क्या|कैसा|कैसी)\b/i;

  if (words.length <= 4 && !questionWords.test(prefix)) {
    return remainder || trimmed;
  }

  return trimmed;
}

export function generateQuestionSlug(questionText: LocalizedText, questionId: string, language: 'en' | 'hi' = 'en'): string {
  const text = stripTopicPrefix(getText(questionText, language));
  const keywords = extractKeywords(text, language) || `question-${questionId}`;
  const safeKeywords = keywords
    .replace(/[^a-z0-9-]/gi, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return `${safeKeywords || `question`}-${questionId}`;
}



export function generateSeoSlug(questionText: LocalizedText, questionId: string, language: 'en' | 'hi' = 'en'): string {
  return generateQuestionSlug(questionText, questionId, language);
}

export type BuildQuestionUrlOptions = {
  language?: 'en' | 'hi';
  /** Subtopic slug/title — included when present: /question/{topic}/{subtopic}/{keywords}-{id} */
  subtopic?: string | LocalizedText | null;
};

export function buildQuestionUrl(
  topic: string | LocalizedText,
  questionId: string,
  questionText: LocalizedText,
  languageOrOptions: 'en' | 'hi' | BuildQuestionUrlOptions = 'en',
): string {
  const options: BuildQuestionUrlOptions =
    typeof languageOrOptions === 'string' ? { language: languageOrOptions } : languageOrOptions;
  const language = options.language ?? 'en';
  const topicSlug = slugifySubject(topic);
  const subtopicSlug = options.subtopic ? slugifySubject(options.subtopic) : '';
  const slugKey = generateQuestionSlug(questionText, questionId, language);

  if (topicSlug && subtopicSlug) {
    return `/question/${topicSlug}/${subtopicSlug}/${slugKey}`;
  }
  if (topicSlug) {
    return `/question/${topicSlug}/${slugKey}`;
  }
  return `/question/${slugKey}`;
}

export const buildQuestionPath = buildQuestionUrl; // backward compatibility alias

/** Unique SEO slug under the live practice route so refresh keeps the same practice UI. */
export function buildPracticeQuestionUrl(
  practiceBasePath: string,
  questionId: string,
  questionText: LocalizedText,
  language: 'en' | 'hi' = 'en',
): string {
  const base = String(practiceBasePath || '')
    .replace(/\/+$/, '')
    .trim();
  const slugKey = generateQuestionSlug(questionText, questionId, language);
  if (!base) return `/question/${slugKey}`;
  return `${base}/${slugKey}`;
}

export function extractQuestionIdFromSlug(slug: string): string {
  const decodedSlug = decodeURIComponent(slug).trim();
  if (!decodedSlug) return '';

  const uuidMatch = decodedSlug.match(/([0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12})$/i);
  if (uuidMatch?.[1]) {
    return uuidMatch[1];
  }

  const numericMatch = decodedSlug.match(/-(\d+)$/);
  if (numericMatch?.[1]) {
    return numericMatch[1];
  }

  const tokenMatch = decodedSlug.match(/-([a-zA-Z0-9_-]+)$/);
  if (tokenMatch?.[1]) {
    return tokenMatch[1];
  }

  const parts = decodedSlug.split('-');
  return parts[parts.length - 1] || decodedSlug;
}
