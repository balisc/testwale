import type { RevisionDocument } from '@/lib/revision/types';
import { getSource } from '@/content/revision/indian-polity/regulating-act-1773.sources';

/**
 * Published SEO revision for Constitutional History & Making — Regulating Act, 1773.
 * Rich interactive UI renders from regulating-act-1773.v1.ts when this doc is published.
 */
export const regulatingAct1773Revision: RevisionDocument = {
  subjectSlug: 'indian-polity',
  topicSlug: 'constitutional-history-making',
  subtopicSlug: 'regulating-act-1773',
  version: 'indian-polity/constitutional-history-making/regulating-act-1773.seo.v1',
  status: 'draft',
  estimatedMinutes: 14,
  lastReviewed: '2026-07-18',
  seo: {
    title: 'Regulating Act 1773: Complete Revision Notes & MCQs',
    description:
      'Revise the Regulating Act 1773 — Governor-General of Bengal, Executive Council, Supreme Court at Fort William, significance, limitations, and comparison with Act of Settlement 1781. Source-verified notes with MCQ practice.',
  },
  title: {
    en: 'Regulating Act, 1773',
    hi: 'रेगुलेटिंग एक्ट, 1773',
  },
  overview: {
    en: 'The Regulating Act, 1773 was the first major British parliamentary statute to regulate East India Company rule in India. It created the Governor-General of Bengal with a four-member council, authorised the Supreme Court at Fort William, and began central supervision over the presidencies — without ending Company government or establishing Crown rule.',
    hi: 'रेगुलेटिंग एक्ट, 1773 भारत में ईस्ट इंडिया कंपनी शासन को विनियमित करने वाला पहला प्रमुख ब्रिटिश संसदीय अधिनियम था।',
  },
  keyConcepts: [
    {
      title: { en: 'Parliamentary regulation, not Crown rule' },
      body: {
        en: 'The Act regulated Company affairs through Parliament. India did not pass to direct Crown government until 1858.',
      },
    },
    {
      title: { en: 'Governor-General of Bengal' },
      body: {
        en: 'Warren Hastings became the first Governor-General under the new framework from 1774, assisted by a four-member Executive Council.',
      },
    },
    {
      title: { en: 'Supreme Court authorisation vs establishment' },
      body: {
        en: 'The 1773 Act authorised the Supreme Court at Fort William; the Charter inaugurated it on 26 March 1774.',
      },
    },
  ],
  constitutionalPoints: [
    {
      title: { en: 'Centralising tendency' },
      body: {
        en: 'The Governor-General and Council could superintend Bombay and Madras in defined matters of war, peace, and revenue.',
      },
    },
    {
      title: { en: 'Act of Settlement 1781' },
      body: {
        en: 'Corrective legislation that clarified Supreme Court jurisdiction over revenue and executive acts of the Company government.',
      },
    },
  ],
  misconceptions: [
    {
      myth: { en: 'Governor-General of India was created in 1773.' },
      reality: {
        en: 'The office created was Governor-General of Bengal. The India-wide title came much later.',
      },
    },
    {
      myth: { en: 'Supreme Court was established in 1773.' },
      reality: {
        en: '1773 authorised it; establishment by Royal Charter was on 26 March 1774.',
      },
    },
  ],
  memoryAids: [
    {
      label: { en: '1773 → 1774 → 1781' },
      tip: {
        en: 'Regulate (1773) → Court opens (1774) → Correct conflicts (1781).',
      },
    },
    {
      label: { en: 'GG of Bengal, not India' },
      tip: {
        en: 'Associate Warren Hastings with Bengal (1774), not the 1858 Crown framework.',
      },
    },
  ],
  summary: {
    en: 'The Regulating Act, 1773 began parliamentary control over Company rule: Governor-General and Council for Bengal, Supreme Court at Fort William, supervisory powers over presidencies, and accountability rules. Limitations led to the Act of Settlement 1781.',
  },
  officialSources: [
    {
      title: getSource('regulating-act-1773').title,
      url: getSource('regulating-act-1773').url,
      institution: getSource('regulating-act-1773').institution,
      citation: getSource('regulating-act-1773').locator,
    },
    {
      title: getSource('act-of-settlement-1781').title,
      url: getSource('act-of-settlement-1781').url,
      institution: getSource('act-of-settlement-1781').institution,
      citation: getSource('act-of-settlement-1781').locator,
    },
    {
      title: getSource('nios-constitutional-development').title,
      url: getSource('nios-constitutional-development').url,
      institution: getSource('nios-constitutional-development').institution,
      citation: getSource('nios-constitutional-development').locator,
    },
    {
      title: getSource('uk-parliament-eic').title,
      url: getSource('uk-parliament-eic').url,
      institution: getSource('uk-parliament-eic').institution,
    },
  ],
  includeQuestionBankSources: true,
};

export const REGULATING_ACT_RICH_REVISION_SLUG = 'regulating-act-1773';
