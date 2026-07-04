'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Flag,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import LoginRequiredModal from '@/components/practice/LoginRequiredModal';
import PracticeProgressSummary from '@/components/practice/PracticeProgressSummary';
import ReportComingSoonModal from '@/components/practice/ReportComingSoonModal';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import {
  formatCorrectPercentage,
  getOptionsForLang,
  getQuestionLocalizedText,
  type SubmitAnswerResponse,
} from '@/lib/practice';
import type { LocalizedText, OptionKey, PublicQuestion } from '@/types/polity';

type QuestionPracticeProps = {
  questions: PublicQuestion[];
  backHref: string;
  backLabel?: string;
  title?: string;
  titleLocalized?: LocalizedText;
  subjectId?: string | null;
  topicId?: string | null;
  subtopicId?: string | null;
};

const SKIP_LOGIN_KEY = 'qw_practice_skip_login';
const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D'];

type QuestionResult = SubmitAnswerResponse;

const COPY = {
  en: {
    practice: 'Practice',
    comingSoon: 'Questions are coming soon for this topic.',
    comingSoonSub: 'We are adding MCQs for this section. Check back soon or explore another subtopic.',
    questionOf: (current: number, total: number) => `Question ${current} of ${total}`,
    english: 'English',
    hindi: 'Hindi',
    submit: 'Submit Answer',
    submitting: 'Submitting...',
    explanation: 'Explanation',
    noExplanation: 'No explanation available for this question yet.',
    nextQuestion: 'Next Question',
    report: 'Report Question',
    previous: 'Previous',
    next: 'Next',
    reset: 'Reset',
    attempted: 'Attempted',
    correct: 'Correct',
    wrong: 'Wrong',
    errorSubmit: 'Could not submit answer. Please try again.',
    errorService: 'Server is not configured for saving attempts. Please contact support or sign in later.',
    alreadyAttempted: 'You already attempted this question. Stats were not updated again.',
    loadError: 'Could not load your previous attempts.',
  },
  hi: {
    practice: 'अभ्यास',
    comingSoon: 'इस विषय के लिए प्रश्न जल्द आ रहे हैं।',
    comingSoonSub: 'हम इस सेक्शन के MCQ जोड़ रहे हैं। जल्द वापस आएँ या कोई अन्य उप-विषय देखें।',
    questionOf: (current: number, total: number) => `प्रश्न ${current} / ${total}`,
    english: 'English',
    hindi: 'हिंदी',
    submit: 'उत्तर Submit करें',
    submitting: 'Submit हो रहा है...',
    explanation: 'व्याख्या',
    noExplanation: 'इस प्रश्न के लिए अभी कोई व्याख्या उपलब्ध नहीं है।',
    nextQuestion: 'अगला प्रश्न',
    report: 'प्रश्न रिपोर्ट करें',
    previous: 'पिछला',
    next: 'अगला',
    reset: 'रीसेट',
    attempted: 'प्रयास किया',
    correct: 'सही',
    wrong: 'गलत',
    errorSubmit: 'उत्तर submit नहीं हो सका। कृपया फिर कोशिश करें।',
    errorService: 'प्रयास save करने के लिए server configure नहीं है। बाद में फिर कोशिश करें।',
    alreadyAttempted: 'आप पहले ही इस प्रश्न का प्रयास कर चुके हैं। आँकड़े दोबारा नहीं बढ़े।',
    loadError: 'पिछले प्रयास लोड नहीं हो सके।',
  },
};

export default function QuestionPractice({
  questions,
  backHref,
  backLabel = 'Back to topic',
  title,
  titleLocalized,
  subjectId,
  topicId,
  subtopicId,
}: QuestionPracticeProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const c = COPY[language];

  const [index, setIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<OptionKey | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);
  const [resultsByQuestion, setResultsByQuestion] = useState<Record<string, QuestionResult>>({});
  const [attemptedIds, setAttemptedIds] = useState<Set<string>>(new Set());
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [reportComingSoonOpen, setReportComingSoonOpen] = useState(false);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [progressRefreshKey, setProgressRefreshKey] = useState(0);

  const questionStartedAt = useRef<number>(Date.now());
  const isFirstGuestSubmit = useRef(true);

  const current = questions[index];
  const total = questions.length;
  const currentResult = current ? resultsByQuestion[current.id] : undefined;

  const displayTitle = titleLocalized
    ? getQuestionLocalizedText(titleLocalized, language)
    : title;

  const resetQuestionState = useCallback(() => {
    setSelectedOption(null);
    setSubmitted(false);
    setSubmitError(null);
    setSubmitNotice(null);
    questionStartedAt.current = Date.now();
  }, []);

  useEffect(() => {
    resetQuestionState();
    if (current && resultsByQuestion[current.id]) {
      const saved = resultsByQuestion[current.id];
      setSelectedOption(saved.selected_option as OptionKey);
      setSubmitted(true);
    }
  }, [index, current, resultsByQuestion, resetQuestionState]);

  useEffect(() => {
    setIndex(0);
    setResultsByQuestion({});
    setAttemptedIds(new Set());
    isFirstGuestSubmit.current = true;
    resetQuestionState();
  }, [questions, resetQuestionState]);

  useEffect(() => {
    if (!user || questions.length === 0) return;

    setLoadingAttempts(true);
    fetch('/api/practice/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionIds: questions.map((q) => q.id) }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('failed');
        return res.json() as Promise<{ attempts: Array<QuestionResult & { question_id: string; selected_option: string }> }>;
      })
      .then(({ attempts }) => {
        const nextResults: Record<string, QuestionResult> = {};
        const nextAttempted = new Set<string>();
        for (const attempt of attempts) {
          nextAttempted.add(attempt.question_id);
          nextResults[attempt.question_id] = {
            is_correct: attempt.is_correct,
            correct_option: attempt.correct_option ?? '',
            explanation: attempt.explanation ?? {},
            attempt_count: attempt.attempt_count ?? 0,
            correct_count: attempt.correct_count ?? 0,
            correct_percentage: attempt.correct_percentage ?? null,
            is_new_attempt: false,
            selected_option: attempt.selected_option,
          };
        }
        setResultsByQuestion(nextResults);
        setAttemptedIds(nextAttempted);
        const first = questions[index];
        if (first && nextResults[first.id]) {
          setSelectedOption(nextResults[first.id].selected_option as OptionKey);
          setSubmitted(true);
        }
      })
      .catch(() => setSubmitError(c.loadError))
      .finally(() => setLoadingAttempts(false));
  }, [user, questions, c.loadError]);

  const questionText = useMemo(
    () => getQuestionLocalizedText(current?.question_text, language),
    [current, language],
  );

  const optionMap = useMemo(
    () => getOptionsForLang(current?.options, language),
    [current, language],
  );

  const explanation = useMemo(() => {
    if (!currentResult?.explanation) return '';
    return getQuestionLocalizedText(currentResult.explanation, language);
  }, [currentResult, language]);

  const correctKey = (currentResult?.correct_option?.trim().toUpperCase() ?? '') as OptionKey;

  const submitAnswer = useCallback(async () => {
    if (!selectedOption || !current || submitting || submitted) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitNotice(null);

    const timeTakenSeconds = Math.max(1, Math.round((Date.now() - questionStartedAt.current) / 1000));

    try {
      const response = await fetch('/api/practice/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: current.id,
          selectedOption,
          timeTakenSeconds,
        }),
      });

      const payload = (await response.json()) as QuestionResult & { error?: string };

      if (response.status === 503) {
        setSubmitError(c.errorService);
        return;
      }

      if (!response.ok) {
        setSubmitError(c.errorSubmit);
        return;
      }

      const result = payload;
      setResultsByQuestion((prev) => ({ ...prev, [current.id]: result }));
      setAttemptedIds((prev) => new Set(prev).add(current.id));
      setSubmitted(true);
      if (result.already_attempted || result.is_new_attempt === false) {
        setSubmitNotice(c.alreadyAttempted);
      }
      if (user) {
        setProgressRefreshKey((prev) => prev + 1);
      }
    } catch {
      setSubmitError(c.errorSubmit);
    } finally {
      setSubmitting(false);
    }
  }, [selectedOption, current, submitting, submitted, user, c.errorSubmit, c.errorService, c.alreadyAttempted]);

  const handleSubmit = () => {
    if (!selectedOption || !current || submitting || submitted) return;

    if (user) {
      void submitAnswer();
      return;
    }

    if (isFirstGuestSubmit.current) {
      isFirstGuestSubmit.current = false;
      setLoginModalOpen(true);
      return;
    }

    if (typeof window !== 'undefined' && sessionStorage.getItem(SKIP_LOGIN_KEY) === '1') {
      void submitAnswer();
      return;
    }

    setLoginModalOpen(true);
  };

  const handleSkipLogin = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SKIP_LOGIN_KEY, '1');
    }
    setLoginModalOpen(false);
    void submitAnswer();
  };

  const handleNextQuestion = () => {
    if (index < total - 1) setIndex((prev) => prev + 1);
  };

  const handlePrevious = () => {
    if (index > 0) setIndex((prev) => prev - 1);
  };

  const handleReset = () => {
    if (!current || submitted) return;
    resetQuestionState();
  };

  const openReport = () => {
    setReportComingSoonOpen(true);
  };

  const reportButton = (
    <button
      type="button"
      onClick={openReport}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-[#DDD6FE] hover:text-brand sm:w-auto sm:shrink-0"
    >
      <Flag className="h-4 w-4" />
      {c.report}
    </button>
  );

  if (total === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-3xl border border-slate-100 bg-white px-6 py-12 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">{c.practice}</p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">{c.comingSoon}</h1>
          <p className="mt-3 text-sm text-slate-500">{c.comingSoonSub}</p>
          <Link
            href={backHref}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6D28D9]"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const statsText = formatCorrectPercentage(currentResult?.correct_percentage, language);

  return (
    <>
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-4 sm:px-6">
        <PracticeProgressSummary
          subjectId={subjectId}
          topicId={topicId}
          subtopicId={subtopicId}
          refreshKey={progressRefreshKey}
        />

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            {displayTitle && (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">{displayTitle}</p>
            )}
            <p className="mt-1 text-sm font-medium text-slate-600">{c.questionOf(index + 1, total)}</p>
          </div>
          <div className="flex rounded-full border border-slate-200 bg-white p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`rounded-full px-3 py-1.5 transition ${language === 'en' ? 'bg-brand text-white' : 'text-slate-600 hover:text-brand'}`}
            >
              {c.english}
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`rounded-full px-3 py-1.5 transition ${language === 'hi' ? 'bg-brand text-white' : 'text-slate-600 hover:text-brand'}`}
            >
              {c.hindi}
            </button>
          </div>
        </div>

        <div className="mb-2 flex flex-wrap gap-1.5">
          {questions.map((question, qIndex) => {
            const isActive = qIndex === index;
            const isAttempted = attemptedIds.has(question.id);
            const result = resultsByQuestion[question.id];
            return (
              <button
                key={question.id}
                type="button"
                onClick={() => setIndex(qIndex)}
                className={`h-8 min-w-8 rounded-lg px-2 text-xs font-bold transition ${
                  isActive
                    ? 'bg-brand text-white'
                    : isAttempted
                      ? result?.is_correct
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-[#EDE9FE] hover:text-brand'
                }`}
                title={
                  isAttempted
                    ? result?.is_correct
                      ? c.correct
                      : c.wrong
                    : c.attempted
                }
              >
                {qIndex + 1}
              </button>
            );
          })}
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-[#EDE9FE]">
          <div
            className="h-full rounded-full bg-brand transition-all duration-300"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>

        {loadingAttempts && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading attempts...
          </div>
        )}

        <article className="mt-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-4 flex flex-wrap gap-2 text-xs text-slate-500">
            {current.difficulty && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 capitalize">
                {current.difficulty}
              </span>
            )}
            {current.source && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">{current.source}</span>
            )}
            {current.year && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">{current.year}</span>
            )}
            {current.pyq_exam_name && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                {current.pyq_exam_name}
              </span>
            )}
            {current.exam_tags?.map((tag) => (
              <span key={tag} className="rounded-full border border-[#DDD6FE] bg-[#F3E8FF] px-2.5 py-1 text-brand">
                {tag}
              </span>
            ))}
          </div>

          <p className="text-base font-medium leading-relaxed text-slate-900 sm:text-lg">{questionText}</p>

          <div className="mt-6 space-y-3">
            {OPTION_KEYS.map((key) => {
              const text = optionMap[key];
              if (!text) return null;

              const isSelected = selectedOption === key;
              const isCorrect = submitted && key === correctKey;
              const isWrong = submitted && isSelected && key !== correctKey;

              let optionClass =
                'border-slate-200 bg-white hover:border-[#DDD6FE] hover:bg-[#FAF5FF]';
              if (isCorrect) optionClass = 'border-emerald-500 bg-emerald-50';
              else if (isWrong) optionClass = 'border-red-400 bg-red-50';
              else if (isSelected) optionClass = 'border-brand bg-[#F3E8FF]';

              return (
                <button
                  key={key}
                  type="button"
                  disabled={submitted || submitting}
                  onClick={() => setSelectedOption(key)}
                  className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${optionClass} disabled:cursor-default`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      isCorrect
                        ? 'bg-emerald-500 text-white'
                        : isWrong
                          ? 'bg-red-500 text-white'
                          : isSelected
                            ? 'bg-brand text-white'
                            : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {key}
                  </span>
                  <span className="pt-0.5 text-sm leading-relaxed text-slate-800 sm:text-base">{text}</span>
                </button>
              );
            })}
          </div>

          {submitError && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {submitError}
            </div>
          )}

          {submitNotice && !submitError && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              {submitNotice}
            </div>
          )}

          {!submitted ? (
            <div className="mt-6 flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedOption || submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-50 min-[520px]:w-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {c.submitting}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {c.submit}
                  </>
                )}
              </button>
              <div className="min-[520px]:ml-3 min-[520px]:shrink-0">{reportButton}</div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-[#EDE9FE] bg-[#FAF5FF] p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand">{c.explanation}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {explanation || c.noExplanation}
                </p>
              </div>

              <p className="text-sm font-medium text-slate-600">{statsText}</p>

              {submitNotice && (
                <p className="text-sm text-amber-700">{submitNotice}</p>
              )}

              <div className="flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between">
                {index < total - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6D28D9] min-[520px]:w-auto"
                  >
                    {c.nextQuestion}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="hidden min-[520px]:block" />
                )}
                <div className={`min-[520px]:shrink-0 ${index < total - 1 ? 'min-[520px]:ml-3' : ''}`}>
                  {reportButton}
                </div>
              </div>
            </div>
          )}
        </article>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={submitted}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#DDD6FE] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" />
              {c.reset}
            </button>
            <button
              type="button"
              onClick={handlePrevious}
              disabled={index === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#DDD6FE] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {c.previous}
            </button>
            <button
              type="button"
              onClick={handleNextQuestion}
              disabled={index >= total - 1}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {c.next}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <LoginRequiredModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSkip={handleSkipLogin}
        redirectPath={pathname}
      />
      <ReportComingSoonModal
        open={reportComingSoonOpen}
        onClose={() => setReportComingSoonOpen(false)}
      />
    </>
  );
}
