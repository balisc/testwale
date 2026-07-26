/** Verified sources for Company Rule and Early Acts revision. */
export type CompanyRuleSource = {
  id: string;
  title: string;
  institution: string;
  url: string;
  pdfUrl?: string;
  locator: string;
  verified: boolean;
};

export const COMPANY_RULE_SOURCES: Record<string, CompanyRuleSource> = {
  'ncert-class8-trade-territory': {
    id: 'ncert-class8-trade-territory',
    title: 'NCERT — Our Pasts–III',
    institution: 'NCERT / ePathshala',
    url: 'https://epathshala.nic.in/e-pathshala-5-to-9?ln=en',
    pdfUrl: 'https://ncert.nic.in/textbook/pdf/hess202.pdf',
    locator: 'Chapter 2 — From Trade to Territory',
    verified: true,
  },
  'nios-british-rule-establishment': {
    id: 'nios-british-rule-establishment',
    title: 'NIOS History 315',
    institution: 'NIOS',
    url: 'https://www.nios.ac.in/sr-secondary-courses/history.aspx',
    pdfUrl: 'https://digital.nios.ac.in/content/315en/315_History_Eng_Lesson16.pdf',
    locator: 'Lesson 16 — Establishment of British Rule in India till 1857',
    verified: true,
  },
  'british-library-eic-charter': {
    id: 'british-library-eic-charter',
    title: 'India Office Records — East India Company Charter',
    institution: 'British Library',
    url: 'https://www.bl.uk/collection-items/charter-granted-by-elizabeth-i-to-the-governor-and-company-of-merchants-of-london-trading-into-the-east-indies',
    locator: 'Charter of the East India Company, 1600',
    verified: true,
  },
  'uk-legislation-gov-india-1858': {
    id: 'uk-legislation-gov-india-1858',
    title: 'Government of India Act 1858',
    institution: 'UK Legislation',
    url: 'https://www.legislation.gov.uk/ukpga/Vict/21and22/106',
    locator: 'Transfer of Company rule to the Crown',
    verified: true,
  },
};

const SHORT_CODES: Record<string, string> = {
  'ncert-class8-trade-territory': 'S1',
  'nios-british-rule-establishment': 'S2',
  'british-library-eic-charter': 'S3',
  'uk-legislation-gov-india-1858': 'S4',
};

export function getCompanyRuleSource(id: string): CompanyRuleSource {
  const source = COMPANY_RULE_SOURCES[id];
  if (!source) throw new Error(`Unknown source: ${id}`);
  return source;
}

export function getCompanyRuleSourceShortCode(id: string): string {
  return SHORT_CODES[id] ?? 'S?';
}
