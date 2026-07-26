import { companyRuleEarlyActsRevision } from '@/content/revision/indian-polity/company-rule-and-early-acts.seo';
import { preambleMeaningImportanceRevision } from '@/content/revision/indian-polity/preamble-meaning-importance.seo';
import { regulatingAct1773Revision } from '@/content/revision/indian-polity/regulating-act-1773.seo';
import { sourcesOfIndianConstitutionRevision } from '@/content/revision/indian-polity/sources-of-indian-constitution.seo';
import { canonicalRevisionSubtopicSlug } from '@/lib/revision/richRevision';
import type { RevisionDocument } from '@/lib/revision/types';
/** All revision modules that exist in the repo (published or draft). */
export const REVISION_DOCUMENTS: RevisionDocument[] = [
  sourcesOfIndianConstitutionRevision,
  preambleMeaningImportanceRevision,
  regulatingAct1773Revision,
  companyRuleEarlyActsRevision,
];

function matchKey(subjectSlug: string, topicSlug: string, subtopicSlug: string) {
  return `${subjectSlug}::${topicSlug}::${subtopicSlug}`.toLowerCase();
}

const byKey = new Map(
  REVISION_DOCUMENTS.map((doc) => [matchKey(doc.subjectSlug, doc.topicSlug, doc.subtopicSlug), doc]),
);

export function getRevisionDocument(
  subjectSlug: string,
  topicSlug: string,
  subtopicSlug: string,
): RevisionDocument | null {
  const canonical = canonicalRevisionSubtopicSlug(subtopicSlug);
  return byKey.get(matchKey(subjectSlug, topicSlug, canonical)) ?? null;
}

/** Indexable, sitemapped revision pages only. */
export function getPublishedRevision(
  subjectSlug: string,
  topicSlug: string,
  subtopicSlug: string,
): RevisionDocument | null {
  const doc = getRevisionDocument(subjectSlug, topicSlug, subtopicSlug);
  return doc?.status === 'published' ? doc : null;
}

export function isRevisionPublished(
  subjectSlug: string,
  topicSlug: string,
  subtopicSlug: string,
): boolean {
  return Boolean(getPublishedRevision(subjectSlug, topicSlug, subtopicSlug));
}

export function listPublishedRevisionDocs(): RevisionDocument[] {
  return REVISION_DOCUMENTS.filter((doc) => doc.status === 'published');
}

export function hasPublishedRevisionForTopic(subjectSlug: string, topicSlug: string): boolean {
  const subject = String(subjectSlug ?? '').trim().toLowerCase();
  const topic = String(topicSlug ?? '').trim().toLowerCase();
  return REVISION_DOCUMENTS.some(
    (doc) =>
      doc.status === 'published' &&
      doc.subjectSlug.toLowerCase() === subject &&
      doc.topicSlug.toLowerCase() === topic,
  );
}

export function hasPublishedRevisionForSubject(subjectSlug: string): boolean {
  const subject = String(subjectSlug ?? '').trim().toLowerCase();
  return REVISION_DOCUMENTS.some(
    (doc) => doc.status === 'published' && doc.subjectSlug.toLowerCase() === subject,
  );
}

export function publishedRevisionPath(doc: RevisionDocument): string {
  return `/subjects/${doc.subjectSlug}/${doc.topicSlug}/${doc.subtopicSlug}/revision`;
}
