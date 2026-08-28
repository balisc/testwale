export type LegacyQuizLanguage = 'en' | 'hi';

function localizedText(value: unknown, language: LegacyQuizLanguage): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && !Array.isArray(value)) {
    const row = value as Record<string, unknown>;
    return String(row[language] ?? row.en ?? row.hi ?? '');
  }
  return String(value);
}

export function getLegacyOptionTexts(rawOptions: unknown, language: LegacyQuizLanguage): string[] {
  if (!rawOptions) return [];
  if (Array.isArray(rawOptions)) {
    return rawOptions.map((item) => localizedText(item, language)).filter(Boolean);
  }
  if (typeof rawOptions === 'string') {
    try {
      return getLegacyOptionTexts(JSON.parse(rawOptions), language);
    } catch {
      return [rawOptions];
    }
  }
  if (typeof rawOptions === 'object') {
    const options = rawOptions as Record<string, unknown>;
    const localized = options[language] ?? options.en;
    if (Array.isArray(localized)) {
      return localized.map((item) => localizedText(item, language)).filter(Boolean);
    }
    return Object.entries(options)
      .filter(([key]) => key !== 'en' && key !== 'hi')
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([, value]) => localizedText(value, language))
      .filter(Boolean);
  }
  return [];
}

export function resolveLegacyCorrectIndex(
  correctAnswer: unknown,
  rawOptions: unknown,
  language: LegacyQuizLanguage,
): number {
  const options = getLegacyOptionTexts(rawOptions, language);
  const answer = localizedText(correctAnswer, language).trim();
  if (!answer || !options.length) return -1;

  if (/^[a-e]$/i.test(answer)) {
    const index = answer.toUpperCase().charCodeAt(0) - 65;
    if (index < options.length) return index;
  }
  if (/^\d+$/.test(answer)) {
    const number = Number.parseInt(answer, 10);
    if (number >= 1 && number <= options.length) return number - 1;
    if (number >= 0 && number < options.length) return number;
  }

  const normalized = answer.toLocaleLowerCase();
  return options.findIndex((option) => option.trim().toLocaleLowerCase() === normalized);
}

export function getLegacyExplanation(value: unknown, language: LegacyQuizLanguage) {
  return localizedText(value, language).trim();
}

export function stripLegacyAnswerFields<T extends Record<string, unknown>>(row: T) {
  const {
    answer: _answer,
    correct_answer: _correctAnswer,
    correct_option: _correctOption,
    explanation: _explanation,
    explanation_text: _explanationText,
    ...publicFields
  } = row;
  return publicFields;
}
