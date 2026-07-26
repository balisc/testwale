/** Verified Level-A sources for Regulating Act, 1773 revision content. */
export type RevisionSource = {
  id: string;
  title: string;
  institution: string;
  type:
    | 'primary_legislation'
    | 'official_parliament'
    | 'official_judgment'
    | 'official_education';
  url: string;
  locator: string;
  supports: string[];
  verified: boolean;
};

export const REGULATING_ACT_SOURCES: Record<string, RevisionSource> = {
  'regulating-act-1773': {
    id: 'regulating-act-1773',
    title: 'Regulating Act 1773 (East India Company Act 1773)',
    institution: 'UK Parliament / legislation.gov.uk',
    type: 'primary_legislation',
    url: 'https://www.legislation.gov.uk/aep/Geo3/13-14/21',
    locator: '13 Geo. 3 c. 63',
    supports: [
      'year-1773',
      'governor-general-council',
      'supreme-court-authorisation',
      'presidency-supervision',
      'company-accountability',
    ],
    verified: true,
  },
  'act-of-settlement-1781': {
    id: 'act-of-settlement-1781',
    title: 'Act of Settlement 1781',
    institution: 'UK Parliament / legislation.gov.uk',
    type: 'primary_legislation',
    url: 'https://www.legislation.gov.uk/aep/Geo3/21-22/35',
    locator: '21 Geo. 3 c. 70',
    supports: ['1781-correction', 'jurisdiction-clarification', 'comparison-1781'],
    verified: true,
  },
  'nios-constitutional-development': {
    id: 'nios-constitutional-development',
    title: 'Constitutional Development in India (Lesson 2)',
    institution: 'NIOS',
    type: 'official_education',
    url: 'https://nios.ac.in/media/documents/SecSrSec318/New/318_Pol_Science_Eng/Lesson-02.pdf',
    locator: 'Senior Secondary Political Science, Lesson 2',
    supports: [
      'historical-background',
      'warren-hastings',
      'supreme-court-1774',
      'significance',
      'limitations',
    ],
    verified: true,
  },
  'uk-parliament-eic': {
    id: 'uk-parliament-eic',
    title: 'East India Company — Parliamentary Control',
    institution: 'UK Parliament',
    type: 'official_parliament',
    url: 'https://www.parliament.uk/about/living-heritage/transformingsociety/tradeandempire/ownership-and-influence/east-india-company/',
    locator: 'Living Heritage — Trade and Empire',
    supports: ['parliamentary-intervention', 'regulation-background'],
    verified: true,
  },
};

export function getSource(id: string): RevisionSource {
  const source = REGULATING_ACT_SOURCES[id];
  if (!source) throw new Error(`Unknown revision source: ${id}`);
  return source;
}

const SOURCE_SHORT_CODES: Record<string, string> = {
  'regulating-act-1773': 'S1',
  'uk-parliament-eic': 'S2',
  'act-of-settlement-1781': 'S4',
  'nios-constitutional-development': 'S5',
};

export function getSourceShortCode(id: string): string {
  return SOURCE_SHORT_CODES[id] ?? 'S?';
}
