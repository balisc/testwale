import type { LangMode } from '@/app/demo/lib/bilingual';

/** Single-language UI label — never mixes English and Hindi in one string. */
export function uiLabel(mode: LangMode, en: string, hi: string): string {
  return mode === 'hi' ? hi : en;
}
