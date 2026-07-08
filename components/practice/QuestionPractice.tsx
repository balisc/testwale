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
  type PracticeAttemptRestoreRow,
  type PracticeProgress,
  type SubmitAnswerResponse,
} from '@/lib/practice';
import { trackPracticeDebug } from '@/lib/practiceDebug';
import {
  buildPhaseLabel,
  parseAdvanceSubtopicCycleResult,
  parseSubtopicQuestionBatchState,
  type PracticePhase,
  type SubtopicQuestionBatchState,
} from '@/lib/practiceMastery';
import { validateQuestionBatchPagePayload } from '@/lib/publicQuestionApiGuards';
import { QUESTION_BATCH_PAGE_SIZE } from '@/lib/supabaseQueryLimits';
import type { LocalizedText, OptionKey, PublicQuestion, QuestionBatchPage } from '@/types/polity';

type QuestionPracticeProps = {
  questions?: PublicQuestion[];
  initialQuestions?: PublicQuestion[];
  initialNextCursor?: string | null;
  initialHasMore?: boolean;
  questionBatchScope?: 'subtopic' | 'topic';
  questionBatchScopeId?: string;
  examCode?: string;
  backHref: string;
  backLabel?: string;
  title?: string;
  titleLocalized?: LocalizedText;
  subjectId?: string | null;
  topicId?: string | null;
  subtopicId?: string | null;
  totalQuestionCount?: number | null;
};

const SKIP_LOGIN_KEY = 'qw_practice_skip_login';
const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D'];
const MAX_AUTO_BATCH_FETCHES = 10;

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
    resetSubtopic: 'Reset Subtopic',
    resetSubtopicConfirm: 'Reset this subtopic? All your saved answers here will be cleared and every question will show again.',
    resetSubtopicError: 'Could not reset subtopic. Please try again.',
    allCompleted: 'You have answered all questions in this subtopic correctly!',
    allCompletedSub: 'Reset the subtopic to practice these questions again.',
    continuePractice: 'Continue',
    attempted: 'Attempted',
    correct: 'Correct',
    wrong: 'Wrong',
    errorSubmit: 'Could not submit answer. Please try again.',
    errorService: 'Server is not configured for saving attempts. Please contact support or sign in later.',
    alreadyAttempted: 'You already attempted this question before. This retry was saved to your progress.',
    loadError: 'Could not load your previous attempts.',
    checkingCompleted: 'Checking completed questions...',
    loadingMore: 'Loading more questions...',
    loadMoreFailed: 'Failed to load more questions.',
    retry: 'Retry',
    loadMoreQuestions: 'Load more questions',
    correctIdsError: 'Could not verify completed questions.',
    sessionExpired: 'Your session expired. Please sign in again.',
    questionStateError: 'Could not load your practice progress.',
    invalidResponseError: 'Received an unexpected response from the server. Please retry.',
    migrationPendingError: 'Practice progress is temporarily unavailable. Please try again shortly.',
    totalLabel: 'Total',
    emptySubtopicCatalog: 'No questions are available in this subtopic yet.',
    emptySubtopicCatalogSub: 'Check back later or explore another subtopic.',
    advancingCycle: 'Updating practice round...',
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
    resetSubtopic: 'उप-विषय रीसेट करें',
    resetSubtopicConfirm: 'इस उप-विषय को रीसेट करें? यहाँ के सभी सेव उत्तर हट जाएंगे और सभी प्रश्न फिर दिखेंगे।',
    resetSubtopicError: 'उप-विषय रीसेट नहीं हो सका। कृपया फिर कोशिश करें।',
    allCompleted: 'आपने इस उप-विषय के सभी प्रश्न सही कर लिए हैं!',
    allCompletedSub: 'इन प्रश्नों को फिर से अभ्यास करने के लिए उप-विषय रीसेट करें।',
    continuePractice: 'आगे बढ़ें',
    attempted: 'प्रयास किया',
    correct: 'सही',
    wrong: 'गलत',
    errorSubmit: 'उत्तर submit नहीं हो सका। कृपया फिर कोशिश करें।',
    errorService: 'प्रयास save करने के लिए server configure नहीं है। बाद में फिर कोशिश करें।',
    alreadyAttempted: 'आप पहले इस प्रश्न का प्रयास कर चुके हैं। यह retry आपकी progress में save हो गया।',
    loadError: 'पिछले प्रयास लोड नहीं हो सके।',
    checkingCompleted: 'पूर्ण प्रश्न जाँचे जा रहे हैं...',
    loadingMore: 'और प्रश्न लोड हो रहे हैं...',
    loadMoreFailed: 'और प्रश्न लोड नहीं हो सके।',
    retry: 'फिर कोशिश करें',
    loadMoreQuestions: 'और प्रश्न लोड करें',
    correctIdsError: 'पूर्ण प्रश्नों की पुष्टि नहीं हो सकी।',
    sessionExpired: 'आपका session समाप्त हो गया। कृपया फिर sign in करें।',
    questionStateError: 'आपकी practice progress लोड नहीं हो सकी।',
    invalidResponseError: 'सर्वर से अप्रत्याशित प्रतिक्रिया मिली। कृपया पुनः प्रयास करें।',
    migrationPendingError: 'अभ्यास प्रगति अस्थायी रूप से उपलब्ध नहीं है। कृपया थोड़ी देर बाद पुनः प्रयास करें।',
    totalLabel: 'कुल',
    emptySubtopicCatalog: 'इस उप-विषय में अभी कोई प्रश्न उपलब्ध नहीं है।',
    emptySubtopicCatalogSub: 'बाद में देखें या कोई अन्य उप-विषय देखें।',
    advancingCycle: 'अभ्यास राउंड अपडेट हो रहा है...',
  },
};

function buildPracticeScopeKey(
  scope: QuestionPracticeProps['questionBatchScope'],
  scopeId: string | undefined,
  exam: string | undefined,
): string {
  if (scope === 'subtopic' && scopeId) {
    return `subtopic:${scopeId}:${exam?.trim() || ''}`;
  }
  if (scope === 'topic' && scopeId) {
    return `topic:${scopeId}:${exam?.trim() || ''}`;
  }
  return 'legacy';
}

function applyAttemptRows(attempts: PracticeAttemptRestoreRow[]): {
  nextResults: Record<string, QuestionResult>;
  nextAttempted: Set<string>;
} {
  const nextResults: Record<string, QuestionResult> = {};
  const nextAttempted = new Set<string>();
  for (const attempt of attempts) {
    nextAttempted.add(attempt.question_id);
    nextResults[attempt.question_id] = {
      is_correct: attempt.is_correct,
      correct_option: attempt.correct_option,
      explanation: attempt.explanation,
      attempt_count: attempt.attempt_count,
      correct_count: attempt.correct_count,
      correct_percentage: attempt.correct_percentage,
      is_new_attempt: false,
      selected_option: attempt.selected_option,
    };
  }
  return { nextResults, nextAttempted };
}

function mergeQuestionsById(existing: PublicQuestion[], incoming: PublicQuestion[]): PublicQuestion[] {
  const seen = new Set(existing.map((question) => question.id));
  const merged = [...existing];
  for (const question of incoming) {
    if (seen.has(question.id)) continue;
    seen.add(question.id);
    merged.push(question);
  }
  return merged;
}

export default function QuestionPractice({
  questions = [],
  initialQuestions,
  initialNextCursor = null,
  initialHasMore = false,
  questionBatchScope,
  questionBatchScopeId,
  examCode,
  backHref,
  backLabel = 'Back to topic',
  title,
  titleLocalized,
  subjectId,
  topicId,
  subtopicId,
  totalQuestionCount,
}: QuestionPracticeProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const c = COPY[language];

  const isSubtopicBatchMode =
    questionBatchScope === 'subtopic' && Boolean(questionBatchScopeId);

  const isSubtopicMasteryMode = isSubtopicBatchMode && Boolean(user);

  const practiceScopeKey = useMemo(
    () => buildPracticeScopeKey(questionBatchScope, questionBatchScopeId, examCode),
    [questionBatchScope, questionBatchScopeId, examCode],
  );

  const resolvedInitialQuestions = initialQuestions ?? questions ?? [];

  const [loadedQuestions, setLoadedQuestions] = useState<PublicQuestion[]>(resolvedInitialQuestions);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [verifiedQuestionIds, setVerifiedQuestionIds] = useState<Set<string>>(new Set());
  const [verifyingBatchIds, setVerifyingBatchIds] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<OptionKey | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);
  const [resultsByQuestion, setResultsByQuestion] = useState<Record<string, QuestionResult>>({});
  const [attemptedIds, setAttemptedIds] = useState<Set<string>>(new Set());
  const [correctQuestionIds, setCorrectQuestionIds] = useState<Set<string>>(new Set());
  const [sessionHiddenIds, setSessionHiddenIds] = useState<Set<string>>(new Set());
  const [resettingSubtopic, setResettingSubtopic] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [reportComingSoonOpen, setReportComingSoonOpen] = useState(false);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [checkingCorrectIds, setCheckingCorrectIds] = useState(false);
  const [loadingMoreBatches, setLoadingMoreBatches] = useState(false);
  const [correctIdsError, setCorrectIdsError] = useState<string | null>(null);
  const [attemptsError, setAttemptsError] = useState<string | null>(null);
  const [batchLoadError, setBatchLoadError] = useState<string | null>(null);
  const [batchSafetyLimitReached, setBatchSafetyLimitReached] = useState(false);
  const [practicePhase, setPracticePhase] = useState<PracticePhase>('unseen');
  const [revisionRound, setRevisionRound] = useState(0);
  const [roundStartedAt, setRoundStartedAt] = useState<string | null>(null);
  const [catalogQuestionCount, setCatalogQuestionCount] = useState<number | null>(null);
  const [eligibleQuestionIds, setEligibleQuestionIds] = useState<Set<string>>(new Set());
  const [masteredQuestionIds, setMasteredQuestionIds] = useState<Set<string>>(new Set());
  const [sessionPassRemovedIds, setSessionPassRemovedIds] = useState<Set<string>>(new Set());
  const [questionStateError, setQuestionStateError] = useState<string | null>(null);
  const [checkingQuestionState, setCheckingQuestionState] = useState(false);
  const [advancingCycle, setAdvancingCycle] = useState(false);
  const [progressRefreshKey, setProgressRefreshKey] = useState(0);
  const [practiceProgress, setPracticeProgress] = useState<PracticeProgress | null>(null);

  const questionStartedAt = useRef<number>(Date.now());
  const isFirstGuestSubmit = useRef(true);
  const fetchedCursorsRef = useRef<Set<string>>(new Set());
  const checkedQuestionStateRef = useRef<Set<string>>(new Set());
  const checkedCorrectIdsRef = useRef<Set<string>>(new Set());
  const consecutiveEmptyBatchesRef = useRef(0);
  const batchFetchInFlightRef = useRef(false);
  const correctIdsInFlightRef = useRef(false);
  const attemptsInFlightRef = useRef(false);
  const questionStateInFlightRef = useRef(false);
  const advanceCycleInFlightRef = useRef(false);
  const phaseEpochRef = useRef('unseen:0');
  const batchAbortRef = useRef<AbortController | null>(null);
  const personalizeAbortRef = useRef<AbortController | null>(null);
  const requestGenerationRef = useRef(0);
  const activeScopeKeyRef = useRef<string | null>(null);
  const questionStateChainRef = useRef(Promise.resolve());
  const prevActiveQuestionCountRef = useRef(0);

  const questionPool = isSubtopicBatchMode ? loadedQuestions : questions;

  const hiddenQuestionIds = useMemo(() => {
    const ids = new Set(correctQuestionIds);
    for (const id of sessionHiddenIds) ids.add(id);
    return ids;
  }, [correctQuestionIds, sessionHiddenIds]);

  const activeQuestions = useMemo(() => {
    if (!isSubtopicBatchMode || !user) return questionPool;

    if (isSubtopicMasteryMode) {
      return questionPool.filter(
        (question) =>
          verifiedQuestionIds.has(question.id) &&
          eligibleQuestionIds.has(question.id) &&
          !sessionPassRemovedIds.has(question.id),
      );
    }

    return questionPool.filter(
      (question) => verifiedQuestionIds.has(question.id) && !hiddenQuestionIds.has(question.id),
    );
  }, [
    questionPool,
    isSubtopicBatchMode,
    isSubtopicMasteryMode,
    user,
    verifiedQuestionIds,
    hiddenQuestionIds,
    eligibleQuestionIds,
    sessionPassRemovedIds,
  ]);

  const isVerifyingNewBatch = verifyingBatchIds.size > 0;

  const current = activeQuestions[index];
  const total = activeQuestions.length;
  const knownSubtopicTotal =
    catalogQuestionCount != null && catalogQuestionCount > 0
      ? catalogQuestionCount
      : totalQuestionCount != null && totalQuestionCount > 0
        ? totalQuestionCount
        : null;
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

  const isStaleGeneration = useCallback((generation: number, scopeKey: string) => {
    const activeKey = activeScopeKeyRef.current ?? '';
    return generation !== requestGenerationRef.current || scopeKey !== activeKey;
  }, []);

  const resetBatchPracticeState = useCallback(
    (initialBatch: PublicQuestion[], cursor: string | null, more: boolean) => {
      setLoadedQuestions(initialBatch);
      setNextCursor(cursor);
      setHasMore(more);
      setVerifiedQuestionIds(new Set());
      setVerifyingBatchIds(new Set());
      setEligibleQuestionIds(new Set());
      setMasteredQuestionIds(new Set());
      setSessionPassRemovedIds(new Set());
      setPracticePhase('unseen');
      setRevisionRound(0);
      setRoundStartedAt(null);
      setCatalogQuestionCount(null);
      setQuestionStateError(null);
      setCheckingQuestionState(false);
      setAdvancingCycle(false);
      phaseEpochRef.current = 'unseen:0';
      setIndex(0);
      setResultsByQuestion({});
      setAttemptedIds(new Set());
      setCorrectQuestionIds(new Set());
      setSessionHiddenIds(new Set());
      setCorrectIdsError(null);
      setAttemptsError(null);
      setBatchLoadError(null);
      setBatchSafetyLimitReached(false);
      isFirstGuestSubmit.current = true;
      fetchedCursorsRef.current.clear();
      checkedQuestionStateRef.current.clear();
      consecutiveEmptyBatchesRef.current = 0;
      batchFetchInFlightRef.current = false;
      questionStateInFlightRef.current = false;
      advanceCycleInFlightRef.current = false;
      resetQuestionState();
    },
    [resetQuestionState],
  );

  useEffect(() => {
    return () => {
      batchAbortRef.current?.abort();
      personalizeAbortRef.current?.abort();
    };
  }, []);

  const fetchAttemptsRestore = useCallback(
    async (
      questionIds: string[],
      signal: AbortSignal | undefined,
      generation: number,
      scopeKey: string,
    ) => {
      if (questionIds.length === 0 || isStaleGeneration(generation, scopeKey)) return;

      if (attemptsInFlightRef.current) return;
      attemptsInFlightRef.current = true;

      try {
        const res = await fetch('/api/practice/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionIds }),
          cache: 'no-store',
          signal,
        });

        if (res.status === 401) throw new Error('unauthorized');
        if (!res.ok) throw new Error('attempts_failed');

        const { attempts } = (await res.json()) as { attempts: PracticeAttemptRestoreRow[] };
        if (isStaleGeneration(generation, scopeKey)) return;

        const { nextResults, nextAttempted } = applyAttemptRows(attempts);
        setResultsByQuestion((prev) => ({ ...prev, ...nextResults }));
        setAttemptedIds((prev) => new Set([...prev, ...nextAttempted]));
        setAttemptsError(null);
      } finally {
        attemptsInFlightRef.current = false;
      }
    },
    [isStaleGeneration],
  );

  const applyQuestionBatchState = useCallback(
    (state: SubtopicQuestionBatchState, checkedIds: string[]) => {
      const epoch = `${state.phase}:${state.revisionRound}`;
      if (phaseEpochRef.current !== epoch) {
        phaseEpochRef.current = epoch;
        setSessionPassRemovedIds(new Set());
        setResultsByQuestion({});
        setAttemptedIds(new Set());
      }

      setPracticePhase(state.phase);
      setRevisionRound(state.revisionRound);
      setRoundStartedAt(state.roundStartedAt);
      if (state.catalogQuestionCount !== null) {
        setCatalogQuestionCount(state.catalogQuestionCount);
      }

      setVerifiedQuestionIds((prev) => {
        const next = new Set(prev);
        for (const id of checkedIds) next.add(id);
        return next;
      });

      setEligibleQuestionIds((prev) => {
        const next = new Set(prev);
        for (const id of state.eligibleQuestionIds) next.add(id);
        for (const id of checkedIds) {
          if (!state.eligibleQuestionIds.includes(id)) next.delete(id);
        }
        return next;
      });

      if (state.masteredQuestionIds.length > 0) {
        setMasteredQuestionIds((prev) => {
          const next = new Set(prev);
          for (const id of state.masteredQuestionIds) next.add(id);
          return next;
        });
      }
    },
    [],
  );

  const fetchQuestionStateForBatch = useCallback(
    async (
      questionIds: string[],
      signal: AbortSignal | undefined,
      generation: number,
      scopeKey: string,
      options?: { isInitial?: boolean; probeCatalog?: boolean },
    ) => {
      if (!isSubtopicMasteryMode || !questionBatchScopeId) return;
      if (questionIds.length === 0 && !options?.probeCatalog) return;
      if (isStaleGeneration(generation, scopeKey)) return;

      const unchecked =
        questionIds.length === 0
          ? []
          : questionIds.filter((id) => !checkedQuestionStateRef.current.has(id));
      if (unchecked.length === 0 && !options?.probeCatalog) return;

      const runFetch = async () => {
        questionStateInFlightRef.current = true;

        setVerifyingBatchIds((prev) => {
          const next = new Set(prev);
          for (const id of unchecked) next.add(id);
          return next;
        });
        if (options?.isInitial) setCheckingQuestionState(true);

        try {
          const res = await fetch('/api/practice/question-state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scope: 'subtopic',
              scopeId: questionBatchScopeId,
              examCode: examCode ?? null,
              questionIds: unchecked,
            }),
            cache: 'no-store',
            signal,
          });

          if (res.status === 401) throw new Error('unauthorized');
          if (res.status === 503) throw new Error('migration_pending');
          if (!res.ok) throw new Error('question_state_failed');

          const raw = (await res.json()) as unknown;
          const parsed = parseSubtopicQuestionBatchState(raw);
          if (!parsed.ok) throw new Error('question_state_invalid');
          const state = parsed.state;
          if (isStaleGeneration(generation, scopeKey)) return;

          for (const id of unchecked) {
            checkedQuestionStateRef.current.add(id);
          }

          applyQuestionBatchState(state, unchecked);
          setQuestionStateError(null);
        } catch (error) {
          if ((error as Error).name === 'AbortError') return;
          if (isStaleGeneration(generation, scopeKey)) return;
          setQuestionStateError(
            (error as Error).message === 'unauthorized'
              ? c.sessionExpired
              : (error as Error).message === 'migration_pending'
                ? c.migrationPendingError
                : (error as Error).message === 'question_state_invalid'
                  ? c.invalidResponseError
                  : c.questionStateError,
          );
        } finally {
          questionStateInFlightRef.current = false;
          if (!isStaleGeneration(generation, scopeKey)) {
            setVerifyingBatchIds((prev) => {
              const next = new Set(prev);
              for (const id of unchecked) next.delete(id);
              return next;
            });
            if (options?.isInitial) setCheckingQuestionState(false);
          }
        }
      };

      questionStateChainRef.current = questionStateChainRef.current
        .then(runFetch, runFetch)
        .catch(() => undefined);
      await questionStateChainRef.current;
    },
    [
      isSubtopicMasteryMode,
      questionBatchScopeId,
      examCode,
      isStaleGeneration,
      applyQuestionBatchState,
      c.sessionExpired,
      c.questionStateError,
      c.invalidResponseError,
      c.migrationPendingError,
    ],
  );

  const fetchCorrectIdsForBatch = useCallback(
    async (
      questionIds: string[],
      signal: AbortSignal | undefined,
      generation: number,
      scopeKey: string,
    ): Promise<string[]> => {
      const unchecked = questionIds.filter((id) => !checkedCorrectIdsRef.current.has(id));
      if (unchecked.length === 0 || isStaleGeneration(generation, scopeKey)) return [];

      if (correctIdsInFlightRef.current) return [];

      correctIdsInFlightRef.current = true;
      try {
        const res = await fetch('/api/practice/correct-ids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionIds: unchecked }),
          cache: 'no-store',
          signal,
        });

        if (res.status === 401) throw new Error('unauthorized');
        if (!res.ok) throw new Error('correct_ids_failed');

        const { correctQuestionIds: masteredIds } = (await res.json()) as {
          correctQuestionIds: string[];
        };

        if (isStaleGeneration(generation, scopeKey)) return masteredIds;

        for (const id of unchecked) {
          checkedCorrectIdsRef.current.add(id);
        }

        setVerifiedQuestionIds((prev) => {
          const next = new Set(prev);
          for (const id of unchecked) next.add(id);
          return next;
        });

        if (masteredIds.length > 0) {
          setCorrectQuestionIds((prev) => {
            const next = new Set(prev);
            for (const id of masteredIds) next.add(id);
            return next;
          });
        }

        setCorrectIdsError(null);
        return masteredIds;
      } finally {
        correctIdsInFlightRef.current = false;
      }
    },
    [isStaleGeneration],
  );

  const loadQuestionBatchPage = useCallback(
    async (
      cursor: string | null,
      signal: AbortSignal | undefined,
      generation: number,
      scopeKey: string,
    ): Promise<QuestionBatchPage | null> => {
      if (!questionBatchScopeId || isStaleGeneration(generation, scopeKey)) return null;

      const params = new URLSearchParams({
        scope: 'subtopic',
        subtopicId: questionBatchScopeId,
        batchSize: String(QUESTION_BATCH_PAGE_SIZE),
      });
      if (cursor) params.set('cursor', cursor);
      if (examCode) params.set('examCode', examCode);

      const res = await fetch(`/api/practice/question-batch?${params.toString()}`, {
        cache: 'no-store',
        signal,
      });

      if (!res.ok) throw new Error('batch_failed');

      const payload = (await res.json()) as unknown;
      const validated = validateQuestionBatchPagePayload(payload, cursor);
      if (!validated.ok) throw new Error('batch_invalid');

      return validated.page;
    },
    [examCode, questionBatchScopeId, isStaleGeneration],
  );

  const loadQuestionBatch = useCallback(
    async (
      cursor: string,
      signal: AbortSignal | undefined,
      generation: number,
      scopeKey: string,
    ): Promise<QuestionBatchPage | null> => {
      return loadQuestionBatchPage(cursor, signal, generation, scopeKey);
    },
    [loadQuestionBatchPage],
  );

  const restartPublicScan = useCallback(
    async (generation: number, scopeKey: string) => {
      fetchedCursorsRef.current.clear();
      checkedQuestionStateRef.current.clear();
      setLoadedQuestions([]);
      setVerifiedQuestionIds(new Set());
      setEligibleQuestionIds(new Set());
      setSessionPassRemovedIds(new Set());
      setNextCursor(null);
      setHasMore(true);
      consecutiveEmptyBatchesRef.current = 0;
      setBatchSafetyLimitReached(false);

      const controller = new AbortController();
      batchAbortRef.current = controller;

      try {
        const page = await loadQuestionBatchPage(null, controller.signal, generation, scopeKey);
        if (!page || isStaleGeneration(generation, scopeKey)) return;

        setLoadedQuestions(page.questions);
        setNextCursor(page.nextCursor);
        setHasMore(page.hasMore);

        if (isSubtopicMasteryMode) {
          await fetchQuestionStateForBatch(
            page.questions.map((question) => question.id),
            controller.signal,
            generation,
            scopeKey,
          );
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        if (!isStaleGeneration(generation, scopeKey)) {
          setBatchLoadError(c.loadMoreFailed);
        }
      }
    },
    [
      loadQuestionBatchPage,
      isStaleGeneration,
      isSubtopicMasteryMode,
      fetchQuestionStateForBatch,
      c.loadMoreFailed,
    ],
  );

  const advancePracticeCycle = useCallback(
    async (generation: number, scopeKey: string) => {
      if (!isSubtopicMasteryMode || !questionBatchScopeId || advanceCycleInFlightRef.current) {
        return null;
      }
      if (catalogQuestionCount === 0) {
        return null;
      }

      advanceCycleInFlightRef.current = true;
      setAdvancingCycle(true);

      try {
        const res = await fetch('/api/practice/advance-cycle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scope: 'subtopic',
            scopeId: questionBatchScopeId,
            examCode: examCode ?? null,
          }),
          cache: 'no-store',
        });

        if (res.status === 401) throw new Error('unauthorized');
        if (res.status === 503) throw new Error('migration_pending');
        if (!res.ok) throw new Error('advance_failed');

        const raw = (await res.json()) as unknown;
        const parsed = parseAdvanceSubtopicCycleResult(raw);
        if (!parsed.ok) throw new Error('advance_invalid');

        const result = parsed.state;
        if (isStaleGeneration(generation, scopeKey)) return null;

        setPracticePhase(result.phase);
        setRevisionRound(result.revisionRound);
        setRoundStartedAt(result.roundStartedAt);
        if (result.catalogQuestionCount !== null) {
          setCatalogQuestionCount(result.catalogQuestionCount);
        }
        phaseEpochRef.current = `${result.phase}:${result.revisionRound}`;

        if (result.transition === 'no_questions') {
          setCatalogQuestionCount(0);
          return result;
        }

        if (
          result.transition === 'start_revision' ||
          result.transition === 'next_revision_round' ||
          result.transition === 'reopened_unseen' ||
          result.transition === 'reopened_revision'
        ) {
          if (result.transition === 'reopened_unseen') {
            setRevisionRound(0);
            setRoundStartedAt(null);
            phaseEpochRef.current = 'unseen:0';
          }

          if (result.transition === 'reopened_revision') {
            setSessionPassRemovedIds(new Set());
          }

          await restartPublicScan(generation, scopeKey);
        }

        return result;
      } catch (error) {
        if (!isStaleGeneration(generation, scopeKey)) {
          setQuestionStateError(
            (error as Error).message === 'unauthorized'
              ? c.sessionExpired
              : (error as Error).message === 'migration_pending'
                ? c.migrationPendingError
                : (error as Error).message === 'advance_invalid'
                  ? c.invalidResponseError
                  : c.questionStateError,
          );
        }
        return null;
      } finally {
        advanceCycleInFlightRef.current = false;
        if (!isStaleGeneration(generation, scopeKey)) setAdvancingCycle(false);
      }
    },
    [
      isSubtopicMasteryMode,
      questionBatchScopeId,
      examCode,
      catalogQuestionCount,
      isStaleGeneration,
      restartPublicScan,
      c.sessionExpired,
      c.questionStateError,
      c.invalidResponseError,
      c.migrationPendingError,
    ],
  );

  const processNewBatchQuestions = useCallback(
    async (
      batchQuestions: PublicQuestion[],
      signal: AbortSignal | undefined,
      generation: number,
      scopeKey: string,
      options?: { isInitial?: boolean },
    ) => {
      if (!user) return;

      if (isSubtopicMasteryMode) {
        await fetchQuestionStateForBatch(
          batchQuestions.map((question) => question.id),
          signal,
          generation,
          scopeKey,
          options,
        );
        return;
      }

      const newIds = batchQuestions
        .map((question) => question.id)
        .filter((id) => !checkedCorrectIdsRef.current.has(id));

      if (newIds.length === 0) return;

      setVerifyingBatchIds((prev) => {
        const next = new Set(prev);
        for (const id of newIds) next.add(id);
        return next;
      });

      if (options?.isInitial) {
        setCheckingCorrectIds(true);
      }

      try {
        await fetchCorrectIdsForBatch(newIds, signal, generation, scopeKey);
        if (isStaleGeneration(generation, scopeKey)) return;
        try {
          await fetchAttemptsRestore(newIds, signal, generation, scopeKey);
        } catch (error) {
          if ((error as Error).name === 'AbortError') return;
          if (isStaleGeneration(generation, scopeKey)) return;
          setAttemptsError(c.loadError);
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        if (isStaleGeneration(generation, scopeKey)) return;
        const message =
          (error as Error).message === 'unauthorized' ? c.sessionExpired : c.correctIdsError;
        setCorrectIdsError(message);
      } finally {
        if (!isStaleGeneration(generation, scopeKey)) {
          setVerifyingBatchIds((prev) => {
            const next = new Set(prev);
            for (const id of newIds) next.delete(id);
            return next;
          });
          if (options?.isInitial) {
            setCheckingCorrectIds(false);
          }
        }
      }
    },
    [
      user,
      isSubtopicMasteryMode,
      fetchQuestionStateForBatch,
      fetchCorrectIdsForBatch,
      fetchAttemptsRestore,
      isStaleGeneration,
      c.loadError,
      c.correctIdsError,
      c.sessionExpired,
    ],
  );

  const verifyBatchQuestions = useCallback(
    async (
      batchQuestions: PublicQuestion[],
      signal: AbortSignal | undefined,
      generation: number,
      scopeKey: string,
      options?: { isInitial?: boolean },
    ) => {
      await processNewBatchQuestions(batchQuestions, signal, generation, scopeKey, options);
    },
    [processNewBatchQuestions],
  );

  const loadNextBatch = useCallback(
    async (options?: { manual?: boolean }) => {
      if (!isSubtopicBatchMode || !nextCursor || batchFetchInFlightRef.current) return;
      if (!options?.manual && fetchedCursorsRef.current.has(nextCursor)) return;

      const generation = requestGenerationRef.current;
      const scopeKey = activeScopeKeyRef.current ?? practiceScopeKey;

      batchAbortRef.current?.abort();
      const controller = new AbortController();
      batchAbortRef.current = controller;

      batchFetchInFlightRef.current = true;
      setLoadingMoreBatches(true);
      if (options?.manual) {
        setBatchSafetyLimitReached(false);
        consecutiveEmptyBatchesRef.current = 0;
      }
      setBatchLoadError(null);

      const cursorToFetch = nextCursor;

      try {
        const page = await loadQuestionBatch(cursorToFetch, controller.signal, generation, scopeKey);
        if (!page || isStaleGeneration(generation, scopeKey)) return;

        fetchedCursorsRef.current.add(cursorToFetch);
        setNextCursor(page.nextCursor);
        setHasMore(page.hasMore);
        setLoadedQuestions((prev) => mergeQuestionsById(prev, page.questions));

        await processNewBatchQuestions(page.questions, controller.signal, generation, scopeKey);
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        if (isStaleGeneration(generation, scopeKey)) return;
        setBatchLoadError(c.loadMoreFailed);
      } finally {
        batchFetchInFlightRef.current = false;
        if (!isStaleGeneration(generation, scopeKey)) {
          setLoadingMoreBatches(false);
        }
      }
    },
    [
      c.loadMoreFailed,
      isSubtopicBatchMode,
      isStaleGeneration,
      loadQuestionBatch,
      nextCursor,
      processNewBatchQuestions,
      practiceScopeKey,
    ],
  );

  const maybeAdvanceMasteryBatch = useCallback(() => {
    if (!isSubtopicMasteryMode || !user) return;

    const isChecking = checkingQuestionState || isVerifyingNewBatch;
    if (isChecking || loadingMoreBatches || advancingCycle || batchFetchInFlightRef.current) return;
    if (batchLoadError || batchSafetyLimitReached) return;
    if (questionStateError) return;
    if (activeQuestions.length > 0) return;
    if (catalogQuestionCount === 0 || practicePhase === 'completed') return;

    const generation = requestGenerationRef.current;
    const scopeKey = activeScopeKeyRef.current ?? practiceScopeKey;

    if (hasMore && nextCursor) {
      if (fetchedCursorsRef.current.has(nextCursor)) return;
      if (consecutiveEmptyBatchesRef.current >= MAX_AUTO_BATCH_FETCHES) {
        setBatchSafetyLimitReached(true);
        return;
      }
      consecutiveEmptyBatchesRef.current += 1;
      void loadNextBatch();
      return;
    }

    if (!hasMore || !nextCursor) {
      void advancePracticeCycle(generation, scopeKey);
    }
  }, [
    isSubtopicMasteryMode,
    user,
    checkingQuestionState,
    isVerifyingNewBatch,
    loadingMoreBatches,
    advancingCycle,
    batchLoadError,
    batchSafetyLimitReached,
    questionStateError,
    activeQuestions.length,
    catalogQuestionCount,
    practicePhase,
    hasMore,
    nextCursor,
    loadNextBatch,
    advancePracticeCycle,
    practiceScopeKey,
  ]);

  const handleRetryQuestionState = useCallback(() => {
    const generation = requestGenerationRef.current;
    const scopeKey = activeScopeKeyRef.current ?? practiceScopeKey;
    const unchecked = loadedQuestions
      .map((question) => question.id)
      .filter((id) => !checkedQuestionStateRef.current.has(id));
    if (unchecked.length === 0) return;

    personalizeAbortRef.current?.abort();
    const controller = new AbortController();
    personalizeAbortRef.current = controller;

    void fetchQuestionStateForBatch(
      unchecked,
      controller.signal,
      generation,
      scopeKey,
      { isInitial: activeQuestions.length === 0 },
    );
  }, [
    loadedQuestions,
    activeQuestions.length,
    fetchQuestionStateForBatch,
    practiceScopeKey,
  ]);

  const handleRetryCorrectIds = useCallback(() => {
    if (isSubtopicMasteryMode) {
      handleRetryQuestionState();
      return;
    }
    const generation = requestGenerationRef.current;
    const scopeKey = activeScopeKeyRef.current ?? practiceScopeKey;
    const unchecked = loadedQuestions
      .map((question) => question.id)
      .filter((id) => !checkedCorrectIdsRef.current.has(id));
    if (unchecked.length === 0) return;

    personalizeAbortRef.current?.abort();
    const controller = new AbortController();
    personalizeAbortRef.current = controller;

    void verifyBatchQuestions(
      loadedQuestions.filter((question) => unchecked.includes(question.id)),
      controller.signal,
      generation,
      scopeKey,
      { isInitial: activeQuestions.length === 0 },
    );
  }, [loadedQuestions, activeQuestions.length, verifyBatchQuestions, practiceScopeKey, isSubtopicMasteryMode, handleRetryQuestionState]);

  const handleRetryAttempts = useCallback(() => {
    const generation = requestGenerationRef.current;
    const scopeKey = activeScopeKeyRef.current ?? practiceScopeKey;
    const verifiedIds = loadedQuestions
      .map((question) => question.id)
      .filter((id) => verifiedQuestionIds.has(id));

    personalizeAbortRef.current?.abort();
    const controller = new AbortController();
    personalizeAbortRef.current = controller;

    void (async () => {
      try {
        await fetchAttemptsRestore(verifiedIds, controller.signal, generation, scopeKey);
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        if (isStaleGeneration(generation, scopeKey)) return;
        setAttemptsError(c.loadError);
      }
    })();
  }, [loadedQuestions, verifiedQuestionIds, fetchAttemptsRestore, isStaleGeneration, c.loadError, practiceScopeKey]);

  const handleRetryBatchLoad = useCallback(() => {
    setBatchLoadError(null);
    void loadNextBatch({ manual: true });
  }, [loadNextBatch]);

  const handleManualLoadMore = useCallback(() => {
    setBatchSafetyLimitReached(false);
    consecutiveEmptyBatchesRef.current = 0;
    void loadNextBatch({ manual: true });
  }, [loadNextBatch]);

  const isFirstAttemptCorrect = useCallback(
    (questionId: string) => {
      const result = resultsByQuestion[questionId];
      return Boolean(result?.is_new_attempt && result?.is_correct);
    },
    [resultsByQuestion],
  );

  useEffect(() => {
    resetQuestionState();
    if (current && resultsByQuestion[current.id]) {
      const saved = resultsByQuestion[current.id];
      setSelectedOption(saved.selected_option as OptionKey);
      setSubmitted(true);
    }
  }, [index, current, resultsByQuestion, resetQuestionState]);

  useEffect(() => {
    if (!isSubtopicBatchMode) {
      setIndex(0);
      setResultsByQuestion({});
      setAttemptedIds(new Set());
      setCorrectQuestionIds(new Set());
      setSessionHiddenIds(new Set());
      isFirstGuestSubmit.current = true;
      resetQuestionState();
      return;
    }

    if (activeScopeKeyRef.current === practiceScopeKey) return;

    const isScopeChange = activeScopeKeyRef.current !== null;
    batchAbortRef.current?.abort();
    personalizeAbortRef.current?.abort();
    activeScopeKeyRef.current = practiceScopeKey;
    requestGenerationRef.current += 1;

    if (isScopeChange) {
      resetBatchPracticeState(resolvedInitialQuestions, initialNextCursor, initialHasMore);
    }
  }, [
    isSubtopicBatchMode,
    practiceScopeKey,
    resolvedInitialQuestions,
    initialNextCursor,
    initialHasMore,
    resetBatchPracticeState,
    resetQuestionState,
  ]);

  useEffect(() => {
    if (!isSubtopicBatchMode || !user) {
      setCheckingCorrectIds(false);
      setCheckingQuestionState(false);
      setVerifyingBatchIds(new Set());
      return;
    }

    const generation = requestGenerationRef.current;
    const scopeKey = activeScopeKeyRef.current ?? practiceScopeKey;
    const initialIds = resolvedInitialQuestions.map((question) => question.id);

    personalizeAbortRef.current?.abort();
    const controller = new AbortController();
    personalizeAbortRef.current = controller;

    if (initialIds.length === 0 && isSubtopicMasteryMode) {
      void fetchQuestionStateForBatch(
        [],
        controller.signal,
        generation,
        scopeKey,
        { isInitial: true, probeCatalog: true },
      );
      return () => controller.abort();
    }

    if (initialIds.length === 0) {
      setCheckingCorrectIds(false);
      setCheckingQuestionState(false);
      return;
    }

    void verifyBatchQuestions(
      resolvedInitialQuestions,
      controller.signal,
      generation,
      scopeKey,
      { isInitial: true },
    );

    return () => controller.abort();
  }, [
    isSubtopicBatchMode,
    isSubtopicMasteryMode,
    user?.id,
    practiceScopeKey,
    resolvedInitialQuestions,
    verifyBatchQuestions,
    fetchQuestionStateForBatch,
  ]);

  useEffect(() => {
    if (!isSubtopicBatchMode || !user) return;

    const isChecking = isSubtopicMasteryMode ? checkingQuestionState : checkingCorrectIds;
    if (
      isChecking ||
      isVerifyingNewBatch ||
      loadingMoreBatches ||
      advancingCycle ||
      batchFetchInFlightRef.current
    ) {
      return;
    }
    if (batchLoadError || batchSafetyLimitReached) return;
    if (isSubtopicMasteryMode ? questionStateError : correctIdsError) return;
    if (activeQuestions.length > 0) {
      consecutiveEmptyBatchesRef.current = 0;
      return;
    }

    if (isSubtopicMasteryMode) {
      maybeAdvanceMasteryBatch();
      return;
    }

    const generation = requestGenerationRef.current;
    const scopeKey = activeScopeKeyRef.current ?? practiceScopeKey;

    if (!hasMore || !nextCursor) return;
    if (fetchedCursorsRef.current.has(nextCursor)) return;

    if (consecutiveEmptyBatchesRef.current >= MAX_AUTO_BATCH_FETCHES) {
      setBatchSafetyLimitReached(true);
      return;
    }

    consecutiveEmptyBatchesRef.current += 1;
    void loadNextBatch();
  }, [
    isSubtopicBatchMode,
    isSubtopicMasteryMode,
    user,
    checkingCorrectIds,
    checkingQuestionState,
    isVerifyingNewBatch,
    loadingMoreBatches,
    advancingCycle,
    batchLoadError,
    batchSafetyLimitReached,
    correctIdsError,
    questionStateError,
    activeQuestions.length,
    hasMore,
    nextCursor,
    loadNextBatch,
    maybeAdvanceMasteryBatch,
    practiceScopeKey,
  ]);

  useEffect(() => {
    const previousCount = prevActiveQuestionCountRef.current;
    prevActiveQuestionCountRef.current = activeQuestions.length;

    if (!isSubtopicMasteryMode) return;

    if (previousCount === 0 && activeQuestions.length > 0) {
      setIndex(0);
      resetQuestionState();
    }

    if (previousCount > 0 && activeQuestions.length === 0) {
      maybeAdvanceMasteryBatch();
    }
  }, [
    activeQuestions.length,
    isSubtopicMasteryMode,
    maybeAdvanceMasteryBatch,
    resetQuestionState,
  ]);

  useEffect(() => {
    if (index >= total && total > 0) {
      setIndex(total - 1);
    }
  }, [index, total]);

  useEffect(() => {
    if (isSubtopicBatchMode || !user || questions.length === 0) return;

    setLoadingAttempts(true);
    const loadAttempts = async () => {
      try {
        const res = await fetch('/api/practice/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionIds: questions.map((q) => q.id) }),
        });
        if (!res.ok) throw new Error('failed');
        const { attempts } = (await res.json()) as { attempts: PracticeAttemptRestoreRow[] };

        const { nextResults, nextAttempted } = applyAttemptRows(attempts);
        setResultsByQuestion(nextResults);
        setAttemptedIds(nextAttempted);
      } catch {
        setSubmitError(c.loadError);
      } finally {
        setLoadingAttempts(false);
      }
    };

    void loadAttempts();
  }, [user, questions, isSubtopicBatchMode, c.loadError]);

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

      if (isSubtopicMasteryMode) {
        setSessionPassRemovedIds((prev) => new Set(prev).add(current.id));
        setEligibleQuestionIds((prev) => {
          const next = new Set(prev);
          next.delete(current.id);
          return next;
        });
        if (result.is_mastered) {
          setMasteredQuestionIds((prev) => new Set(prev).add(current.id));
        }
      } else if (user && result.is_new_attempt && result.is_correct) {
        setCorrectQuestionIds((prev) => {
          const next = new Set(prev);
          next.add(current.id);
          return next;
        });
        checkedCorrectIdsRef.current.add(current.id);
      }
      if (user && result.progress) {
        setPracticeProgress(result.progress);
        trackPracticeDebug('answer_submit', 'progress from RPC — no refetch');
      } else if (user) {
        setPracticeProgress(null);
        setProgressRefreshKey((prev) => prev + 1);
      }
    } catch {
      setSubmitError(c.errorSubmit);
    } finally {
      setSubmitting(false);
    }
  }, [selectedOption, current, submitting, submitted, user, isSubtopicMasteryMode, c.errorSubmit, c.errorService, c.alreadyAttempted]);

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
    if (!current) return;

    if (isSubtopicMasteryMode) {
      resetQuestionState();
      return;
    }

    if (subtopicId && user && isFirstAttemptCorrect(current.id)) {
      setSessionHiddenIds((prev) => new Set(prev).add(current.id));
      resetQuestionState();
      return;
    }

    if (index < total - 1) setIndex((prev) => prev + 1);
  };

  const handlePrevious = () => {
    if (index > 0) setIndex((prev) => prev - 1);
  };

  const handleSelectQuestion = (qIndex: number) => {
    if (
      subtopicId &&
      user &&
      current &&
      qIndex !== index &&
      isFirstAttemptCorrect(current.id)
    ) {
      setSessionHiddenIds((prev) => new Set(prev).add(current.id));
    }
    setIndex(qIndex);
  };

  const handleReset = () => {
    if (!current || submitted) return;
    resetQuestionState();
  };

  const handleResetSubtopic = async () => {
    if (!subtopicId || !user || resettingSubtopic) return;
    if (!window.confirm(c.resetSubtopicConfirm)) return;

    setResettingSubtopic(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/practice/reset-subtopic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtopicId }),
      });
      if (!res.ok) throw new Error('reset failed');

      setCorrectQuestionIds(new Set());
      setSessionHiddenIds(new Set());
      setVerifiedQuestionIds(new Set());
      setEligibleQuestionIds(new Set());
      setMasteredQuestionIds(new Set());
      setSessionPassRemovedIds(new Set());
      setPracticePhase('unseen');
      setRevisionRound(0);
      setRoundStartedAt(null);
      setCatalogQuestionCount(null);
      checkedQuestionStateRef.current.clear();
      checkedCorrectIdsRef.current.clear();
      phaseEpochRef.current = 'unseen:0';
      setAttemptedIds(new Set());
      checkedCorrectIdsRef.current.clear();
      consecutiveEmptyBatchesRef.current = 0;
      setBatchSafetyLimitReached(false);
      setBatchLoadError(null);
      setIndex(0);
      resetQuestionState();
      setPracticeProgress(null);
      setProgressRefreshKey((prev) => prev + 1);

      if (isSubtopicMasteryMode) {
        const generation = requestGenerationRef.current;
        const scopeKey = activeScopeKeyRef.current ?? practiceScopeKey;
        await restartPublicScan(generation, scopeKey);
      } else if (isSubtopicBatchMode) {
        const generation = requestGenerationRef.current;
        const scopeKey = activeScopeKeyRef.current ?? practiceScopeKey;
        const questionIds = loadedQuestions.map((question) => question.id);
        if (questionIds.length > 0) {
          try {
            await fetchCorrectIdsForBatch(questionIds, undefined, generation, scopeKey);
            await fetchAttemptsRestore(questionIds, undefined, generation, scopeKey);
          } catch {
            // Reset succeeded; personalized refresh is best-effort.
          }
        }
      }
    } catch {
      setSubmitError(c.resetSubtopicError);
    } finally {
      setResettingSubtopic(false);
    }
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

  const isBatchRequestActive = isSubtopicMasteryMode
    ? checkingQuestionState || loadingMoreBatches || isVerifyingNewBatch || advancingCycle
    : checkingCorrectIds || loadingMoreBatches || isVerifyingNewBatch;

  const showAllCompleted =
    total === 0 &&
    isSubtopicMasteryMode &&
    practicePhase === 'completed' &&
    catalogQuestionCount !== 0 &&
    !hasMore &&
    !isBatchRequestActive &&
    !batchLoadError &&
    !questionStateError &&
    !batchSafetyLimitReached;

  const showEmptySubtopicCatalog =
    total === 0 &&
    isSubtopicMasteryMode &&
    catalogQuestionCount === 0 &&
    !isBatchRequestActive &&
    !questionStateError &&
    !batchLoadError &&
    !batchSafetyLimitReached;

  const showLegacyAllCompleted =
    total === 0 &&
    isSubtopicBatchMode &&
    Boolean(user) &&
    !isSubtopicMasteryMode &&
    !hasMore &&
    !isBatchRequestActive &&
    !loadingAttempts &&
    !batchLoadError &&
    !correctIdsError &&
    !batchSafetyLimitReached &&
    loadedQuestions.length > 0 &&
    verifiedQuestionIds.size > 0;

  const showGuestEndOfQuestions =
    total > 0 &&
    isSubtopicBatchMode &&
    !user &&
    !hasMore &&
    index >= total - 1;

  if (total === 0) {
    if (
      (isSubtopicMasteryMode ? checkingQuestionState : checkingCorrectIds) ||
      isVerifyingNewBatch ||
      advancingCycle
    ) {
      if (loadedQuestions.length > 0 || verifyingBatchIds.size > 0) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="rounded-3xl border border-slate-100 bg-white px-6 py-12 shadow-sm">
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {advancingCycle
                ? c.advancingCycle
                : isSubtopicMasteryMode
                  ? c.checkingCompleted
                  : c.checkingCompleted}
            </div>
          </div>
        </div>
      );
      }
    }

    if (isSubtopicMasteryMode ? questionStateError : correctIdsError) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="rounded-3xl border border-red-100 bg-white px-6 py-12 shadow-sm">
            <p className="text-sm text-red-600">
              {isSubtopicMasteryMode ? questionStateError : correctIdsError}
            </p>
            <button
              type="button"
              onClick={isSubtopicMasteryMode ? handleRetryQuestionState : handleRetryCorrectIds}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6D28D9]"
            >
              {c.retry}
            </button>
          </div>
        </div>
      );
    }

    if (loadingMoreBatches && loadedQuestions.length > 0 && activeQuestions.length === 0) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="rounded-3xl border border-slate-100 bg-white px-6 py-12 shadow-sm">
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {c.loadingMore}
            </div>
          </div>
        </div>
      );
    }

    if (correctIdsError && !isSubtopicMasteryMode) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="rounded-3xl border border-red-100 bg-white px-6 py-12 shadow-sm">
            <p className="text-sm text-red-600">{correctIdsError}</p>
            <button
              type="button"
              onClick={handleRetryCorrectIds}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6D28D9]"
            >
              {c.retry}
            </button>
          </div>
        </div>
      );
    }

    if (batchLoadError) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="rounded-3xl border border-red-100 bg-white px-6 py-12 shadow-sm">
            <p className="text-sm text-red-600">{batchLoadError}</p>
            <button
              type="button"
              onClick={handleRetryBatchLoad}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6D28D9]"
            >
              {c.retry}
            </button>
          </div>
        </div>
      );
    }

    if (batchSafetyLimitReached && hasMore) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="rounded-3xl border border-slate-100 bg-white px-6 py-12 shadow-sm">
            <p className="text-sm text-slate-500">{c.loadingMore}</p>
            <button
              type="button"
              onClick={handleManualLoadMore}
              disabled={loadingMoreBatches}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6D28D9] disabled:opacity-60"
            >
              {loadingMoreBatches ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {c.loadMoreQuestions}
            </button>
          </div>
        </div>
      );
    }

    if (showEmptySubtopicCatalog) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="rounded-3xl border border-slate-100 bg-white px-6 py-12 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">{c.practice}</p>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">{c.emptySubtopicCatalog}</h1>
            <p className="mt-3 text-sm text-slate-500">{c.emptySubtopicCatalogSub}</p>
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

    if (showAllCompleted || showLegacyAllCompleted) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="rounded-3xl border border-emerald-100 bg-white px-6 py-12 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">{c.practice}</p>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">{c.allCompleted}</h1>
            <p className="mt-3 text-sm text-slate-500">{c.allCompletedSub}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => void handleResetSubtopic()}
                disabled={resettingSubtopic}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6D28D9] disabled:opacity-60"
              >
                {resettingSubtopic ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                {c.resetSubtopic}
              </button>
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#DDD6FE] hover:text-brand"
              >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Link>
            </div>
          </div>
        </div>
      );
    }

    if (subtopicId && user && questions.length > 0 && !isSubtopicBatchMode) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="rounded-3xl border border-emerald-100 bg-white px-6 py-12 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">{c.practice}</p>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">{c.allCompleted}</h1>
            <p className="mt-3 text-sm text-slate-500">{c.allCompletedSub}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => void handleResetSubtopic()}
                disabled={resettingSubtopic}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6D28D9] disabled:opacity-60"
              >
                {resettingSubtopic ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                {c.resetSubtopic}
              </button>
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#DDD6FE] hover:text-brand"
              >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Link>
            </div>
          </div>
        </div>
      );
    }

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
          progressOverride={practiceProgress}
        />

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            {displayTitle && (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">{displayTitle}</p>
            )}
            {isSubtopicMasteryMode && catalogQuestionCount !== 0 && (
              <p className="mt-1 text-xs font-medium text-slate-500">
                {buildPhaseLabel(practicePhase, revisionRound, language)}
              </p>
            )}
            <p className="mt-1 text-sm font-medium text-slate-600">
              {c.questionOf(index + 1, total)}
              {isSubtopicBatchMode && knownSubtopicTotal != null
                ? ` | ${c.totalLabel}: ${knownSubtopicTotal}`
                : ''}
            </p>
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
          {activeQuestions.map((question, qIndex) => {
            const isActive = qIndex === index;
            const isAttempted = attemptedIds.has(question.id);
            const result = resultsByQuestion[question.id];
            return (
              <button
                key={question.id}
                type="button"
                onClick={() => handleSelectQuestion(qIndex)}
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

        {isSubtopicBatchMode && (checkingCorrectIds || isVerifyingNewBatch) && total > 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {c.checkingCompleted}
          </div>
        )}

        {isSubtopicBatchMode && correctIdsError && total > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-red-600">
            <span>{correctIdsError}</span>
            <button
              type="button"
              onClick={handleRetryCorrectIds}
              className="rounded-lg border border-red-200 px-3 py-1.5 font-medium text-red-700 transition hover:bg-red-50"
            >
              {c.retry}
            </button>
          </div>
        )}

        {isSubtopicBatchMode && attemptsError && total > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-amber-700">
            <span>{attemptsError}</span>
            <button
              type="button"
              onClick={handleRetryAttempts}
              className="rounded-lg border border-amber-200 px-3 py-1.5 font-medium text-amber-800 transition hover:bg-amber-50"
            >
              {c.retry}
            </button>
          </div>
        )}

        {isSubtopicBatchMode && loadingMoreBatches && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {c.loadingMore}
          </div>
        )}

        {isSubtopicBatchMode && batchLoadError && total > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-red-600">
            <span>{batchLoadError}</span>
            <button
              type="button"
              onClick={handleRetryBatchLoad}
              className="rounded-lg border border-red-200 px-3 py-1.5 font-medium text-red-700 transition hover:bg-red-50"
            >
              {c.retry}
            </button>
          </div>
        )}

        {isSubtopicBatchMode && batchSafetyLimitReached && hasMore && total > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={handleManualLoadMore}
              disabled={loadingMoreBatches}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#DDD6FE] disabled:opacity-60"
            >
              {loadingMoreBatches ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {c.loadMoreQuestions}
            </button>
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
                ) : subtopicId && user && isFirstAttemptCorrect(current.id) ? (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6D28D9] min-[520px]:w-auto"
                  >
                    {c.continuePractice}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : showGuestEndOfQuestions ? (
                  <p className="text-sm text-slate-500">
                    {c.continuePractice} —{' '}
                    <button
                      type="button"
                      onClick={() => setLoginModalOpen(true)}
                      className="font-semibold text-brand underline-offset-2 hover:underline"
                    >
                      Sign in
                    </button>{' '}
                    to save progress.
                  </p>
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
            {subtopicId && user ? (
              <button
                type="button"
                onClick={() => void handleResetSubtopic()}
                disabled={resettingSubtopic}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#DDD6FE] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {resettingSubtopic ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                {c.resetSubtopic}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                disabled={submitted}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#DDD6FE] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw className="h-4 w-4" />
                {c.reset}
              </button>
            )}
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
