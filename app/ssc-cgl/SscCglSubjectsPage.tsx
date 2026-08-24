'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { getSscCglTopicsHref, type SscCglStageTaxonomy } from '@/lib/sscCglSyllabus';
import { pickCatalogText } from '@/lib/useCatalogText';
import SscCglNodeIcon from './SscCglNodeIcon';
import SscCglPageHeader from './SscCglPageHeader';
import SscCglPaperTabs from './SscCglPaperTabs';

export default function SscCglSubjectsPage({ taxonomy }: { taxonomy: SscCglStageTaxonomy }) {
  const { language } = useLanguage();
  const { stage } = taxonomy;
  const stageName = pickCatalogText(stage.label, language);
  const copy = language === 'hi'
    ? {
        home: 'होम',
        exams: 'परीक्षाएँ',
        choose: 'विषय चुनें',
        instruction: 'इसके टॉपिक देखने के लिए एक विषय चुनें।',
        back: 'टियर चयन पर वापस जाएँ',
        topics: 'टॉपिक',
        explore: 'टॉपिक देखें',
        empty: 'इस परीक्षा चरण के लिए अभी कोई विषय उपलब्ध नहीं है।',
      }
    : {
        home: 'Home',
        exams: 'Exams',
        choose: 'Choose a Subject',
        instruction: 'Select one subject to explore its topics.',
        back: 'Back to Tier Selection',
        topics: 'Topics',
        explore: 'Explore Topics',
        empty: 'No subjects are available for this exam stage yet.',
      };

  return (
    <main className="min-h-screen w-full min-w-0 max-w-full bg-[#F8FAFC] px-4 py-6 text-slate-900 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-6xl">
        <SscCglPageHeader
          activeStep={2}
          breadcrumbs={[
            { label: copy.home, href: '/' },
            { label: copy.exams },
            { label: 'SSC CGL', href: '/ssc-cgl' },
            { label: stageName },
          ]}
          backHref="/ssc-cgl"
          backLabel={copy.back}
          context={`SSC CGL · ${stageName}`}
        />
        {stage.tier === 'tier-2' ? <SscCglPaperTabs stage={stage} /> : null}
        <section id="ssc-cgl-subjects-panel" role="tabpanel" aria-labelledby={stage.tier === 'tier-2' ? `ssc-cgl-${stage.paper}-tab` : undefined} className="mt-6 w-full min-w-0 max-w-full" tabIndex={stage.tier === 'tier-2' ? 0 : undefined}>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">{copy.choose}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{copy.instruction}</p>
          {taxonomy.subjects.length === 0 ? (
            <EmptyState message={copy.empty} />
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {taxonomy.subjects.map((subject) => {
                const description = pickCatalogText(subject.description, language);
                return (
                  <Link key={subject.id} href={getSscCglTopicsHref(stage, subject.slug)} className="group flex min-h-32 w-full min-w-0 max-w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-violet-300 hover:bg-violet-50/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 sm:gap-4 sm:p-5">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><SscCglNodeIcon code={subject.code} className="h-7 w-7" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-base font-extrabold text-slate-950 sm:text-lg">{pickCatalogText(subject.title, language) || subject.code}</span>
                      {description ? <span className="mt-1 block break-words text-sm leading-5 text-slate-600">{description}</span> : null}
                      <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">{subject.topics.length} {copy.topics}</span>
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
