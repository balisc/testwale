import type { RevisionDocument } from '@/lib/revision/types';
import { getCompanyRuleSource } from '@/content/revision/indian-polity/company-rule-and-early-acts.sources';

export const companyRuleEarlyActsRevision: RevisionDocument = {
  subjectSlug: 'indian-polity',
  topicSlug: 'constitutional-history-making',
  subtopicSlug: 'company-rule-acts-1773-1853',
  version: 'indian-polity/constitutional-history-making/company-rule-early-acts.seo.v2',
  status: 'published',
  estimatedMinutes: 22,
  lastReviewed: '2026-07-19',
  seo: {
    title: 'Company Rule and Early Acts Revision Notes in Hindi | Indian Polity',
    description:
      'Charter 1600, Hugli factory, Plassey, Buxar, Treaty of Allahabad, Diwani, Nizamat and Dual Government explained in easy Hindi with timeline, mind map and MCQs.',
  },
  title: {
    en: 'Company Rule and Early Acts',
    hi: 'कंपनी शासन और प्रारंभिक अधिनियम',
  },
  overview: {
    en: 'From a trading company chartered in 1600 to territorial power after Plassey and Diwani in 1765 — how the East India Company became a political force before parliamentary regulation.',
    hi: '1600 के Charter से 1765 की Diwani तक — ईस्ट इंडिया कंपनी व्यापारिक संस्था से राजनीतिक शक्ति कैसे बनी।',
  },
  keyConcepts: [
    {
      title: { en: 'Charter 1600 = trade right, not rule' },
      body: { en: 'Queen Elizabeth I granted exclusive trading privilege among English groups — not sovereignty over India.' },
    },
    {
      title: { en: 'Diwani (1765)' },
      body: { en: 'Revenue administration and civil justice; not criminal justice (Nizamat).' },
    },
    {
      title: { en: 'Dual Government' },
      body: { en: 'Real power and resources with the Company; formal responsibility with the Nawab.' },
    },
  ],
  constitutionalPoints: [
    {
      title: { en: 'Constitutional problem' },
      body: { en: 'A private company wielding public powers without adequate accountability led to parliamentary intervention.' },
    },
  ],
  misconceptions: [
    {
      myth: { en: 'Charter 1600 granted government over India.' },
      reality: { en: 'It granted exclusive trade rights among English merchants — not territorial sovereignty.' },
    },
    {
      myth: { en: 'Crown rule began in 1757.' },
      reality: { en: 'Company rule continued; direct Crown rule began in 1858.' },
    },
  ],
  memoryAids: [
    {
      label: { en: 'C–T–M–P–D–D–C' },
      tip: { en: 'Charter → Trade → Misuse → Political Power → Diwani → Dual Government → Constitutional Control' },
    },
  ],
  summary: {
    en: 'The Company began with trade rights (1600), misused privileges, gained political power after 1757, acquired Diwani (1765), operated Dual Government, and created a constitutional problem requiring parliamentary regulation.',
  },
  officialSources: [
    {
      title: getCompanyRuleSource('ncert-class8-trade-territory').title,
      url: getCompanyRuleSource('ncert-class8-trade-territory').url,
      institution: getCompanyRuleSource('ncert-class8-trade-territory').institution,
      citation: getCompanyRuleSource('ncert-class8-trade-territory').locator,
    },
    {
      title: getCompanyRuleSource('nios-british-rule-establishment').title,
      url: getCompanyRuleSource('nios-british-rule-establishment').url,
      institution: getCompanyRuleSource('nios-british-rule-establishment').institution,
      citation: getCompanyRuleSource('nios-british-rule-establishment').locator,
    },
  ],
  includeQuestionBankSources: true,
};

export const COMPANY_RULE_RICH_REVISION_SLUG = 'company-rule-early-acts';
