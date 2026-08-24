'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, Target } from 'lucide-react';
import ExamContentUnavailable from '@/components/ExamContentUnavailable';
import IconByKey from '@/components/IconByKey';
import { useAuth } from '@/lib/AuthContext';
import {
  ClientJsonError,
  fetchClientJson,
  isClientCacheFresh,
  readClientCache,
  writeClientCache,
} from '@/lib/clientRequestCache';
import { useLanguage } from '@/lib/LanguageContext';
import { getExamCountdownParts } from '@/lib/examCountdown';
import { progressPercent, type ExamLearningSnapshot } from '@/lib/examLearning';
import { pickCatalogText } from '@/lib/useCatalogText';
import SscExamHero, { isSscFamilyExam } from './SscExamHero';
import ExamPreparationPath from './ExamPreparationPath';
import ExamSubjectExplorer from './ExamSubjectExplorer';
import SscCglStageExplorer from './SscCglStageExplorer';
import SscCglSelectedStageSubjects from './SscCglSelectedStageSubjects';
import { isSscCglExamCode } from '@/lib/sscCglSyllabus';
import type { SavedExamPreference } from '@/lib/examPreference';
import type { SscCglStageTaxonomy } from '@/lib/sscCglSyllabus';

type ExamDashboardPayload = ExamLearningSnapshot & {
  sscCglSelection?:
    | { status: 'missing' | 'error' }
    | {
        status: 'ready';
        preference: SavedExamPreference;
        taxonomy: SscCglStageTaxonomy;
      };
};

const COPY = {
  en: {
    title: 'Your exam dashboard', change: 'Change exam', days: 'days remaining', today: 'Exam is today', passed: 'Exam date passed',
    subjects: 'Exam-specific subjects', topics: 'Recommended topics', questions: 'questions', subtopics: 'subtopics', progress: 'Progress',
    attempted: 'Attempted', accuracy: 'Accuracy', available: 'Available questions', continue: 'Continue practice', recent: 'Recent activity',
    emptySubjects: 'No subjects are mapped to this exam yet.', emptyRecent: 'Your exam-specific activity will appear here after you practice.', retry: 'Retry',
  },
  hi: {
    title: 'आपका परीक्षा डैशबोर्ड', change: 'परीक्षा बदलें', days: 'दिन शेष', today: 'परीक्षा आज है', passed: 'परीक्षा की तारीख बीत चुकी है',
    subjects: 'परीक्षा के विषय', topics: 'सुझाए गए टॉपिक', questions: 'प्रश्न', subtopics: 'उप-विषय', progress: 'प्रगति',
    attempted: 'हल किए', accuracy: 'सटीकता', available: 'उपलब्ध प्रश्न', continue: 'अभ्यास जारी रखें', recent: 'हाल की गतिविधि',
    emptySubjects: 'इस परीक्षा के लिए अभी कोई विषय मैप नहीं है।', emptyRecent: 'अभ्यास के बाद आपकी परीक्षा की गतिविधि यहाँ दिखेगी।', retry: 'फिर प्रयास करें',
  },
};

function DashboardLoadingShell() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 pb-8 pt-4 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl animate-pulse" aria-label="Loading exam dashboard">
        <div className="h-48 rounded-3xl bg-gradient-to-br from-purple-100 to-purple-50 sm:h-56" />
        <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-28 rounded-2xl border border-purple-100 bg-white" />
          ))}
        </div>
        <div className="mt-8 h-8 w-56 rounded-lg bg-slate-200" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-32 rounded-2xl border border-slate-200 bg-white" />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function ExamDashboardClient() {
  const { language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const c = COPY[language];
  const [data, setData] = useState<ExamDashboardPayload | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'inactive' | 'error'>('loading');
  const initialLoadStarted = useRef(false);

  const load = useCallback(async (force = false) => {
    const cacheKey = `learning-dashboard:${user?.id ?? 'session'}`;
    const cached = readClientCache<ExamDashboardPayload>(cacheKey);
    if (cached) {
      setData(cached);
      setStatus('ready');
      if (!force && isClientCacheFresh(cacheKey, 60_000)) return;
    } else {
      setStatus('loading');
    }
    try {
      const payload = await fetchClientJson<ExamDashboardPayload>(
        cacheKey,
        '/api/learning/dashboard',
        { maxAgeMs: 60_000, force },
      );
      setData(payload);
      setStatus('ready');
    } catch (error) {
      if (!cached) {
        const payload = error instanceof ClientJsonError
          ? error.payload as { error?: string } | null
          : null;
        setStatus(payload?.error === 'selected_exam_inactive' ? 'inactive' : 'error');
      }
    }
  }, [user]);

  useEffect(() => {
    if (initialLoadStarted.current) return;
    initialLoadStarted.current = true;
    // The dashboard endpoint authenticates its own cookie. Starting it alongside
    // /api/auth/me removes a full sequential request from signed-in first load.
    void load();
  }, [load]);

  useEffect(() => {
    if (user && data) writeClientCache(`learning-dashboard:${user.id}`, data);
  }, [user, data]);

  const recommended = useMemo(() => data?.topics.filter((topic) => topic.is_recommended).slice(0, 6) ?? [], [data]);

  if (!authLoading && !user) return <ExamContentUnavailable reason="error" />;
  if (status === 'loading' || (authLoading && (status === 'error' || !data))) {
    return <DashboardLoadingShell />;
  }
  if (status === 'inactive') return <ExamContentUnavailable reason="inactive_exam" />;
  if (status === 'error' || !data) return <ExamContentUnavailable reason="error" />;

  const countdown = getExamCountdownParts(data.exam.target_date);
  const examName = pickCatalogText(data.exam.title, language) || data.exam.code;
  const showSscHero = isSscFamilyExam(data.exam.code, examName);
  const isSscCgl = isSscCglExamCode(data.exam.code);
  const selectedSscCglStage = data.sscCglSelection?.status === 'ready'
    ? data.sscCglSelection
    : null;
  const firstPractice = data.subtopics.find((row) => row.question_count > 0);
  const firstTopic = firstPractice ? data.topics.find((row) => row.id === firstPractice.topic_id) : null;
  const firstSubject = firstPractice ? data.subjects.find((row) => row.id === firstPractice.subject_id) : null;
  const continueHref = firstPractice && firstTopic && firstSubject
    ? `/subjects/${firstSubject.slug}/${firstTopic.slug}/practice/${firstPractice.slug}?exam=${encodeURIComponent(data.exam.code)}`
    : '/subjects';
  const resolvedContinueHref = selectedSscCglStage?.taxonomy.stage.href
    ?? (isSscCgl ? '/ssc-cgl' : continueHref);

  return (
    <main className={`min-h-screen bg-[#F8FAFC] px-4 pb-8 sm:px-6 lg:px-10 ${showSscHero ? 'pt-3 sm:pt-4' : 'pt-8'}`}>
      <div className="mx-auto max-w-7xl">
        {showSscHero ? (
          <SscExamHero snapshot={data} examName={examName} language={language} strictSscCgl={isSscCgl} />
        ) : null}

        <section className={`overflow-hidden rounded-3xl bg-gradient-to-br from-[#6D28D9] to-[#9333EA] p-6 text-white shadow-xl sm:p-8 ${showSscHero ? 'mt-10' : ''}`}>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div><p className="text-sm font-semibold text-purple-100">{c.title}</p>{showSscHero ? <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">{examName}</h2> : <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">{examName}</h1>}<p className="mt-3 flex items-center gap-2 text-sm text-purple-100"><CalendarDays className="h-4 w-4" />{data.exam.target_date}</p></div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              <div className="rounded-2xl bg-white/15 px-5 py-4 text-center backdrop-blur"><p className="text-xl font-bold sm:text-2xl">{countdown?.expired ? c.passed : countdown?.today ? c.today : `${countdown?.days ?? 0} ${c.days}`}</p></div>
              <Link href="/onboarding?edit=1&returnTo=%2Fdashboard" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 text-[15px] font-semibold text-[#6D28D9]">{c.change}</Link>
            </div>
          </div>
        </section>

        <section className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[[c.available, data.overview.total_questions], [c.attempted, data.overview.attempted_count], [c.accuracy, `${data.overview.accuracy_percent}%`], [c.progress, `${data.overview.completion_percent}%`]].map(([label,value]) => <div key={String(label)} className="rounded-2xl border border-purple-100 bg-white p-5 shadow-[0_8px_24px_rgba(76,29,149,0.04)] sm:p-6"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-3 text-2xl font-bold text-slate-950 sm:text-3xl">{value}</p></div>)}
        </section>

        {showSscHero && !isSscCgl ? <ExamPreparationPath snapshot={data} /> : null}

        {isSscCgl ? (
          selectedSscCglStage ? (
            <SscCglSelectedStageSubjects
              taxonomy={selectedSscCglStage.taxonomy}
              language={language}
            />
          ) : data.sscCglSelection?.status === 'error' ? (
            <div className="mt-8"><ExamContentUnavailable reason="error" /></div>
          ) : (
            <SscCglStageExplorer language={language} />
          )
        ) : showSscHero && data.subjects.length > 0 ? (
          <ExamSubjectExplorer snapshot={data} language={language} />
        ) : (
          <>
          <div id="exam-subjects" className="mt-8 flex scroll-mt-24 items-center justify-between"><h2 className="text-2xl font-bold text-slate-900">{c.subjects}</h2><Link href="/subjects" className="font-semibold text-[#7C3AED]">{c.continue}</Link></div>
          {data.subjects.length === 0 ? <ExamContentUnavailable reason="no_content" /> : (
          <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.subjects.map((subject) => <Link key={subject.id} href={`/subjects/${subject.slug}?exam=${encodeURIComponent(data.exam.code)}`} className="rounded-2xl border border-purple-100 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-[#7C3AED]"><IconByKey iconKey={subject.icon_key} className="h-5 w-5" /></span><div className="min-w-0"><h3 className="font-bold text-slate-900">{pickCatalogText(subject.title, language)}</h3><p className="mt-1 text-xs text-slate-500">{subject.topic_count} · {subject.subtopic_count} {c.subtopics} · {subject.question_count} {c.questions}</p></div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-purple-100"><div className="h-full rounded-full bg-[#7C3AED]" style={{ width: `${progressPercent(subject.attempted_count, subject.question_count)}%` }} /></div></Link>)}
          </section>
          )}
          </>
        )}

        {!isSscCgl && recommended.length > 0 ? <section className="mt-10"><h2 className="text-2xl font-bold text-slate-900">{c.topics}</h2><div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{recommended.map((topic) => { const subject=data.subjects.find((row)=>row.id===topic.subject_id); return subject ? <Link key={topic.id} href={`/subjects/${subject.slug}/${topic.slug}?exam=${encodeURIComponent(data.exam.code)}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4"><div><p className="font-bold text-slate-900">{pickCatalogText(topic.title,language)}</p><p className="mt-1 text-xs text-slate-500">{topic.question_count} {c.questions}</p></div><ArrowRight className="h-5 w-5 text-[#7C3AED]" /></Link> : null; })}</div></section> : null}

        <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-3xl border border-purple-100 bg-purple-50 p-6"><Target className="h-8 w-8 text-[#7C3AED]" /><h2 className="mt-4 text-xl font-bold text-slate-900">{c.continue}</h2><Link href={resolvedContinueHref} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#7C3AED] px-5 font-bold text-white">{c.continue}<ArrowRight className="ml-2 h-4 w-4" /></Link></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold text-slate-900">{c.recent}</h2>{data.recent_activity.length === 0 ? <p className="mt-5 text-sm text-slate-500">{c.emptyRecent}</p> : <ul className="mt-4 space-y-3">{data.recent_activity.map((item) => <li key={`${item.question_id}-${item.attempted_at}`} className="flex gap-3 rounded-xl bg-slate-50 p-3"><CheckCircle2 className={`h-5 w-5 shrink-0 ${item.is_correct ? 'text-emerald-600' : 'text-red-500'}`} /><div><p className="line-clamp-2 text-sm font-medium text-slate-800">{pickCatalogText(item.question_text,language)}</p><p className="mt-1 text-xs text-slate-500">{pickCatalogText(item.topic_title,language)}</p></div></li>)}</ul>}</div>
        </section>
      </div>
    </main>
  );
}
