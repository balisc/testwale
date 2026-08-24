'use client';

import Link from 'next/link';
import IconByKey from '@/components/IconByKey';
import { useLanguage } from '@/lib/LanguageContext';
import { progressPercent, type ExamLearningSnapshot } from '@/lib/examLearning';
import { withExamStageQuery } from '@/lib/examPreference';
import { pickCatalogText } from '@/lib/useCatalogText';

export default function ExamSubjectsGrid({
  snapshot,
  publicExamHref,
  stageCode,
}: {
  snapshot: ExamLearningSnapshot;
  publicExamHref?: string;
  stageCode?: string | null;
}) {
  const { language } = useLanguage();
  const examName = pickCatalogText(snapshot.exam.title, language) || snapshot.exam.code;
  const copy = language === 'hi'
    ? { title: `${examName} के विषय`, subtitle: 'केवल आपकी चुनी हुई परीक्षा का प्रकाशित पाठ्यक्रम।', topics: 'टॉपिक', subtopics: 'उप-विषय', questions: 'प्रश्न', progress: 'प्रगति' }
    : { title: `${examName} subjects`, subtitle: 'Published syllabus for your selected exact exam.', topics: 'topics', subtopics: 'subtopics', questions: 'questions', progress: 'progress' };
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
      <header className="text-center"><h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">{copy.title}</h1><p className="mt-3 text-slate-600">{copy.subtitle}</p></header>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {snapshot.subjects.map((subject) => {
          const percent = progressPercent(subject.attempted_count, subject.question_count);
          const englishTitle = pickCatalogText(subject.title, 'en');
          const hindiTitle = pickCatalogText(subject.title, 'hi');
          const href = publicExamHref
            ? withExamStageQuery(`${publicExamHref}/${subject.slug}`, stageCode)
            : `/subjects/${subject.slug}?exam=${encodeURIComponent(snapshot.exam.code)}`;
          return <Link key={subject.id} href={href} className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]">
            <div className="flex items-start gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED]"><IconByKey iconKey={subject.icon_key} className="h-6 w-6" /></span><div className="min-w-0"><h2 className="text-lg font-bold text-slate-900">{englishTitle}</h2>{hindiTitle && hindiTitle !== englishTitle ? <p className="mt-1 text-sm font-medium text-slate-600" lang="hi">{hindiTitle}</p> : null}<p className="mt-2 line-clamp-2 text-sm text-slate-500">{pickCatalogText(subject.description, language)}</p></div></div>
            <p className="mt-5 text-xs font-medium text-slate-500">{subject.topic_count} {copy.topics} · {subject.subtopic_count} {copy.subtopics} · {subject.question_count} {copy.questions}</p>
            {!publicExamHref ? <><div className="mt-3 h-2 overflow-hidden rounded-full bg-purple-100"><div className="h-full bg-[#7C3AED]" style={{ width: `${percent}%` }} /></div><p className="mt-2 text-xs font-semibold text-[#7C3AED]">{percent}% {copy.progress}</p></> : null}
          </Link>;
        })}
      </div>
    </section>
  );
}
