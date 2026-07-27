import type { RevisionDocument } from '@/lib/revision/types';

/**
 * Substantial SEO revision for Topic 3 / Subtopic 1 (structured source_metadata in bank).
 * Original QuestionWale study notes — verifies against official diglot text and SC PDFs without copying judgments.
 */
export const preambleMeaningImportanceRevision: RevisionDocument = {
  subjectSlug: 'indian-polity',
  topicSlug: 'constitution-basics-preamble-schedules',
  subtopicSlug: 'preamble-words-ideals-legal-status',
  version: 'indian-polity/preamble-union-citizenship/preamble-meaning-importance.seo.v1',
  status: 'published',
  estimatedMinutes: 10,
  lastReviewed: '2026-07-15',
  seo: {
    title: 'Preamble Meaning and Importance — Revision Notes',
    description:
      'Revise what the Preamble does: identity of We the People, constitutional ideals, interpretive guidance, and limits. Links to the official Constitution and Supreme Court PDFs.',
  },
  title: {
    en: 'Preamble — Meaning and Importance',
    hi: 'प्रस्तावना — अर्थ और महत्व',
  },
  overview: {
    en: 'The Preamble is the Constitution’s opening statement of purpose. It identifies the ultimate source of constitutional authority (“We, the People of India”), declares the nature of the Republic, and lists justice, liberty, equality and fraternity as guiding ideals. Courts have treated it as part of the Constitution and as an aid to interpretation — not as a free-standing source of legislative power.',
  },
  keyConcepts: [
    {
      title: { en: 'What a preamble does' },
      body: {
        en: 'A preamble introduces the polity that the document creates. India’s Preamble announces the kind of State (sovereign, socialist, secular, democratic republic) and the ends the Constitution seeks for citizens. It is not a catalogue of enforceable article numbers; those live in the operative Parts that follow.',
      },
    },
    {
      title: { en: '“We, the People of India”' },
      body: {
        en: 'The opening words locate sovereignty in the people. Textbook explanations stress that constitutional power and authority flow from the people, not from an external grant. Exam traps often suggest the Crown, Parliament alone, or the courts as the ultimate source — reject those without textual support.',
      },
    },
    {
      title: { en: 'Adoption clause and date' },
      body: {
        en: 'The Preamble records that the people of India adopt, enact and give to themselves the Constitution, with the Constituent Assembly’s action date. That clause is historical and legitimating; it does not create an independent amending power outside Article 368.',
      },
    },
    {
      title: { en: 'Interpretive role' },
      body: {
        en: 'When operative text is ambiguous, courts may look to the Preamble’s ideals to choose a construction that better fits the constitutional scheme. The Preamble clarifies spirit and purpose; it does not rewrite clear Articles or invent new justiciable rights by itself.',
      },
    },
  ],
  constitutionalPoints: [
    {
      title: { en: 'Part of the Constitution' },
      body: {
        en: 'Authoritative case law treats the Preamble as part of the Constitution. That status supports its use in interpretation and basic-structure conversations, while still denying it a free-wheeling power to invalidate ordinary legislation on its own.',
      },
    },
    {
      title: { en: 'Not an independent power clause' },
      body: {
        en: 'The Preamble does not authorise Parliament or the Executive to do whatever advances “justice” or “equality” without a supporting provision. Powers remain grounded in specific Articles, Lists and statutes.',
      },
    },
    {
      title: { en: 'Bridge to Parts III and IV' },
      body: {
        en: 'Ideals in the Preamble resonate with Fundamental Rights and Directive Principles. Linking privacy, dignity or welfare themes back to the Preamble is common in modern judgments — still, actionable remedies usually sit in Part III writs and statutes, not in the Preamble alone.',
      },
    },
  ],
  misconceptions: [
    {
      myth: { en: 'The Preamble can strike down any law that “feels unjust”.' },
      reality: {
        en: 'Courts use the Preamble as guidance; invalidation ordinarily needs Part III or other enforceable provisions. Treat “Preamble alone is enough to void a statute” as a high-risk option.',
      },
    },
    {
      myth: { en: 'Because it comes before Article 1, the Preamble is outside the Constitution.' },
      reality: {
        en: 'Placement before Part I does not make it non-constitutional. Official diglot editions print the Preamble as the enacted opening text, and case law affirms its constitutional status.',
      },
    },
    {
      myth: { en: 'Every keyword in the Preamble was always there since 26 November 1949.' },
      reality: {
        en: 'Some describing words were inserted later by amendment (notably in the early 1970s). Separate “original text” questions from “present text” questions when options emphasise chronology.',
      },
    },
  ],
  memoryAids: [
    {
      label: { en: 'Three jobs' },
      tip: {
        en: 'Identity (We the People) + Nature of State + Ideals — then stop. Do not invent powers.',
      },
    },
    {
      label: { en: 'Exam switch' },
      tip: {
        en: 'If the stem says “source of authority” → people. If it says “justiciable right” → look to Part III, not the Preamble alone.',
      },
    },
    {
      label: { en: 'Text before keywords drill' },
      tip: {
        en: 'Master meaning and importance first; then drill Sovereign–Socialist–Secular–Democratic–Republic and Justice–Liberty–Equality–Fraternity as the next subtopics.',
      },
    },
  ],
  summary: {
    en: 'Treat the Preamble as the Constitution’s purpose statement and interpretive compass. It is part of the Constitution, it names the people’s authority, and it frames ideals — without replacing Articles as the home of enforceable power and remedies. Verify wording in the Legislative Department diglot and use Supreme Court PDFs only for pinpoint para locators.',
  },
  officialSources: [
    {
      title: 'The Constitution of India (diglot, as on 1 May 2026)',
      institution: 'Government of India, Legislative Department',
      url: 'https://www.legislative.gov.in/static/uploads/2025/07/88cca69e868e50b217f855be2fb8bdba.pdf',
      citation: 'Preamble text and opening pages before Part I',
    },
    {
      title: 'NCERT — Indian Constitution at Work, Class XI',
      institution: 'National Council of Educational Research and Training',
      url: 'https://ncert.nic.in/textbook/pdf/keps201.pdf',
      citation: 'Chapter 1 discussion of constitutional authority and design',
    },
    {
      title: 'Justice K.S. Puttaswamy (Retd.) v. Union of India (Supreme Court PDF)',
      institution: 'Supreme Court of India',
      url: 'https://api.sci.gov.in/supremecourt/2012/35071/35071_2012_Judgement_24-Aug-2017.pdf',
      citation: 'Paragraphs discussing Preamble ideals with Parts III and IV',
    },
  ],
  includeQuestionBankSources: true,
};
