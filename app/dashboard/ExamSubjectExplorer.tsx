'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Info, ListTree } from 'lucide-react';
import IconByKey from '@/components/IconByKey';
import type { ExamLearningSnapshot } from '@/lib/examLearning';
import { pickCatalogText } from '@/lib/useCatalogText';

type ExamSubjectExplorerProps = {
  snapshot: ExamLearningSnapshot;
  language: 'en' | 'hi';
};

const ACCENTS = [
  'bg-violet-50 text-violet-700',
  'bg-sky-50 text-sky-600',
  'bg-emerald-50 text-emerald-600',
  'bg-pink-50 text-pink-600',
  'bg-cyan-50 text-cyan-600',
  'bg-amber-50 text-amber-600',
  'bg-teal-50 text-teal-600',
] as const;

function shortExamName(code: string): string {
  return code.trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').toUpperCase();
}

export default function ExamSubjectExplorer({ snapshot, language }: ExamSubjectExplorerProps) {
  const examName = shortExamName(snapshot.exam.code) || pickCatalogText(snapshot.exam.title, language);
  const copy = language === 'hi'
    ? {
        badge: `${examName} पाठ्यक्रम`,
        heading: `${examName} के विषय देखें`,
        supporting: 'अपनी परीक्षा के अनुसार मैप किए गए टॉपिक और उपविषय देखने के लिए कोई विषय चुनें।',
        complete: 'पूरा पाठ्यक्रम देखें',
        subjects: 'विषय',
        topics: 'टॉपिक',
        subtopics: 'उपविषय',
        explore: 'टॉपिक देखें',
        loaded: 'विषय आपकी चुनी हुई परीक्षा के पाठ्यक्रम से दिखाए जाते हैं।',
      }
    : {
        badge: `${examName} syllabus`,
        heading: `Explore subjects for ${examName}`,
        supporting: 'Choose a subject to explore its mapped topics and subtopics.',
        complete: 'View complete syllabus',
        subjects: 'Subjects',
        topics: 'Topics',
        subtopics: 'Subtopics',
        explore: 'Explore topics',
        loaded: 'Subjects are loaded from your selected exam syllabus.',
      };

  return (
    <section id="exam-subjects" className="mt-12 scroll-mt-24 overflow-hidden rounded-[2rem] border border-violet-100 bg-white px-4 py-10 shadow-[0_18px_60px_rgba(76,29,149,0.06)] sm:px-7 lg:px-9 lg:py-12" aria-labelledby="exam-subjects-heading">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-violet-700">
            <BookOpen className="h-4 w-4" aria-hidden />
            {copy.badge}
          </span>
          <h2 id="exam-subjects-heading" className="mt-4 text-2xl font-bold tracking-tight text-[#18181B] sm:text-[32px] sm:leading-10">
            {copy.heading}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#667085] sm:text-[15px]">{copy.supporting}</p>
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-violet-100 bg-violet-50/70 px-4 py-3 text-xs font-medium text-[#344054] sm:text-sm">
            <BookOpen className="h-4 w-4 text-violet-700" aria-hidden />
            <strong className="font-bold text-violet-700">{snapshot.subjects.length}</strong> {copy.subjects}
            <span className="text-violet-300">•</span>
            <strong className="font-bold text-violet-700">{snapshot.topics.length}</strong> {copy.topics}
            <span className="text-violet-300">•</span>
            <strong className="font-bold text-violet-700">{snapshot.subtopics.length}</strong> {copy.subtopics}
          </div>
          <Link href="/subjects" className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 transition hover:text-violet-900 hover:underline">
            {copy.complete}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        {snapshot.subjects.map((subject, index) => {
          const topicCount = snapshot.topics.filter((topic) => topic.subject_id === subject.id).length;
          const title = pickCatalogText(subject.title, language) || subject.slug;
          const href = `/subjects/${subject.slug}?exam=${encodeURIComponent(snapshot.exam.code)}`;
          return (
            <Link key={subject.id} href={href} className="group flex min-h-[190px] w-full flex-col rounded-2xl border border-slate-200 bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-[0_12px_32px_rgba(76,29,149,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]">
              <div className="flex min-w-0 items-start gap-3">
                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${ACCENTS[index % ACCENTS.length]}`}>
                  <IconByKey iconKey={subject.icon_key} className="h-7 w-7" strokeWidth={1.8} />
                </span>
                <h3 className="min-w-0 pt-1 text-[15px] font-semibold leading-5 text-[#18181B] sm:text-base sm:leading-6">{title}</h3>
              </div>

              <div className="mt-5 flex items-center gap-2 text-xs font-medium text-[#667085]">
                <ListTree className="h-4 w-4" aria-hidden />
                {topicCount} {copy.topics}
              </div>

              <div className="mt-auto flex items-center justify-center gap-2 border-t border-slate-100 pt-4 text-sm font-semibold text-violet-700">
                {copy.explore}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-7 flex items-center justify-center gap-2 text-center text-xs leading-5 text-[#667085] sm:text-sm">
        <Info className="h-5 w-5 shrink-0 text-violet-600" aria-hidden />
        <p>{copy.loaded}</p>
      </div>
    </section>
  );
}
