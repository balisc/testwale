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

function extractKeywords(text: string, language: 'en' | 'hi' = 'en'): string {
  if (!text) return '';

  if (language === 'hi') {
    const words = text
      .split(/\s+/)
      .filter((word) => word.length > 0 && !HINDI_STOPWORDS.has(word))
      .slice(0, 7);

    const fallback = text
      .split(/\s+/)
      .filter((word) => word.length > 0)
      .slice(0, 7);

    const selected = words.length >= 6 ? words : fallback;
    return transliterateHindiToEnglish(selected.join(' ')).toLowerCase();
  }

  const cleaned = normalizeText(text).trim();

  const words = cleaned
    .split(/\s+/)
    .filter((word) => word.length > 0);

  const filtered = words.filter((word) => !ENGLISH_STOPWORDS.has(word.toLowerCase()));
  const selected = filtered.length >= 6 ? filtered.slice(0, 7) : words.slice(0, 7);

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

function getText(value: LocalizedText, locale: 'en' | 'hi' = 'en'): string {
  if (typeof value === 'string') return value;
  return value[locale] || value.en || value.hi || Object.values(value)[0] || '';
}

/*export function generateQuestionSlug(questionText: LocalizedText, questionId: string, language: 'en' | 'hi' = 'en'): string {
  const text = getText(questionText, language);
  const keywords = extractKeywords(text, language) || `question-${questionId}`;
  return `${keywords}-${questionId}`;
}*/
// Isko apne slugGenerator file mein update karein
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
  return `${keywords}-${questionId}`;
}



export function generateSeoSlug(questionText: LocalizedText, questionId: string, language: 'en' | 'hi' = 'en'): string {
  return generateQuestionSlug(questionText, questionId, language);
}

export function buildQuestionUrl(subject: string | LocalizedText, questionId: string, questionText: LocalizedText, language: 'en' | 'hi' = 'en'): string {
  const slugKey = generateQuestionSlug(questionText, questionId, language);
  return `/question/${slugKey}`;
}

export const buildQuestionPath = buildQuestionUrl; // backward compatibility alias

export function extractQuestionIdFromSlug(slug: string): string {
  const decodedSlug = decodeURIComponent(slug);
  const match = decodedSlug.match(/-?([a-zA-Z0-9_-]+)$/);
  if (match && match[1]) {
    const id = match[1];
    if (/^[0-9]+$/.test(id)) {
      return id;
    }
  }

  const parts = decodedSlug.split('-');
  const lastPart = parts[parts.length - 1];

  if (/^[0-9]+$/.test(lastPart)) {
    return lastPart;
  }

  const alnum = lastPart.match(/[a-zA-Z0-9_-]+$/);
  return alnum ? alnum[0] : lastPart;
}
