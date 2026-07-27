import type { RevisionDocument } from '@/lib/revision/types';

/**
 * Substantial SEO revision for Topic 2 / Subtopic 2 (legacy + curated sources).
 * Original QuestionWale study notes — cites official materials; does not reproduce them.
 */
export const sourcesOfIndianConstitutionRevision: RevisionDocument = {
  subjectSlug: 'indian-polity',
  topicSlug: 'constitution-basics-preamble-schedules',
  subtopicSlug: 'constitution-features-sources-comparison',
  version: 'indian-polity/constitution-basics/sources-of-indian-constitution.seo.v1',
  status: 'published',
  estimatedMinutes: 12,
  lastReviewed: '2026-07-14',
  seo: {
    title: 'Sources of the Indian Constitution — Revision Notes',
    description:
      'Revise how India adapted British, US, Irish, French and Canadian ideas with nationalist and colonial experience. Official NCERT and Constitution links included.',
  },
  title: {
    en: 'Sources of the Indian Constitution',
    hi: 'भारतीय संविधान के स्रोत',
  },
  overview: {
    en: 'The Indian Constitution was not copied from one country. It grew from four streams: nationalist democratic commitments, colonial institutional experience (including the Government of India Act, 1935), Constituent Assembly deliberation, and carefully adapted foreign traditions. The exam-safe frame is selection, scrutiny and Indian adaptation — not blind copying.',
    hi: 'भारतीय संविधान किसी एक देश की नकल नहीं है। यह चार धाराओं से बना: राष्ट्रीय लोकतांत्रिक प्रतिबद्धताएँ, औपनिवेशिक संस्थागत अनुभव (भारत शासन अधिनियम, 1935 सहित), संविधान सभा का विमर्श, और सोच-समझकर अनुकूलित विदेशी परंपराएँ।',
  },
  keyConcepts: [
    {
      title: { en: 'Britain' },
      body: {
        en: 'Associated influences in standard exam mapping: First Past the Post, parliamentary government, rule of law, Speaker’s role, and law-making procedure. Keep these distinct from judicial review (US) and residuary powers (Canada).',
      },
    },
    {
      title: { en: 'United States' },
      body: {
        en: 'Associated influences: charter of Fundamental Rights, judicial review, and independence of the judiciary. Today Part III and writ jurisdictions (for example Articles 32 and 226) are the Indian legal home of rights-related practice.',
      },
    },
    {
      title: { en: 'Ireland, France and Canada' },
      body: {
        en: 'Ireland is linked with Directive Principles; France with Liberty–Equality–Fraternity ideals reflected in the Preamble; Canada with a strong-Centre quasi-federal flavour and residuary powers. Treat inspiration as separate from the present Indian controlling provision.',
      },
    },
    {
      title: { en: 'Indian historical stream' },
      body: {
        en: 'The freedom struggle, the 1928 Motilal Nehru–led constitutional draft, the 1931 Karachi Resolution, and Constituent Assembly debates show that many democratic commitments existed before formal drafting. Colonial legislative experience supplied institutional know-how without making colonial texts the sole source.',
      },
    },
  ],
  constitutionalPoints: [
    {
      title: { en: 'Inspiration versus operation' },
      body: {
        en: 'Questions ask either “where did the idea come from?” or “where does it operate in the Constitution today?” Those answers differ. Example: Dual federal inspiration clusters can map historically to Canada, while residuary competence today is read with Article 248 and Union List Entry 97.',
      },
    },
    {
      title: { en: 'Part III and Part IV cluster traps' },
      body: {
        en: 'Fundamental Rights and Directive Principles are frequently swapped in options. Rights sit in Part III; Directive Principles in Part IV. Article 37 describes Directive Principles as fundamental in governance while keeping them non-justiciable.',
      },
    },
    {
      title: { en: 'Constituent Assembly method' },
      body: {
        en: 'Drafting under Dr. B. R. Ambedkar’s Drafting Committee used clause-by-clause scrutiny and considered thousands of amendments. Assembly debates remain an interpretive aid — not a substitute for the enacted text.',
      },
    },
  ],
  misconceptions: [
    {
      myth: { en: 'India copied its Constitution wholesale from Britain or the USA.' },
      reality: {
        en: 'India selected features, tested suitability, debated them, and adapted them to Indian conditions. Exclusive words such as only, entirely, unchanged, or blindly copied are warning signals in options.',
      },
    },
    {
      myth: { en: 'Judicial review belongs with Britain because Britain also has courts.' },
      reality: {
        en: 'In the standard source map used for exams, judicial review and judicial independence are linked with the United States tradition, not Britain.',
      },
    },
    {
      myth: { en: 'The Government of India Act, 1935 is the only source of the Constitution.' },
      reality: {
        en: 'The Act is important for many institutional details and procedures, but it sits alongside nationalist commitments, Assembly deliberation, and adapted foreign features.',
      },
    },
  ],
  memoryAids: [
    {
      label: { en: 'Britain cluster' },
      tip: { en: 'Speaker + Law + FPTP + Rule of law inside a parliamentary frame.' },
    },
    {
      label: { en: 'United States cluster' },
      tip: { en: 'Rights reviewed by independent judges.' },
    },
    {
      label: { en: 'Ireland / France / Canada' },
      tip: {
        en: 'Ireland gives Direction; France = LEF; Canada = strong Centre + leftover (residuary) powers.',
      },
    },
    {
      label: { en: 'Timeline spine' },
      tip: {
        en: '28 Draft → 31 Karachi → 35 Institutional Act → 46 Assembly → 49 Adopt → 50 Enforce.',
      },
    },
  ],
  summary: {
    en: 'Remember four streams, keep country clusters clean, and always separate historical inspiration from today’s constitutional provision. Use official NCERT chapters and the Legislative Department diglot Constitution to verify locators — not coaching footnotes.',
  },
  officialSources: [
    {
      title: 'NCERT — Democratic Politics-I, Class IX (Constitutional Design)',
      institution: 'National Council of Educational Research and Training',
      url: 'https://ncert.nic.in/textbook/pdf/iess402.pdf',
      citation: 'Chapter 2; printed pages commonly covering constitutional design themes',
    },
    {
      title: 'NCERT — Indian Constitution at Work, Class XI',
      institution: 'National Council of Educational Research and Training',
      url: 'https://ncert.nic.in/textbook/pdf/keps201.pdf',
      citation: 'Chapter 1: Constitution — Why and How?',
    },
    {
      title: 'Constitution of India — Legislative Department diglot edition',
      institution: 'Government of India, Legislative Department',
      url: 'https://www.legislative.gov.in/static/uploads/2025/07/76b9f1c47176fc65accc160f19c982b7.pdf',
      citation: 'Preamble; Parts III–IV; selected Articles and Seventh Schedule as needed for anchors',
    },
  ],
  includeQuestionBankSources: true,
};
