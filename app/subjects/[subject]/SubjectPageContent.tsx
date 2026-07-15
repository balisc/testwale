'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FileText, Globe, LayoutList } from 'lucide-react';
import ExamFilterPills from '@/components/ExamFilterPills';
import IconByKey from '@/components/IconByKey';
import { useLanguage } from '@/lib/LanguageContext';
import { pickCatalogText, useCatalogText } from '@/lib/useCatalogText';
import type { Exam, Subject, Topic, TopicWithPriority } from '@/types/polity';
import SubjectTopicGrid from './SubjectTopicGrid';

const COPY = {
  en: {
    home: 'Home',
    subjects: 'Subjects',
    practice: 'PRACTICE',
    topics: 'Topics',
    questions: 'Questions',
    bilingual: 'English + Hindi bilingual MCQs',
  },
  hi: {
    home: 'होम',
    subjects: 'विषय',
    practice: 'अभ्यास',
    topics: 'विषय',
    questions: 'प्रश्न',
    bilingual: 'English + हिंदी द्विभाषी MCQs',
  },
};

type SubjectPageContentProps = {
  subject: Subject;
  subjectSlug: string;
  topics: Topic[] | TopicWithPriority[];
  exams: Exam[];
  examCode: string | null;
  topicCount: number;
  questionCount: number;
};

export default function SubjectPageContent({
  subject,
  subjectSlug,
  topics,
  exams,
  examCode,
  topicCount,
  questionCount,
}: SubjectPageContentProps) {
  const { language } = useLanguage();
  const c = COPY[language];
  const subjectTitle = useCatalogText(subject.title);
  const subjectDescription = useCatalogText(subject.description);

  return (
    <div className="mx-auto max-w-[1240px] px-4 pb-14 pt-6 sm:px-6 lg:px-8">
      <nav className="mb-5 text-sm text-slate-500" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="transition hover:text-brand">
              {c.home}
            </Link>
          </li>
          <li aria-hidden className="text-slate-300">
            /
          </li>
          <li>
            <Link href="/subjects" className="transition hover:text-brand">
              {c.subjects}
            </Link>
          </li>
          <li aria-hidden className="text-slate-300">
            /
          </li>
          <li className="font-medium text-slate-700">{subjectTitle}</li>
        </ol>
      </nav>

      <section className="relative overflow-hidden rounded-3xl border border-[#EDE9FE] bg-gradient-to-br from-[#FAF5FF] via-[#F5F3FF] to-[#EDE9FE]/80 px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        <div className="pointer-events-none absolute -right-8 top-0 h-56 w-56 rounded-full bg-[#7C3AED]/10 blur-3xl" />
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10">
          <div className="relative z-10 min-w-0">
            <span className="inline-flex w-fit shrink-0 rounded-full bg-[#7C3AED] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white sm:text-[11px]">
              {subjectTitle.toUpperCase()} {c.practice}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl lg:text-[2.65rem]">
              {subjectTitle}
            </h1>
            {subjectDescription && (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                {subjectDescription}
              </p>
            )}

            <ExamFilterPills subjectSlug={subjectSlug} exams={exams} selectedExam={examCode} />
          </div>

          <div className="relative flex min-h-[200px] items-center justify-center">
            {subject.hero_image_url ? (
              <Image
                src={subject.hero_image_url}
                alt={`${subjectTitle} illustration`}
                width={640}
                height={480}
                className="max-h-[280px] w-full object-contain"
                unoptimized
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-3xl bg-white/80 shadow-sm">
                <IconByKey iconKey={subject.icon_key} className="h-16 w-16 text-brand" strokeWidth={1.5} />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-5 mx-auto max-w-[1100px] rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:px-6 sm:py-5">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-brand">
              <LayoutList className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-bold text-slate-900 sm:text-xl">{topicCount}</p>
              <p className="text-xs text-slate-500 sm:text-sm">{c.topics}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-brand">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-bold text-slate-900 sm:text-xl">{questionCount.toLocaleString()}</p>
              <p className="text-xs text-slate-500 sm:text-sm">{c.questions}</p>
            </div>
          </div>
          <div className="col-span-2 flex items-center gap-3 border-t border-slate-100 pt-4 lg:col-span-1 lg:border-t-0 lg:pt-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-brand">
              <Globe className="h-5 w-5" />
            </span>
            <p className="text-xs font-medium leading-snug text-slate-700 sm:text-sm">{c.bilingual}</p>
          </div>
        </div>
      </section>

      <SubjectTopicGrid
        subjectSlug={subjectSlug}
        subjectTitle={subjectTitle}
        topics={topics}
        examCode={examCode}
        exams={exams}
      />
    </div>
  );
}

/** Search helper: match query against both en and hi */
export function topicMatchesSearch(
  topic: Topic | TopicWithPriority,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const titleEn = pickCatalogText(topic.title, 'en').toLowerCase();
  const titleHi = pickCatalogText(topic.title, 'hi').toLowerCase();
  const descEn = pickCatalogText(topic.description, 'en').toLowerCase();
  const descHi = pickCatalogText(topic.description, 'hi').toLowerCase();
  return [titleEn, titleHi, descEn, descHi].some((part) => part.includes(q));
}
