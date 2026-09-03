const ROMAN_TIER_NUMBERS: Readonly<Record<string, string>> = {
  I: '1',
  II: '2',
  III: '3',
  IV: '4',
};

/** Keep public tier labels numeric even when legacy records contain Roman numerals. */
export function normalizeTierDisplayText(value: string): string {
  return value.replace(
    /(Tier|टियर)[\s\u2010-\u2015-]+(IV|III|II|I)\b/gi,
    (_match, prefix: string, roman: string) => `${prefix} ${ROMAN_TIER_NUMBERS[roman.toUpperCase()] ?? roman}`,
  );
}
