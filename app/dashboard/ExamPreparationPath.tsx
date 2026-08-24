'use client';

import Link from 'next/link';
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Building2,
  FileText,
  Info,
} from 'lucide-react';
import type { ExamLearningSnapshot } from '@/lib/examLearning';
import { pickCatalogText } from '@/lib/useCatalogText';

type ExamPreparationPathProps = {
  snapshot: ExamLearningSnapshot;
};

type PathStep = {
  title: string;
  value: string;
  href: string;
  icon: typeof BookOpen;
};

function pathWithExam(path: string, examCode: string): string {
  return `${path}?exam=${encodeURIComponent(examCode)}`;
}

export default function ExamPreparationPath({ snapshot }: ExamPreparationPathProps) {
  const subject = snapshot.subjects.find((row) =>
    snapshot.topics.some((topic) => topic.subject_id === row.id),
  ) ?? snapshot.subjects[0];
  const topic = snapshot.topics.find((row) => row.subject_id === subject?.id)
    ?? snapshot.topics[0];
  const subtopic = snapshot.subtopics.find((row) => row.topic_id === topic?.id)
    ?? snapshot.subtopics[0];

  if (!subject || !topic || !subtopic) return null;

  const subjectTitle = pickCatalogText(subject.title, 'en') || subject.slug;
  const topicTitle = pickCatalogText(topic.title, 'en') || topic.slug;
  const subtopicTitle = pickCatalogText(subtopic.title, 'en') || subtopic.slug;
  const subjectPath = `/subjects/${subject.slug}`;
  const topicPath = `${subjectPath}/${topic.slug}`;

  const steps: PathStep[] = [
    {
      title: 'Choose a Subject',
      value: subjectTitle,
      href: pathWithExam(subjectPath, snapshot.exam.code),
      icon: BookOpen,
    },
    {
      title: 'Open a Topic',
      value: topicTitle,
      href: pathWithExam(topicPath, snapshot.exam.code),
      icon: Building2,
    },
    {
      title: 'Study a Subtopic',
      value: subtopicTitle,
      href: pathWithExam(`${topicPath}/practice/${subtopic.slug}`, snapshot.exam.code),
      icon: FileText,
    },
  ];

  return (
    <section className="mt-12 overflow-hidden rounded-[2rem] border border-violet-100 bg-gradient-to-b from-white to-[#FCFBFF] px-4 py-12 shadow-[0_18px_60px_rgba(76,29,149,0.06)] sm:px-7 lg:px-9 lg:py-16" aria-labelledby="preparation-path-title">
      <div className="flex items-center justify-center gap-4 text-center">
        <span className="hidden h-px w-20 bg-gradient-to-r from-transparent to-violet-300 sm:block" />
        <span className="hidden text-xl text-violet-400 sm:block" aria-hidden>✦</span>
        <h2 id="preparation-path-title" className="text-2xl font-bold tracking-tight text-[#18181B] sm:text-[32px] sm:leading-10 lg:text-[36px] lg:leading-[44px]">
          Prepare in a <span className="text-violet-700">clear order</span>
        </h2>
        <span className="hidden text-xl text-violet-400 sm:block" aria-hidden>✦</span>
        <span className="hidden h-px w-20 bg-gradient-to-l from-transparent to-violet-300 sm:block" />
      </div>

      <div className="relative mt-12 grid gap-12 lg:grid-cols-3 lg:gap-16">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          return (
            <div key={step.title} className="relative">
              <Link href={step.href} className="group flex min-h-[190px] h-full flex-col rounded-3xl border border-violet-100 bg-white p-5 shadow-[0_12px_38px_rgba(76,29,149,0.06)] transition duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-[0_18px_45px_rgba(76,29,149,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 sm:p-6">
                <div className="flex min-w-0 flex-1 items-center gap-4 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50/70 to-purple-50/70 px-4 py-4 text-left sm:px-5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm transition group-hover:scale-105">
                    <StepIcon className="h-6 w-6" strokeWidth={1.9} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold leading-6 text-[#18181B] sm:text-lg">{step.title}</h3>
                    <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-[#667085]">{step.value}</p>
                  </div>
                </div>
              </Link>

              {index < steps.length - 1 ? (
                <div className="pointer-events-none absolute -bottom-10 left-1/2 z-10 flex -translate-x-1/2 items-center justify-center text-violet-700 lg:bottom-auto lg:left-auto lg:-right-[4.5rem] lg:top-1/2 lg:translate-x-0 lg:-translate-y-1/2">
                  <div className="hidden items-center lg:flex">
                    <span className="w-5 border-t-2 border-dashed border-violet-300" />
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-violet-200 bg-white shadow-md"><ArrowRight className="h-7 w-7" aria-hidden /></span>
                    <span className="w-5 border-t-2 border-dashed border-violet-300" />
                  </div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-violet-200 bg-white shadow-md lg:hidden"><ArrowDown className="h-6 w-6" aria-hidden /></span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex items-center justify-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/50 px-5 py-4 text-center text-sm font-medium leading-6 text-[#344054] sm:text-base">
        <Info className="h-6 w-6 shrink-0 text-violet-700" aria-hidden />
        <p>The path changes automatically with your selected exam.</p>
      </div>
    </section>
  );
}
