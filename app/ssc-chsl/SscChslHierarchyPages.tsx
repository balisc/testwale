'use client';

import Link from 'next/link';
import { CheckCircle2, ChevronRight, Layers3 } from 'lucide-react';
import IconByKey from '@/components/IconByKey';
import { useLanguage } from '@/lib/LanguageContext';
import {
  getSscChslQuestionsHref,
  getSscChslSubtopicsHref,
  getSscChslTopicsHref,
  type SscChslStageSnapshot,
} from '@/lib/sscChsl';
import type {
  ExamLearningSubject,
  ExamLearningTopic,
} from '@/lib/examLearning';
import { QUESTION_BATCH_CACHE_VERSION } from '@/lib/questionBatchCache';
import { pickCatalogText } from '@/lib/useCatalogText';
import SscCglNodeIcon from '@/app/ssc-cgl/SscCglNodeIcon';
import SscCglPageHeader from '@/app/ssc-cgl/SscCglPageHeader';

function EmptyState({ message }: { message: string }) {
  return <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">{message}</div>;
}

function SubjectIcon({ subject }: { subject: ExamLearningSubject }) {
  return subject.icon_key
    ? <IconByKey iconKey={subject.icon_key} className="h-7 w-7" />
    : <SscCglNodeIcon code={subject.slug} className="h-7 w-7" />;
}

export function SscChslSubjectsPage({ data }: { data: SscChslStageSnapshot }) {
  const { language } = useLanguage();
  const { stage, snapshot } = data;
  const stageName = pickCatalogText(stage.label, language);
  const copy = language === 'hi'
    ? {
        home: 'होम', exams: 'परीक्षाएँ', choose: 'विषय चुनें',
        instruction: 'इसके टॉपिक देखने के लिए एक विषय चुनें।', back: 'टियर चयन पर वापस जाएँ',
        topics: 'टॉपिक', explore: 'टॉपिक देखें', empty: 'इस टियर के लिए कोई विषय उपलब्ध नहीं है।',
      }
    : {
        home: 'Home', exams: 'Exams', choose: 'Choose a Subject',
        instruction: 'Select one subject to explore its topics.', back: 'Back to Tier Selection',
        topics: 'Topics', explore: 'Explore Topics', empty: 'No subjects are available for this tier yet.',
      };
  return (
    <main className="min-h-screen w-full min-w-0 bg-[#F8FAFC] px-4 py-6 text-slate-900 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-6xl">
        <SscCglPageHeader
          activeStep={2}
          breadcrumbs={[
            { label: copy.home, href: '/' },
            { label: copy.exams },
            { label: 'SSC CHSL', href: '/ssc-chsl' },
            { label: stageName },
          ]}
          backHref="/ssc-chsl?change=1"
          backLabel={copy.back}
          context={`SSC CHSL · ${stageName}`}
        />
        <section className="mt-6 w-full min-w-0">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">{copy.choose}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{copy.instruction}</p>
          {snapshot.subjects.length === 0 ? <EmptyState message={copy.empty} /> : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {snapshot.subjects.map((subject) => {
                const topics = snapshot.topics.filter((topic) => topic.subject_id === subject.id);
                const description = pickCatalogText(subject.description, language);
                return (
                  <Link key={subject.id} href={getSscChslTopicsHref(stage, subject.slug)} className="group grid min-h-32 min-w-0 grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-violet-300 hover:bg-violet-50/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 sm:flex sm:gap-4 sm:p-5">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><SubjectIcon subject={subject} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-base font-extrabold text-slate-950 sm:text-lg">{pickCatalogText(subject.title, language) || subject.slug}</span>
                      {description ? <span className="mt-1 block break-words text-sm leading-5 text-slate-600">{description}</span> : null}
                      <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">{topics.length} {copy.topics}</span>
                    </span>
                    <span className="col-span-2 inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-violet-300 px-4 text-sm font-bold text-violet-700 sm:min-h-10 sm:w-auto">{copy.explore}<ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" /></span>
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

export function SscChslTopicsPage({
  data,
  subject,
}: {
  data: SscChslStageSnapshot;
  subject: ExamLearningSubject;
}) {
  const { language } = useLanguage();
  const { stage, snapshot } = data;
  const topics = snapshot.topics.filter((topic) => topic.subject_id === subject.id);
  const stageName = pickCatalogText(stage.label, language);
  const subjectName = pickCatalogText(subject.title, language) || subject.slug;
  const description = pickCatalogText(subject.description, language);
  const copy = language === 'hi'
    ? {
        home: 'होम', exams: 'परीक्षाएँ', back: 'सभी विषय', choose: 'टॉपिक चुनें',
        instruction: 'इसके उप-विषय देखने के लिए एक टॉपिक चुनें।', subtopics: 'उप-विषय',
        explore: 'उप-विषय देखें', empty: 'इस विषय के लिए कोई टॉपिक उपलब्ध नहीं है।',
      }
    : {
        home: 'Home', exams: 'Exams', back: 'Back to Subjects', choose: 'Choose a Topic',
        instruction: 'Select one topic to explore its subtopics.', subtopics: 'Subtopics',
        explore: 'Explore Subtopics', empty: 'No topics are available for this subject yet.',
      };
  return (
    <main className="min-h-screen w-full min-w-0 bg-[#F8FAFC] px-4 py-6 text-slate-900 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-6xl">
        <SscCglPageHeader
          activeStep={3}
          breadcrumbs={[
            { label: copy.home, href: '/' }, { label: copy.exams },
            { label: 'SSC CHSL', href: '/ssc-chsl' }, { label: stageName, href: stage.href },
            { label: subject.title },
          ]}
          backHref={stage.href}
          backLabel={copy.back}
          context={`SSC CHSL · ${stageName}`}
        />
        <section className="mt-6 w-full min-w-0">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><SubjectIcon subject={subject} /></span>
            <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.08em] text-violet-700">{stageName}</p><h1 className="mt-1 break-words text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{subjectName}</h1>{description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}</div>
          </div>
          <div className="mt-7"><h2 className="text-2xl font-extrabold tracking-tight text-slate-950">{copy.choose}</h2><p className="mt-1.5 text-sm leading-6 text-slate-600">{copy.instruction}</p></div>
          {topics.length === 0 ? <EmptyState message={copy.empty} /> : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {topics.map((topic) => {
                const subtopicCount = snapshot.subtopics.filter((row) => row.topic_id === topic.id).length;
                const topicDescription = pickCatalogText(topic.description, language);
                return (
                  <Link key={topic.id} href={getSscChslSubtopicsHref(stage, subject.slug, topic.slug)} className="group grid min-h-28 min-w-0 grid-cols-[3rem_minmax(0,1fr)] items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-violet-300 hover:bg-violet-50/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 sm:flex sm:gap-4 sm:p-5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><Layers3 className="h-6 w-6" aria-hidden="true" /></span>
                    <span className="min-w-0 flex-1"><span className="block break-words font-extrabold text-slate-950">{pickCatalogText(topic.title, language) || topic.slug}</span>{topicDescription ? <span className="mt-1 block break-words text-sm leading-5 text-slate-600">{topicDescription}</span> : null}<span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">{subtopicCount} {copy.subtopics}</span></span>
                    <span className="col-span-2 inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-violet-300 px-4 text-sm font-bold text-violet-700 sm:min-h-10 sm:w-auto">{copy.explore}<ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" /></span>
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

export function SscChslSubtopicsPage({
  data,
  subject,
  topic,
}: {
  data: SscChslStageSnapshot;
  subject: ExamLearningSubject;
  topic: ExamLearningTopic;
}) {
  const { language } = useLanguage();
  const { stage, snapshot } = data;
  const subtopics = snapshot.subtopics.filter((subtopic) => subtopic.topic_id === topic.id);
  const topicName = pickCatalogText(topic.title, language) || topic.slug;
  const subjectName = pickCatalogText(subject.title, language) || subject.slug;
  const topicDescription = pickCatalogText(topic.description, language);
  const topicsHref = getSscChslTopicsHref(stage, subject.slug);
  const copy = language === 'hi'
    ? {
        home: 'होम', exams: 'परीक्षाएँ', back: 'सभी टॉपिक', choose: 'उप-विषय चुनें',
        instruction: 'प्रश्न अभ्यास शुरू करने के लिए एक उप-विषय चुनें।', start: 'अभ्यास शुरू करें',
        questions: 'प्रश्न', soon: 'जल्द उपलब्ध', empty: 'इस टॉपिक के लिए कोई उप-विषय उपलब्ध नहीं है।',
      }
    : {
        home: 'Home', exams: 'Exams', back: 'Back to Topics', choose: 'Choose a Subtopic',
        instruction: 'Select one subtopic to start question practice.', start: 'Start Practice',
        questions: 'Questions', soon: 'Coming soon', empty: 'No subtopics are available for this topic yet.',
      };
  return (
    <main className="min-h-screen w-full min-w-0 bg-[#F8FAFC] px-4 py-6 text-slate-900 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-6xl">
        <SscCglPageHeader
          activeStep={4}
          breadcrumbs={[
            { label: copy.home, href: '/' }, { label: copy.exams },
            { label: 'SSC CHSL', href: '/ssc-chsl' }, { label: stage.label, href: stage.href },
            { label: subject.title, href: topicsHref }, { label: topic.title },
          ]}
          backHref={topicsHref}
          backLabel={copy.back}
          context={subject.title}
        />
        <section className="mt-6 w-full min-w-0">
          <p className="text-sm font-bold text-violet-700">{subjectName}</p><h1 className="mt-1 break-words text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{topicName}</h1>{topicDescription ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{topicDescription}</p> : null}
          <div className="mt-7"><h2 className="text-2xl font-extrabold tracking-tight text-slate-950">{copy.choose}</h2><p className="mt-1.5 text-sm leading-6 text-slate-600">{copy.instruction}</p></div>
          {subtopics.length === 0 ? <EmptyState message={copy.empty} /> : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {subtopics.map((subtopic) => {
                const description = pickCatalogText(subtopic.description, language);
                const available = subtopic.question_count > 0 && Boolean(subtopic.content_id);
                const content = <><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><CheckCircle2 className="h-6 w-6" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block break-words font-extrabold text-slate-950">{pickCatalogText(subtopic.title, language) || subtopic.slug}</span>{description ? <span className="mt-1 block break-words text-sm leading-5 text-slate-600">{description}</span> : null}{subtopic.question_count > 0 ? <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">{subtopic.question_count} {copy.questions}</span> : null}</span><span className={`col-span-2 inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold sm:min-h-10 sm:w-auto ${available ? 'bg-violet-700 text-white' : 'bg-slate-100 text-slate-500'}`}>{available ? copy.start : copy.soon}{available ? <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" /> : null}</span></>;
                return available ? (
                  <Link key={subtopic.id} data-ssc-chsl-subtopic-card prefetch={false} href={`${getSscChslQuestionsHref(stage, subject.slug, topic.slug, subtopic.slug)}?qb=${QUESTION_BATCH_CACHE_VERSION}`} className="group grid min-h-24 min-w-0 grid-cols-[3rem_minmax(0,1fr)] items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-violet-300 hover:bg-violet-50/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 sm:flex sm:gap-4 sm:p-5">{content}</Link>
                ) : <div key={subtopic.id} data-ssc-chsl-subtopic-card aria-disabled="true" className="grid min-h-24 min-w-0 grid-cols-[3rem_minmax(0,1fr)] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-80 sm:flex sm:gap-4 sm:p-5">{content}</div>;
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
