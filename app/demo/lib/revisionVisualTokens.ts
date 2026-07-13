/** Stable colour / label signalling for Sources revision visuals. */

export type SourceKey =
  | 'britain'
  | 'usa'
  | 'ireland'
  | 'france'
  | 'canada'
  | 'indian'
  | 'colonial'
  | 'assembly'
  | 'foreign'
  | 'adapt';

export const SOURCE_VISUAL: Record<
  SourceKey,
  { hex: string; soft: string; border: string; label: { en: string; hi: string }; motif: string }
> = {
  britain: {
    hex: '#334155',
    soft: '#F1F5F9',
    border: '#CBD5E1',
    label: { en: 'Britain', hi: 'ब्रिटेन' },
    motif: 'Chamber',
  },
  usa: {
    hex: '#4338CA',
    soft: '#EEF2FF',
    border: '#C7D2FE',
    label: { en: 'United States', hi: 'संयुक्त राज्य' },
    motif: 'Rights',
  },
  ireland: {
    hex: '#047857',
    soft: '#ECFDF5',
    border: '#A7F3D0',
    label: { en: 'Ireland', hi: 'आयरलैंड' },
    motif: 'Direction',
  },
  france: {
    hex: '#BE123C',
    soft: '#FFF1F2',
    border: '#FECDD3',
    label: { en: 'France', hi: 'फ्रांस' },
    motif: 'LEF',
  },
  canada: {
    hex: '#B45309',
    soft: '#FFFBEB',
    border: '#FDE68A',
    label: { en: 'Canada', hi: 'कनाडा' },
    motif: 'Centre',
  },
  indian: {
    hex: '#7C3AED',
    soft: '#F5F3FF',
    border: '#DDD6FE',
    label: { en: 'Indian foundations', hi: 'भारतीय नींव' },
    motif: 'Values',
  },
  colonial: {
    hex: '#0F766E',
    soft: '#F0FDFA',
    border: '#99F6E4',
    label: { en: 'Colonial experience', hi: 'औपनिवेशिक अनुभव' },
    motif: 'Institutions',
  },
  assembly: {
    hex: '#1D4ED8',
    soft: '#EFF6FF',
    border: '#BFDBFE',
    label: { en: 'Constituent Assembly', hi: 'संविधान सभा' },
    motif: 'Deliberation',
  },
  foreign: {
    hex: '#6D28D9',
    soft: '#F5F3FF',
    border: '#DDD6FE',
    label: { en: 'Foreign traditions', hi: 'विदेशी परंपराएँ' },
    motif: 'Select',
  },
  adapt: {
    hex: '#0F172A',
    soft: '#F8FAFC',
    border: '#E2E8F0',
    label: { en: 'Indian adaptation', hi: 'भारतीय अनुकूलन' },
    motif: 'Adapt',
  },
};

export const CAPSULE_TO_KEY: Record<string, SourceKey> = {
  britain: 'britain',
  usa: 'usa',
  ireland: 'ireland',
  france: 'france',
  canada: 'canada',
};
