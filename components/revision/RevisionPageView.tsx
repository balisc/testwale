import Link from 'next/link';
import VerifiedOfficialSourcesDetails from '@/components/revision/VerifiedOfficialSourcesDetails';
import { getLocalizedText } from '@/lib/localizedText';
import type { RevisionBiText, RevisionDocument, RelatedRevisionLink } from '@/lib/revision/types';
import type { RevisionOfficialSource } from '@/lib/revision/types';

function t(value: RevisionBiText): string {
  return getLocalizedText(value, 'en');
}

type RevisionPageViewProps = {
  doc: RevisionDocument;
  breadcrumb: {
    subjectHref: string;
    subjectTitle: string;
    topicHref: string;
    topicTitle: string;
    subtopicTitle: string;
  };
  practiceHref: string;
  sources: RevisionOfficialSource[];
  related: RelatedRevisionLink[];
};

export default function RevisionPageView({
  doc,
  breadcrumb,
  practiceHref,
  sources,
  related,
}: RevisionPageViewProps) {
  return (
    <article className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
      <nav className="mb-6 text-sm text-slate-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="transition hover:text-brand">
              Home
            </Link>
          </li>
          <li aria-hidden className="text-slate-300">
            /
          </li>
          <li>
            <Link href={breadcrumb.subjectHref} className="transition hover:text-brand">
              {breadcrumb.subjectTitle}
            </Link>
          </li>
          <li aria-hidden className="text-slate-300">
            /
          </li>
          <li>
            <Link href={breadcrumb.topicHref} className="transition hover:text-brand">
              {breadcrumb.topicTitle}
            </Link>
          </li>
          <li aria-hidden className="text-slate-300">
            /
          </li>
          <li className="font-medium text-slate-700">{breadcrumb.subtopicTitle}</li>
        </ol>
      </nav>

      <header className="border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
          Revision notes · ~{doc.estimatedMinutes} min
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {t(doc.title)}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">{t(doc.overview)}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={practiceHref}
            className="inline-flex items-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Practice this subtopic
          </Link>
          <Link
            href={breadcrumb.topicHref}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand/40 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Back to {breadcrumb.topicTitle}
          </Link>
        </div>
      </header>

      <section className="mt-10" aria-labelledby="key-concepts-heading">
        <h2 id="key-concepts-heading" className="text-xl font-bold text-slate-900">
          Key concepts
        </h2>
        <ul className="mt-4 space-y-4">
          {doc.keyConcepts.map((item) => (
            <li key={t(item.title)} className="leading-relaxed">
              <h3 className="text-base font-semibold text-slate-900">{t(item.title)}</h3>
              <p className="mt-1 text-sm text-slate-600 sm:text-base">{t(item.body)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="constitutional-heading">
        <h2 id="constitutional-heading" className="text-xl font-bold text-slate-900">
          Important constitutional points
        </h2>
        <ul className="mt-4 space-y-4">
          {doc.constitutionalPoints.map((item) => (
            <li key={t(item.title)} className="leading-relaxed">
              <h3 className="text-base font-semibold text-slate-900">{t(item.title)}</h3>
              <p className="mt-1 text-sm text-slate-600 sm:text-base">{t(item.body)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="misconceptions-heading">
        <h2 id="misconceptions-heading" className="text-xl font-bold text-slate-900">
          Common misconceptions
        </h2>
        <ul className="mt-4 space-y-4">
          {doc.misconceptions.map((item) => (
            <li key={t(item.myth)} className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">
                <span className="text-slate-500">Myth: </span>
                {t(item.myth)}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-800">Reality: </span>
                {t(item.reality)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="memory-heading">
        <h2 id="memory-heading" className="text-xl font-bold text-slate-900">
          Memory aids
        </h2>
        <ul className="mt-4 space-y-3">
          {doc.memoryAids.map((item) => (
            <li key={t(item.label)} className="text-sm leading-relaxed text-slate-700 sm:text-base">
              <span className="font-semibold text-slate-900">{t(item.label)}: </span>
              {t(item.tip)}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="text-xl font-bold text-slate-900">
          Revision summary
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{t(doc.summary)}</p>
      </section>

      <section className="mt-10" aria-labelledby="sources-heading">
        <h2 id="sources-heading" className="sr-only">
          Verified official sources
        </h2>
        <VerifiedOfficialSourcesDetails sources={sources} />
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Sources support factual verification. QuestionWale notes are original study material and do
          not reproduce copyrighted textbook or judgment text.
        </p>
      </section>

      <section className="mt-10 rounded-2xl border border-[#EDE9FE] bg-[#FAF5FF] px-5 py-6">
        <h2 className="text-lg font-bold text-slate-900">Ready to practise?</h2>
        <p className="mt-2 text-sm text-slate-600">
          Apply these ideas in the full MCQ set for {breadcrumb.subtopicTitle}. Practice sessions stay
          separate from this public revision page.
        </p>
        <Link
          href={practiceHref}
          className="mt-4 inline-flex items-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          Practice {breadcrumb.subtopicTitle} questions
        </Link>
      </section>

      {related.length > 0 ? (
        <section className="mt-10" aria-labelledby="related-heading">
          <h2 id="related-heading" className="text-xl font-bold text-slate-900">
            Related links
          </h2>
          <ul className="mt-4 space-y-2">
            {related.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm font-medium text-brand underline-offset-2 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
