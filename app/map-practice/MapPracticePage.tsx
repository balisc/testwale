'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import MapFilters from '@/app/components/map-practice/MapFilters';
import MapQuestionPanel from '@/app/components/map-practice/MapQuestionPanel';
import MapQuizMap from '@/app/components/map-practice/MapQuizMap';
import MapReviewPanel from '@/app/components/map-practice/MapReviewPanel';
import MapScorePanel from '@/app/components/map-practice/MapScorePanel';
import {
  normalizeDifficulty,
  normalizeMapScope,
  type MapAnswerResult,
  type MapDifficulty,
  type MapQuestion,
  type MapScope,
  type ReviewAttempt,
} from '@/lib/mapPractice';

type Point = { lat: number; lng: number };

type QuestionResponse = {
  questions: MapQuestion[];
  topics: string[];
  subtopics: string[];
  error: string | null;
};

type AnswerFeedback = {
  isCorrect: boolean;
  distanceKm: number;
  timedOut: boolean;
  toleranceKm: number;
  correctPoint: Point;
  correctLocationName: string;
  explanation: string | null;
};

export default function MapPracticePage() {
  const [scope, setScope] = useState<MapScope>('india');
  const [difficulty, setDifficulty] = useState<MapDifficulty | 'all'>('all');
  const [topic, setTopic] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [timerEnabled, setTimerEnabled] = useState(false);

  const [questions, setQuestions] = useState<MapQuestion[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [subtopics, setSubtopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintText, setHintText] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewAttempts, setReviewAttempts] = useState<ReviewAttempt[]>([]);

  const [attempted, setAttempted] = useState(0);
  const [correct, setCorrect] = useState(0);

  const currentQuestion = questions[currentIndex] ?? null;
  const currentCorrectPoint = feedback?.correctPoint ?? null;
  const effectiveToleranceKm = feedback?.toleranceKm ?? 30;

  const hasNext = currentIndex < questions.length - 1;

  const filteredSubtopics = useMemo(() => {
    if (!topic) return subtopics;
    const set = new Set(
      questions.filter((question) => question.main_topic === topic).map((question) => question.subtopic)
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [subtopics, topic, questions]);

  const resetQuestionState = useCallback(() => {
    setCurrentIndex(0);
    setSelectedPoint(null);
    setSubmitted(false);
    setSubmitting(false);
    setFeedback(null);
    setHintLevel(0);
    setHintText(null);
    setTimeLeft(30);
    setReviewMode(false);
    setReviewAttempts([]);
  }, []);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      scope: normalizeMapScope(scope),
      difficulty: normalizeDifficulty(difficulty),
    });
    if (topic) params.set('topic', topic);
    if (subtopic) params.set('subtopic', subtopic);

    try {
      const response = await fetch(`/api/map-practice/questions?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load map questions.');
      }

      const payload = (await response.json()) as QuestionResponse;
      setQuestions(payload.questions ?? []);
      setTopics(payload.topics ?? []);
      setSubtopics(payload.subtopics ?? []);
      setError(payload.error);
      resetQuestionState();
      setAttempted(0);
      setCorrect(0);
      setHintsUsed(0);
    } catch (fetchError) {
      setQuestions([]);
      setTopics([]);
      setSubtopics([]);
      resetQuestionState();
      setError(fetchError instanceof Error ? fetchError.message : 'Unable to fetch map practice questions.');
    } finally {
      setLoading(false);
    }
  }, [scope, difficulty, topic, subtopic, resetQuestionState]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const submitCurrentAnswer = useCallback(
    async (options?: { timedOut?: boolean }) => {
      if (!currentQuestion || submitted || submitting) {
        return;
      }

      const timedOut = Boolean(options?.timedOut);
      const answerPoint = selectedPoint;
      setSubmitting(true);
      try {
        const response = await fetch('/api/map-practice/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: currentQuestion.id,
            latitude: answerPoint?.lat ?? null,
            longitude: answerPoint?.lng ?? null,
            timedOut,
          }),
        });
        if (!response.ok) throw new Error('Unable to validate this answer. Please try again.');

        const result = (await response.json()) as MapAnswerResult & { timedOut: boolean };
        const answerFeedback: AnswerFeedback = { ...result, timedOut };
        setSubmitted(true);
        setFeedback(answerFeedback);
        setAttempted((value) => value + 1);
        if (result.isCorrect) setCorrect((value) => value + 1);

        const attempt: ReviewAttempt = {
          questionId: currentQuestion.id,
          questionText: currentQuestion.question_text,
          selectedPoint: answerPoint,
          correctPoint: result.correctPoint,
          distanceKm: result.distanceKm,
          toleranceKm: result.toleranceKm,
          isCorrect: result.isCorrect,
          timedOut,
          explanation: result.explanation,
        };
        setReviewAttempts((items) => [...items, attempt]);
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Unable to validate this answer.');
      } finally {
        setSubmitting(false);
      }
    },
    [currentQuestion, submitted, submitting, selectedPoint]
  );

  const onSubmit = useCallback(() => {
    if (!selectedPoint) {
      return;
    }
    submitCurrentAnswer({ timedOut: false });
  }, [selectedPoint, submitCurrentAnswer]);

  useEffect(() => {
    if (!timerEnabled || !currentQuestion || submitted || reviewMode) {
      return;
    }

    if (timeLeft <= 0) {
      submitCurrentAnswer({ timedOut: true });
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((value) => Math.max(0, value - 1));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [timerEnabled, currentQuestion, submitted, reviewMode, timeLeft, submitCurrentAnswer]);

  const onNext = useCallback(() => {
    if (!hasNext) return;
    setCurrentIndex((value) => value + 1);
    setSelectedPoint(null);
    setSubmitted(false);
    setSubmitting(false);
    setFeedback(null);
    setHintLevel(0);
    setHintText(null);
    setTimeLeft(30);
  }, [hasNext]);

  const onResetQuiz = useCallback(() => {
    setAttempted(0);
    setCorrect(0);
    setHintsUsed(0);
    resetQuestionState();
    fetchQuestions();
  }, [fetchQuestions, resetQuestionState]);

  const onViewReview = useCallback(() => {
    setReviewMode(true);
  }, []);

  const onScopeChange = useCallback((nextScope: MapScope) => {
    setScope(nextScope);
    setTopic('');
    setSubtopic('');
    setReviewMode(false);
  }, []);

  const onTopicChange = useCallback((nextTopic: string) => {
    setTopic(nextTopic);
    setSubtopic('');
    setReviewMode(false);
  }, []);

  const onHint = useCallback(() => {
    if (!currentQuestion || submitted) return;
    if (hintLevel >= 2) return;
    const nextHintLevel = hintLevel + 1;
    setHintLevel(nextHintLevel);
    setHintsUsed((value) => value + 1);
    if (nextHintLevel === 1) {
      setHintText(currentQuestion.region_hint);
    } else {
      setHintText('Hint: Use coastlines, borders, and major geographic reference points.');
    }
  }, [currentQuestion, submitted, hintLevel]);

  const onTimerToggle = useCallback((enabled: boolean) => {
    setTimerEnabled(enabled);
    setTimeLeft(30);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-14 pt-8">
      <div className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
        <header className="rounded-lg border border-slate-200 bg-white p-5">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Map Practice</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Click on the map to answer geography location questions. You will get instant feedback, distance, and explanation.
          </p>
        </header>

        <MapFilters
          scope={scope}
          difficulty={difficulty}
          topic={topic}
          subtopic={subtopic}
          timerEnabled={timerEnabled}
          topics={topics}
          subtopics={filteredSubtopics}
          onScopeChange={onScopeChange}
          onDifficultyChange={setDifficulty}
          onTopicChange={onTopicChange}
          onSubtopicChange={setSubtopic}
          onTimerToggle={onTimerToggle}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="order-1 space-y-4 lg:order-2 lg:col-span-4">
            <MapQuestionPanel
              question={currentQuestion}
              selectedPoint={selectedPoint}
              feedback={feedback}
              submitted={submitted}
              submitting={submitting}
              hasNext={hasNext}
              timerEnabled={timerEnabled}
              timeLeft={timeLeft}
              hintLevel={hintLevel}
              hintText={hintText}
              onSubmit={onSubmit}
              onHint={onHint}
              onNext={onNext}
              onViewReview={onViewReview}
              onReset={onResetQuiz}
              loading={loading}
              error={error}
            />
            <div className="hidden lg:block">
              <MapScorePanel
                attempted={attempted}
                correct={correct}
                total={questions.length}
                hintsUsed={hintsUsed}
                timerEnabled={timerEnabled}
              />
            </div>
          </div>

          <div className="order-2 lg:order-1 lg:col-span-8">
            <MapQuizMap
              scope={scope}
              selectedPoint={selectedPoint}
              correctPoint={currentCorrectPoint}
              toleranceKm={effectiveToleranceKm}
              hintLevel={hintLevel}
              submitted={submitted}
              canSelect={!submitted && Boolean(currentQuestion)}
              onSelectPoint={setSelectedPoint}
            />
          </div>

          <div className="order-3 lg:hidden">
            <MapScorePanel
              attempted={attempted}
              correct={correct}
              total={questions.length}
              hintsUsed={hintsUsed}
              timerEnabled={timerEnabled}
            />
          </div>
        </div>

        {reviewMode && (
          <MapReviewPanel
            attempts={reviewAttempts}
            onRestart={onResetQuiz}
          />
        )}
      </div>
    </div>
  );
}
