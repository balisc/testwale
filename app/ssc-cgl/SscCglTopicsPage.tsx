'use client';

import Link from 'next/link';
import { ChevronRight, Layers3 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { getSscCglSubtopicsHref, type SscCglStageTaxonomy, type SscCglSubject } from '@/lib/sscCglSyllabus';
import { pickCatalogText } from '@/lib/useCatalogText';
import SscCglNodeIcon from './SscCglNodeIcon';
import SscCglPageHeader from './SscCglPageHeader';

export default function SscCglTopicsPage({ taxonomy, subject }: { taxonomy: SscCglStageTaxonomy; subject: SscCglSubject }) {
  const { language } = useLanguage();
  const { stage } = taxonomy;
  const stageName = pickCatalogText(stage.label, language);
  const subjectName = pickCatalogText(subject.title, language) || subject.code;
  const description = pickCatalogText(subject.description, language);
  const copy = language === 'hi'
    ? {
        home: 'होम',
        exams: 'परीक्षाएँ',
        back: 'सभी विषय',
        choose: 'टॉपिक चुनें',
        instruction: 'इसके उपविषय देखने के लिए एक टॉपिक चुनें।',
        subtopics: 'उपविषय',
        explore: 'उपविषय देखें',
        empty: 'इस विषय के लिए अभी कोई टॉपिक उपलब्ध नहीं है।',
      }
    : {
        home: 'Home',
        exams: 'Exams',
        back: 'Back to Subjects',
        choose: 'Choose a Topic',
        instruction: 'Select one topic to explore its subtopics.',
        subtopics: 'Subtopics',
        explore: 'Explore Subtopics',
        empty: 'No topics are available for this subject yet.',
      };

  return (
    <main className="min-h-screen w-full min-w-0 max-w-full bg-[#F8FAFC] px-4 py-6 text-slate-900 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-6xl">
        <SscCglPageHeader
          activeStep={3}
          breadcrumbs={[
            { label: copy.home, href: '/' },
            { label: copy.exams },
            { label: 'SSC CGL', href: '/ssc-cgl' },
            { label: stageName, href: stage.href },
            { label: subject.title },
          ]}
          backHref={stage.href}
          backLabel={copy.back}
          context={`SSC CGL · ${stageName}`}
        />
        <section className="mt-6 w-full min-w-0 max-w-full">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><SscCglNodeIcon code={subject.code} className="h-7 w-7" /></span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-violet-700">{stageName}</p>
              <h1 className="mt-1 break-words text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{subjectName}</h1>
              {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
            </div>
          </div>
          <div className="mt-7">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">{copy.choose}</h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">{copy.instruction}</p>
          </div>
          {subject.topics.length === 0 ? (
            <EmptyState message={copy.empty} />
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {subject.topics.map((topic) => {
                const topicDescription = pickCatalogText(topic.description, language);
                return (
                  <Link key={topic.id} href={getSscCglSubtopicsHref(stage, subject.slug, topic.slug)} className="group flex min-h-28 w-full min-w-0 max-w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-violet-300 hover:bg-violet-50/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 sm:gap-4 sm:p-5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><Layers3 className="h-6 w-6" aria-hidden="true" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-words font-extrabold text-slate-950">{pickCatalogText(topic.title, language) || topic.code}</span>
                      {topicDescription ? <span className="mt-1 block break-words text-sm leading-5 text-slate-600">{topicDescription}</span> : null}
                      <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">{topic.subtopics.length} {copy.subtopics}</span>
                    </span>
                    <span className="hidden min-h-10 shrink-0 items-center gap-2 rounded-lg border border-violet-300 px-4 text-sm font-bold text-violet-700 sm:inline-flex">{copy.explore}<ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" /></span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-violet-600 sm:hidden" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">{message}</div>;
}
