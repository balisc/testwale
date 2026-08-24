'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import {
  getSscCglSubtopicsHref,
  getSscCglTopicsHref,
  type SscCglStageDefinition,
  type SscCglSubject,
  type SscCglSubtopic,
  type SscCglTopic,
} from '@/lib/sscCglSyllabus';
import { pickCatalogText } from '@/lib/useCatalogText';

export default function SscCglPracticeHeader({
  stage,
  subject,
  topic,
  subtopic,
}: {
  stage: SscCglStageDefinition;
  subject: SscCglSubject;
  topic: SscCglTopic;
  subtopic: SscCglSubtopic;
}) {
  const { language } = useLanguage();
  const subjectHref = getSscCglTopicsHref(stage, subject.slug);
  const topicHref = getSscCglSubtopicsHref(stage, subject.slug, topic.slug);
  const items = [
    { label: language === 'hi' ? 'होम' : 'Home', href: '/' },
    { label: language === 'hi' ? 'परीक्षाएँ' : 'Exams', href: null },
    { label: 'SSC CGL', href: '/ssc-cgl' },
    { label: pickCatalogText(stage.label, language), href: stage.href },
    { label: pickCatalogText(subject.title, language), href: subjectHref },
    { label: pickCatalogText(topic.title, language), href: topicHref },
    { label: pickCatalogText(subtopic.title, language), href: null },
  ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl px-4 pt-6 sm:px-6">
      <nav aria-label={language === 'hi' ? 'पाठ्यक्रम पथ' : 'Syllabus breadcrumb'} className="w-full min-w-0 max-w-full">
        <ol className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-slate-500 sm:text-sm">
          {items.map((item, index) => (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden="true" /> : null}
              {item.href ? (
                <Link href={item.href} className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-1 font-semibold hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2">
                  {index === 0 ? <Home className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                  {item.label}
                </Link>
              ) : (
                <span className={index === items.length - 1 ? 'max-w-52 truncate font-bold text-violet-700' : 'font-medium'} aria-current={index === items.length - 1 ? 'page' : undefined}>{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <section className="mt-4 w-full min-w-0 max-w-full rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-6" aria-labelledby="ssc-cgl-practice-heading">
        <Link href={topicHref} className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-bold text-violet-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {language === 'hi' ? 'सभी उपविषय' : 'All Subtopics'}
        </Link>
        <h2 id="ssc-cgl-practice-heading" className="mt-2 break-words text-xl font-extrabold text-slate-950 sm:text-2xl">{pickCatalogText(subtopic.title, language) || subtopic.code}</h2>
      </section>
    </div>
  );
}
