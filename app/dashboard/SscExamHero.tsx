'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, LayoutGrid, ListTree, Trophy } from 'lucide-react';
import type { ExamLearningSnapshot } from '@/lib/examLearning';

export function isSscFamilyExam(code: string, name: string): boolean {
  const normalizedCode = String(code).trim().toUpperCase().replace(/[\s-]+/g, '_');
  return normalizedCode === 'SSC' || normalizedCode.startsWith('SSC_') || /\bSSC\b/i.test(name);
}

function coverageValue(code: string, language: 'en' | 'hi'): string {
  const normalized = code.toUpperCase();
  if (/(?:^|_)CGL(?:_|$)|(?:^|_)CHSL(?:_|$)|(?:^|_)CPO(?:_|$)/.test(normalized)) {
    return language === 'hi' ? 'टियर I और टियर II' : 'Tier I & Tier II';
  }
  if (/(?:^|_)MTS(?:_|$)/.test(normalized)) {
    return language === 'hi' ? 'सेशन I और सेशन II' : 'Session I & II';
  }
  return language === 'hi' ? 'संपूर्ण पाठ्यक्रम' : 'Complete Syllabus';
}

type SscExamHeroProps = {
  snapshot: ExamLearningSnapshot;
  examName: string;
  language: 'en' | 'hi';
  strictSscCgl?: boolean;
  strictSscChsl?: boolean;
};

export default function SscExamHero({ snapshot, examName, language, strictSscCgl = false, strictSscChsl = false }: SscExamHeroProps) {
  const copy = language === 'hi'
    ? {
        selected: 'चयनित परीक्षा',
        prepare: 'की तैयारी करें,',
        headline: 'एक समय में एक कॉन्सेप्ट',
        hindiLine: 'From subjects to subtopics, complete preparation in one place.',
        supporting: 'अपनी परीक्षा के अनुसार विषय, टॉपिक और उपविषय पढ़ें।',
        explore: 'विषय देखें',
        syllabus: 'पूरा पाठ्यक्रम देखें',
        subjects: 'विषय',
        topics: 'टॉपिक',
        subtopics: 'उपविषय',
        coverage: 'परीक्षा कवरेज',
      }
    : {
        selected: 'Selected Exam',
        prepare: 'Prepare for',
        headline: 'one concept at a time',
        hindiLine: 'From subjects to subtopics, complete preparation in one place.',
        supporting: 'Explore the exact subjects, topics and subtopics mapped to your exam.',
        explore: 'Explore Subjects',
        syllabus: 'View Complete Syllabus',
        subjects: 'Subjects',
        topics: 'Topics',
        subtopics: 'Subtopics',
        coverage: 'Exam Coverage',
      };

  const stats = strictSscCgl
    ? [
        { value: 2, label: language === 'hi' ? 'टियर' : 'Tiers', icon: BookOpen },
        { value: 3, label: language === 'hi' ? 'टियर 2 पेपर' : 'Tier 2 papers', icon: ListTree },
        { value: 4, label: language === 'hi' ? 'अलग स्टेज' : 'Separate stages', icon: LayoutGrid },
        { value: coverageValue(snapshot.exam.code, language), label: copy.coverage, icon: Trophy },
      ]
    : strictSscChsl
      ? [
          { value: 2, label: language === 'hi' ? 'टियर' : 'Tiers', icon: BookOpen },
          { value: snapshot.subjects.length, label: copy.subjects, icon: ListTree },
          { value: snapshot.topics.length, label: copy.topics, icon: LayoutGrid },
          { value: coverageValue(snapshot.exam.code, language), label: copy.coverage, icon: Trophy },
        ]
      : [
        { value: snapshot.subjects.length, label: copy.subjects, icon: BookOpen },
        { value: snapshot.topics.length, label: copy.topics, icon: ListTree },
        { value: snapshot.subtopics.length, label: copy.subtopics, icon: LayoutGrid },
        { value: coverageValue(snapshot.exam.code, language), label: copy.coverage, icon: Trophy },
      ];
  const syllabusHref = strictSscCgl ? '/ssc-cgl' : strictSscChsl ? '/ssc-chsl' : '/subjects';
  const exploreHref = strictSscCgl ? '#ssc-cgl-stages' : strictSscChsl ? '#ssc-chsl-stages' : '#exam-subjects';

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-violet-100 bg-[#FCFBFF] shadow-[0_24px_70px_rgba(76,29,149,0.10)]">
      <div className="relative min-h-[600px] lg:min-h-[720px]">
        <Image
          src="/dashboard/ssc-exam-hero-v1.png"
          alt="Student exploring an exam syllabus from subjects to subtopics"
          fill
          preload
          fetchPriority="high"
          sizes="(max-width: 1024px) 100vw, 1280px"
          className="hidden object-cover object-center lg:block"
        />
        <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-white via-white/95 via-[42%] to-transparent lg:block" />
        <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-violet-100/60 blur-3xl" />

        <div className="relative z-10 flex min-h-[600px] flex-col px-5 pb-8 pt-8 sm:px-8 lg:min-h-[720px] lg:w-[54%] lg:px-12 lg:pb-40 lg:pt-14 xl:px-14">
          <div className="inline-flex w-fit items-center gap-2.5 rounded-xl border border-violet-100 bg-violet-50/90 px-3.5 py-2 text-xs font-medium text-violet-900 sm:text-[13px]">
            <CheckCircle2 className="h-5 w-5 text-violet-700" aria-hidden />
            <span>{copy.selected}</span>
            <span className="font-bold text-violet-800">{examName}</span>
          </div>

          <h1 className="mt-7 max-w-3xl text-[30px] font-bold leading-[1.16] tracking-[-0.02em] text-[#18181B] sm:text-[38px] lg:text-[42px]">
            {language === 'hi' ? (
              <>{examName} {copy.prepare}<br /><span className="text-violet-700">{copy.headline}</span></>
            ) : (
              <>{copy.prepare} {examName},<br /><span className="text-violet-700">{copy.headline}</span></>
            )}
          </h1>

          <p className="mt-5 text-lg font-medium leading-7 text-[#475569] sm:text-xl">{copy.hindiLine}</p>
          <p className="mt-2.5 max-w-xl text-[15px] leading-6 text-[#667085] sm:text-base sm:leading-7">{copy.supporting}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={exploreHref} className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-700 to-purple-600 px-6 text-[15px] font-semibold text-white shadow-[0_12px_28px_rgba(109,40,217,0.28)] transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2">
              <BookOpen className="h-5 w-5" aria-hidden />
              {copy.explore}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
            <Link href={syllabusHref} className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-violet-500 bg-white/90 px-6 text-[15px] font-semibold text-violet-800 transition hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2">
              <BookOpen className="h-5 w-5" aria-hidden />
              {copy.syllabus}
            </Link>
          </div>

          <div className="relative -mx-5 mt-9 h-[310px] overflow-hidden sm:-mx-8 lg:hidden">
            <Image
              src="/dashboard/ssc-exam-hero-v1.png"
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-[68%_center]"
            />
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#FCFBFF] to-transparent" />
          </div>
        </div>

        <div className="relative z-20 border-t border-violet-100 bg-white/95 p-4 backdrop-blur lg:absolute lg:inset-x-8 lg:bottom-8 lg:rounded-2xl lg:border lg:p-5 lg:shadow-[0_12px_36px_rgba(30,20,70,0.08)]">
          <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-4">
            {stats.map(({ value, label, icon: Icon }, index) => (
              <div key={label} className={`flex items-center gap-3 px-3 sm:px-5 ${index > 0 ? 'sm:border-l sm:border-slate-200' : ''}`}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 sm:h-14 sm:w-14">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xl font-bold text-[#18181B] sm:text-2xl">{value}</p>
                  <p className="text-xs font-medium text-slate-500 sm:text-sm">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
