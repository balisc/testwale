'use client';

import Link from 'next/link';
import VerifiedOfficialSourcesDetails from '@/components/revision/VerifiedOfficialSourcesDetails';
import type { LocalizedText } from '@/lib/localizedText';
import { getLocalizedText } from '@/lib/localizedText';
import { useCatalogText } from '@/lib/useCatalogText';
import { useLanguage } from '@/lib/LanguageContext';
import { uiLabel } from '@/components/revision/company-rule-and-early-acts/uiLabel';
import type { RevisionBiText, RevisionDocument, RelatedRevisionLink } from '@/lib/revision/types';
import type { RevisionOfficialSource } from '@/lib/revision/types';

function t(value: RevisionBiText, locale: 'en' | 'hi'): string {
  return getLocalizedText(value, locale);
}

type RevisionPageViewProps = {
  doc: RevisionDocument;
  breadcrumb: {
    subjectHref: string;
    subjectTitle: LocalizedText;
    topicHref: string;
    topicTitle: LocalizedText;
    subtopicTitle: LocalizedText;
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
  const { language } = useLanguage();
  const subjectLabel = useCatalogText(breadcrumb.subjectTitle);
  const topicLabel = useCatalogText(breadcrumb.topicTitle);
  const subtopicLabel = useCatalogText(breadcrumb.subtopicTitle);

  return (
    <article className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
      <nav className="mb-6 text-sm text-slate-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="transition hover:text-brand">
              {uiLabel(language, 'Home', 'होम')}
            </Link>
          </li>
          <li aria-hidden className="text-slate-300">
            /
          </li>
          <li>
            <Link href={breadcrumb.subjectHref} className="transition hover:text-brand">
              {subjectLabel}
            </Link>
          </li>
          <li aria-hidden className="text-slate-300">
            /
          </li>
          <li>
            <Link href={breadcrumb.topicHref} className="transition hover:text-brand">
              {topicLabel}
            </Link>
          </li>
          <li aria-hidden className="text-slate-300">
            /
          </li>
          <li className="font-medium text-slate-700">{subtopicLabel}</li>
        </ol>
      </nav>

      <header className="border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
          {uiLabel(language, `Revision notes · ~${doc.estimatedMinutes} min`, `रिवीजन नोट्स · ~${doc.estimatedMinutes} मिनट`)}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {t(doc.title, language)}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">{t(doc.overview, language)}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={practiceHref}
            className="inline-flex items-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {uiLabel(language, 'Practice this subtopic', 'इस उप-विषय का अभ्यास करें')}
          </Link>
          <Link
            href={breadcrumb.topicHref}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand/40 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {uiLabel(language, `Back to ${topicLabel}`, `${topicLabel} पर वापस`)}
          </Link>
        </div>
      </header>

      <section className="mt-10" aria-labelledby="key-concepts-heading">
        <h2 id="key-concepts-heading" className="text-xl font-bold text-slate-900">
          {uiLabel(language, 'Key concepts', 'मुख्य अवधारणाएँ')}
        </h2>
        <ul className="mt-4 space-y-4">
          {doc.keyConcepts.map((item) => (
            <li key={t(item.title, language)} className="leading-relaxed">
              <h3 className="text-base font-semibold text-slate-900">{t(item.title, language)}</h3>
              <p className="mt-1 text-sm text-slate-600 sm:text-base">{t(item.body, language)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="constitutional-heading">
        <h2 id="constitutional-heading" className="text-xl font-bold text-slate-900">
          {uiLabel(language, 'Important constitutional points', 'महत्वपूर्ण संवैधानिक बिंदु')}
        </h2>
        <ul className="mt-4 space-y-4">
          {doc.constitutionalPoints.map((item) => (
            <li key={t(item.title, language)} className="leading-relaxed">
              <h3 className="text-base font-semibold text-slate-900">{t(item.title, language)}</h3>
              <p className="mt-1 text-sm text-slate-600 sm:text-base">{t(item.body, language)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="misconceptions-heading">
        <h2 id="misconceptions-heading" className="text-xl font-bold text-slate-900">
          {uiLabel(language, 'Common misconceptions', 'आम गलतफहमियाँ')}
        </h2>
        <ul className="mt-4 space-y-4">
          {doc.misconceptions.map((item) => (
            <li key={t(item.myth, language)} className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">
                <span className="text-slate-500">{uiLabel(language, 'Myth: ', 'मिथक: ')}</span>
                {t(item.myth, language)}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-800">{uiLabel(language, 'Reality: ', 'सच्चाई: ')}</span>
                {t(item.reality, language)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="memory-heading">
        <h2 id="memory-heading" className="text-xl font-bold text-slate-900">
          {uiLabel(language, 'Memory aids', 'स्मरण सहायक')}
        </h2>
        <ul className="mt-4 space-y-3">
          {doc.memoryAids.map((item) => (
            <li key={t(item.label, language)} className="text-sm leading-relaxed text-slate-700 sm:text-base">
              <span className="font-semibold text-slate-900">{t(item.label, language)}: </span>
              {t(item.tip, language)}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="text-xl font-bold text-slate-900">
          {uiLabel(language, 'Revision summary', 'रिवीजन सारांश')}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{t(doc.summary, language)}</p>
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
        <h2 className="text-lg font-bold text-slate-900">{uiLabel(language, 'Ready to practise?', 'अभ्यास के लिए तैयार?')}</h2>
        <p className="mt-2 text-sm text-slate-600">
          {uiLabel(
            language,
            `Apply these ideas in the full MCQ set for ${subtopicLabel}. Practice sessions stay separate from this public revision page.`,
            `इन विचारों को ${subtopicLabel} के पूर्ण MCQ सेट में लागू करें। अभ्यास सत्र इस सार्वजनिक रिवीजन पेज से अलग रहते हैं।`,
          )}
        </p>
        <Link
          href={practiceHref}
          className="mt-4 inline-flex items-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          {uiLabel(language, `Practice ${subtopicLabel} questions`, `${subtopicLabel} के प्रश्नों का अभ्यास करें`)}
        </Link>
      </section>

      {related.length > 0 ? (
        <section className="mt-10" aria-labelledby="related-heading">
          <h2 id="related-heading" className="text-xl font-bold text-slate-900">
            {uiLabel(language, 'Related links', 'संबंधित लिंक')}
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
