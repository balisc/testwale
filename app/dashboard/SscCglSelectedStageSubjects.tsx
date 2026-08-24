'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import SscCglNodeIcon from '@/app/ssc-cgl/SscCglNodeIcon';
import {
  getSscCglTopicsHref,
  type SscCglStageTaxonomy,
} from '@/lib/sscCglSyllabus';
import { pickCatalogText } from '@/lib/useCatalogText';

export default function SscCglSelectedStageSubjects({
  taxonomy,
  language,
}: {
  taxonomy: SscCglStageTaxonomy;
  language: 'en' | 'hi';
}) {
  const stageName = pickCatalogText(taxonomy.stage.label, language) || taxonomy.stage.code;
  const copy = language === 'hi'
    ? {
        selected: 'आपका चुना हुआ SSC CGL चरण',
        heading: `${stageName} के विषय`,
        supporting: 'किसी विषय पर क्लिक करके उसके टॉपिक, फिर उप-विषय और प्रश्न खोलें।',
        change: 'टियर बदलें',
        topics: 'टॉपिक',
        subtopics: 'उप-विषय',
        explore: 'टॉपिक देखें',
        empty: 'इस चुने हुए चरण के विषय अभी उपलब्ध नहीं हैं।',
      }
    : {
        selected: 'Your selected SSC CGL stage',
        heading: `${stageName} subjects`,
        supporting: 'Choose a subject, then continue through topics, subtopics and questions.',
        change: 'Change tier',
        topics: 'topics',
        subtopics: 'subtopics',
        explore: 'Explore topics',
        empty: 'Subjects for this selected stage are not available yet.',
      };

  return (
    <section
      id="ssc-cgl-selected-subjects"
      className="mt-12 scroll-mt-24 overflow-hidden rounded-[2rem] border border-violet-100 bg-white p-5 shadow-[0_18px_60px_rgba(76,29,149,0.06)] sm:p-8 lg:p-10"
      aria-labelledby="ssc-cgl-selected-subjects-heading"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {copy.selected} · {stageName}
          </span>
          <h2
            id="ssc-cgl-selected-subjects-heading"
            className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl"
          >
            {copy.heading}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">{copy.supporting}</p>
        </div>
        <Link
          href="/onboarding?edit=1&returnTo=%2Fdashboard"
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 px-4 text-sm font-bold text-violet-700 transition hover:border-violet-300 hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
        >
          {copy.change}
        </Link>
      </div>

      {taxonomy.subjects.length === 0 ? (
        <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
          {copy.empty}
        </div>
      ) : (
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {taxonomy.subjects.map((subject) => {
            const subtopicCount = subject.topics.reduce(
              (total, topic) => total + topic.subtopics.length,
              0,
            );
            return (
              <Link
                key={subject.id}
                href={getSscCglTopicsHref(taxonomy.stage, subject.slug)}
                className="group flex min-h-40 min-w-0 items-center gap-4 rounded-3xl border border-slate-200 bg-[#FCFBFF] p-5 transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 sm:p-6"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <SscCglNodeIcon code={subject.code} className="h-7 w-7" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-lg font-extrabold text-slate-950">
                    {pickCatalogText(subject.title, language) || subject.code}
                  </span>
                  <span className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-violet-700">
                      <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                      {subject.topics.length} {copy.topics}
                    </span>
                    <span>{subtopicCount} {copy.subtopics}</span>
                  </span>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-violet-700">
                    {copy.explore}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
