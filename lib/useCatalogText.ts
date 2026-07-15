'use client';

import { useLanguage } from '@/lib/LanguageContext';
import { getLocalizedText, type LocalizedText } from '@/lib/localizedText';

export type CatalogTextValue = LocalizedText | string | null | undefined;

export function pickCatalogText(value: CatalogTextValue, language: 'en' | 'hi'): string {
  return getLocalizedText(value as Parameters<typeof getLocalizedText>[0], language);
}

export function useCatalogText(value: CatalogTextValue): string {
  const { language } = useLanguage();
  return pickCatalogText(value, language);
}
