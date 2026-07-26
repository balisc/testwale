/** Slugs that render the rich interactive revision client instead of RevisionPageView. */

export const RICH_REVISION_SLUGS = new Set([

  'regulating-act-1773',

  'company-rule-early-acts',

  'company-rule-acts-1773-1853',

  /** Legacy alias — older catalog slug without "and". */

  'company-rule-and-early-acts',

]);



export function isRichRevision(subtopicSlug: string): boolean {

  return RICH_REVISION_SLUGS.has(subtopicSlug.trim().toLowerCase());

}



export type RichRevisionSlug = 'regulating-act-1773' | 'company-rule-early-acts';



const SLUG_ALIASES: Record<string, RichRevisionSlug> = {

  'regulating-act-1773': 'regulating-act-1773',

  'company-rule-early-acts': 'company-rule-early-acts',

  'company-rule-acts-1773-1853': 'company-rule-early-acts',

  'company-rule-and-early-acts': 'company-rule-early-acts',

};



/** Canonical catalog slug used in registry / isRevisionPublished checks. */

const LEGACY_COMPANY_RULE_SLUGS = new Set([

  'company-rule-early-acts',

  'company-rule-and-early-acts',

]);



export const COMPANY_RULE_REVISION_CATALOG_SLUG = 'company-rule-acts-1773-1853';



export function normalizeRichRevisionSlug(subtopicSlug: string): RichRevisionSlug | null {

  return SLUG_ALIASES[subtopicSlug.trim().toLowerCase()] ?? null;

}



export function canonicalRevisionSubtopicSlug(subtopicSlug: string): string {

  const normalized = subtopicSlug.trim().toLowerCase();

  if (LEGACY_COMPANY_RULE_SLUGS.has(normalized)) return COMPANY_RULE_REVISION_CATALOG_SLUG;

  return normalized;

}



/** Load FAQ schema data for rich revision pages (server-side). */

export async function loadRichRevisionFaqs(slug: RichRevisionSlug) {

  if (slug === 'regulating-act-1773') {

    const { regulatingActRevisionContent } = await import(

      '@/content/revision/indian-polity/regulating-act-1773.v1'

    );

    return regulatingActRevisionContent.faqs;

  }

  const { companyRuleRevisionContent } = await import(

    '@/content/revision/indian-polity/company-rule-and-early-acts.v1'

  );

  return companyRuleRevisionContent.faqs;

}

