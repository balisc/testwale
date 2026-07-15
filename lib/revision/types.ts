/** Bilingual revision copy (English required; Hindi optional). */
export type RevisionBiText = {
  en: string;
  hi?: string;
};

/** Student-safe official source for SSR `<a href>` rendering. */
export type RevisionOfficialSource = {
  title: string;
  url: string;
  institution?: string;
  citation?: string | null;
};

export type RevisionConcept = {
  title: RevisionBiText;
  body: RevisionBiText;
};

export type RevisionMisconception = {
  myth: RevisionBiText;
  reality: RevisionBiText;
};

export type RevisionMemoryAid = {
  label: RevisionBiText;
  tip: RevisionBiText;
};

/**
 * Frontend-owned, publish-gated revision document.
 * Only `status: 'published'` documents are indexable and sitemapped.
 */
export type RevisionDocument = {
  subjectSlug: string;
  topicSlug: string;
  subtopicSlug: string;
  version: string;
  status: 'published' | 'draft';
  estimatedMinutes: number;
  /** ISO date used for sitemap lastModified when available. */
  lastReviewed: string;
  seo: {
    title: string;
    description: string;
  };
  title: RevisionBiText;
  overview: RevisionBiText;
  keyConcepts: RevisionConcept[];
  constitutionalPoints: RevisionConcept[];
  misconceptions: RevisionMisconception[];
  memoryAids: RevisionMemoryAid[];
  summary: RevisionBiText;
  /** Curated official links always present in initial HTML when published. */
  officialSources: RevisionOfficialSource[];
  /**
   * When true, merge safe http(s) links from public question rows
   * (structured metadata preferred; legacy source text otherwise).
   */
  includeQuestionBankSources?: boolean;
};

export type RelatedRevisionLink = {
  href: string;
  title: string;
  kind: 'revision' | 'practice' | 'topic';
};
