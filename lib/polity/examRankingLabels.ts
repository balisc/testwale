import type { LocalizedText } from '@/types/polity';
import type {
  DepthLevel,
  ImportanceLevel,
  PolityExamRankingEvidence,
  PyqConfidence,
  PyqEvidenceMode,
} from '@/types/polityExamRankingV2';

export const POLITY_EXAM_STORAGE_KEY = 'questionwale:polity_exam_code';

export const RANKING_DISCLAIMER: LocalizedText = {
  en: 'Priority is a recommended study order based on the official syllabus and/or previous-paper pattern. It is not guaranteed future question weightage.',
  hi: 'यह आधिकारिक पाठ्यक्रम और/या पिछले प्रश्नपत्रों के पैटर्न पर आधारित अध्ययन क्रम है। यह भविष्य के प्रश्नों की निश्चित वेटेज नहीं है।',
};

const IMPORTANCE_LABELS: Record<string, LocalizedText> = {
  high: { en: 'High', hi: 'उच्च' },
  medium: { en: 'Medium', hi: 'मध्यम' },
  low: { en: 'Low', hi: 'कम' },
};

const CONFIDENCE_LABELS: Record<string, LocalizedText> = {
  high: { en: 'High', hi: 'उच्च' },
  medium: { en: 'Medium', hi: 'मध्यम' },
  low: { en: 'Low', hi: 'कम' },
};

const DEPTH_LABELS: Record<string, LocalizedText> = {
  foundation: { en: 'Foundation', hi: 'आधार' },
  standard: { en: 'Standard', hi: 'मानक' },
  advanced: { en: 'Advanced', hi: 'उन्नत' },
  school_civics: { en: 'School Civics', hi: 'स्कूल नागरिक शास्त्र' },
};

export type RankingBadgeKind =
  | 'official_syllabus'
  | 'direct_pyq'
  | 'proxy_pyq'
  | 'limited_pyq'
  | 'generic';

export type RankingBadgeCopy = {
  kind: RankingBadgeKind;
  label: LocalizedText;
  confidence: LocalizedText | null;
  isProxy: boolean;
};

export function normalizeImportanceKey(value: string | null | undefined): ImportanceLevel | null {
  if (!value) return null;
  const key = value.trim().toLowerCase();
  if (key === 'high' || key === 'medium' || key === 'low') return key;
  return key;
}

export function getImportanceLabel(value: string | null | undefined): LocalizedText | null {
  const key = normalizeImportanceKey(value);
  if (!key) return null;
  return IMPORTANCE_LABELS[key] ?? { en: key, hi: key };
}

export function getConfidenceLabel(value: PyqConfidence | null | undefined): LocalizedText | null {
  if (!value) return null;
  const key = String(value).trim().toLowerCase();
  return CONFIDENCE_LABELS[key] ?? null;
}

export function getDepthLabel(value: DepthLevel | null | undefined): LocalizedText | null {
  if (!value) return null;
  const key = String(value).trim().toLowerCase();
  return DEPTH_LABELS[key] ?? { en: value, hi: value };
}

export function resolveRankingBadge(evidence: PolityExamRankingEvidence): RankingBadgeCopy {
  const basis = String(evidence.ranking_basis ?? '').toLowerCase();
  const officialStatus = String(evidence.official_ranking_status ?? '').toLowerCase();
  const pyqMode = String(evidence.pyq_evidence_mode ?? '').toLowerCase() as PyqEvidenceMode;
  const confidence = getConfidenceLabel(evidence.pyq_confidence);

  if (basis === 'official_clause' || officialStatus === 'official_clause_mapped') {
    return {
      kind: 'official_syllabus',
      label: {
        en: 'Official syllabus priority',
        hi: 'आधिकारिक पाठ्यक्रम प्राथमिकता',
      },
      confidence,
      isProxy: false,
    };
  }

  if (pyqMode === 'direct') {
    return {
      kind: 'direct_pyq',
      label: { en: 'Direct PYQ pattern', hi: 'प्रत्यक्ष PYQ पैटर्न' },
      confidence,
      isProxy: false,
    };
  }

  if (pyqMode === 'multi_commission_proxy') {
    return {
      kind: 'proxy_pyq',
      label: { en: 'Similar-exam PYQ trend', hi: 'समान परीक्षाओं का PYQ रुझान' },
      confidence,
      isProxy: true,
    };
  }

  if (pyqMode === 'limited') {
    return {
      kind: 'limited_pyq',
      label: { en: 'Limited PYQ evidence', hi: 'सीमित PYQ प्रमाण' },
      confidence,
      isProxy: false,
    };
  }

  return {
    kind: 'generic',
    label: { en: 'Recommended study order', hi: 'अनुशंसित अध्ययन क्रम' },
    confidence,
    isProxy: false,
  };
}

export function humanizeExamCode(code: string): LocalizedText {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { en: '', hi: '' };

  const acronyms = new Set([
    'UPSC',
    'CSE',
    'PCS',
    'SSC',
    'CGL',
    'CHSL',
    'MTS',
    'RRB',
    'NTPC',
    'GROUP',
    'PRE',
    'MAINS',
    'PRELIMS',
    'CAPF',
    'CDS',
    'NDA',
    'AP',
    'MP',
    'BPSC',
    'RAS',
    'KAS',
    'MPSC',
    'TNPSC',
    'CTET',
    'IB',
    'ACIO',
    'SI',
    'ASI',
    'GD',
    'CLERK',
    'PO',
    'SO',
    'LDC',
    'UDC',
  ]);

  const words = normalized.split('_').filter(Boolean);
  const en = words
    .map((word) => {
      if (acronyms.has(word)) return word;
      if (/^\d+$/.test(word)) return word;
      return word.charAt(0) + word.slice(1).toLowerCase();
    })
    .join(' ');

  return { en, hi: en };
}

export const JURISDICTION_GROUP_LABELS: Record<
  'national' | 'state' | 'union_territory',
  LocalizedText
> = {
  national: { en: 'National', hi: 'राष्ट्रीय' },
  state: { en: 'State', hi: 'राज्य' },
  union_territory: { en: 'Union Territory', hi: 'केंद्र शासित प्रदेश' },
};
