'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { useLanguage } from '../../../../lib/LanguageContext';
import { buildQuestionPath, generateQuestionSlug } from '@/lib/slugGenerator';

type QuestionRow = Record<string, any>;

type LocalizedText = string | { en?: string; hi?: string };

function extractText(value: any, lang: 'en' | 'hi'): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    return String(value[lang] ?? value.en ?? value.hi ?? '');
  }
  return String(value);
}

function getOptionTexts(rawOptions: any, lang: 'en' | 'hi'): string[] {
  if (!rawOptions) return [];

  if (Array.isArray(rawOptions)) {
    return rawOptions.map((item) => extractText(item, lang)).filter(Boolean);
  }

  if (typeof rawOptions === 'string') {
    try {
      return getOptionTexts(JSON.parse(rawOptions), lang);
    } catch {
      return [rawOptions].map((item) => extractText(item, lang)).filter(Boolean);
    }
  }

  if (typeof rawOptions === 'object') {
    if (Array.isArray(rawOptions[lang])) {
      return rawOptions[lang].map((item: any) => extractText(item, lang)).filter(Boolean);
    }

    if (Array.isArray(rawOptions.en)) {
      return rawOptions.en.map((item: any) => extractText(item, lang)).filter(Boolean);
    }

    const sortedEntries = Object.entries(rawOptions).sort(([keyA], [keyB]) =>
      keyA.localeCompare(keyB, undefined, { numeric: true })
    );

    return sortedEntries.map(([, value]) => extractText(value, lang)).filter(Boolean);
  }

  return [];
}

function resolveCorrectAnswerText(correctAnswerField: any, lang: 'en' | 'hi', finalOptions: string[]): string {
  const extracted = extractText(correctAnswerField, lang).trim();

  if (typeof extracted === 'string' && extracted.length === 1 && /^[a-dA-D]$/.test(extracted)) {
    const answerIndex = extracted.toUpperCase().charCodeAt(0) - 65;
    return finalOptions[answerIndex]?.trim() ?? '';
  }

  return extracted;
}

function getQuestionId(row: any, fallbackIndex: number) {
  return String(row.id ?? row._id ?? row.pk ?? row.question_id ?? `question-${fallbackIndex + 1}`);
}

function getQuestionText(row: any, lang: 'en' | 'hi') {
  return (
    extractText(row.question ?? row.question_text ?? row.question_en ?? row.question_hi ?? row.title ?? '', lang) ||
    extractText(row.topic ?? row.topic_en ?? row.topic_hi ?? '', lang) ||
    `Question ${getQuestionId(row, 0)}`
  );
}

export default function ClientQuiz({
  questions,
  decodedTopic,
  subject,
  fetchError,
}: {
  questions: QuestionRow[];
  decodedTopic: string;
  subject: string;
  fetchError?: string | null;
}) {
  const { language: lang, setLanguage } = useLanguage();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<QuestionRow[]>(questions ?? []);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const timerRef = useRef<number | null>(null);
  const autoAdvanceTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (isAnswered) {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }

    // timer is handled below

    timerRef.current = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isAnswered, currentQuestionIndex]);

  useEffect(() => {
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    if (!currentQuestion) return;

    const questionId = getQuestionId(currentQuestion, currentQuestionIndex);
    const questionText = getQuestionText(currentQuestion, lang);
    const newPath = buildQuestionPath(questionId, questionText);

    if (typeof window !== 'undefined' && window.location.pathname !== newPath) {
      window.history.replaceState({}, '', newPath);
      document.title = `${questionText} | ${subject} | Questionwale`;
    }
  }, [currentQuestionIndex, shuffledQuestions, lang, subject]);

  // Shuffle questions on client mount so each refresh shows a different order
  useEffect(() => {
    function shuffle<T>(arr: T[]) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
      return arr;
    }

    if (Array.isArray(questions) && questions.length > 0) {
      setShuffledQuestions(shuffle([...questions]));
      setCurrentQuestionIndex(0);
    }
  }, [questions]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (autoAdvanceTimeoutRef.current !== null) {
        window.clearTimeout(autoAdvanceTimeoutRef.current);
        autoAdvanceTimeoutRef.current = null;
      }
    };
  }, []);

  // Auto-advance when timer runs out
  useEffect(() => {
    if (timeLeft === 0 && !isAnswered) {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (currentQuestionIndex + 1 < shuffledQuestions.length) {
        // Move to next question without showing answer
        setCurrentQuestionIndex((prev) => prev + 1);
        resetForNextQuestion();
      } else {
        // Last question reached - finish the quiz
        setIsAnswered(true);
        setQuizCompleted(true);
      }
    }
  }, [timeLeft, currentQuestionIndex, isAnswered, shuffledQuestions.length]);

  const resetForNextQuestion = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoAdvanceTimeoutRef.current !== null) {
      window.clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }

    setSelectedOptionIndex(null);
    setIsAnswered(false);
    setIsAnswerCorrect(false);
    setTimeLeft(30);
    setQuizCompleted(false);
  };

  if (fetchError) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="pt-20 pb-12">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Quiz not available</h1>
            <p className="text-slate-600 mb-6">{fetchError}</p>
            <Link href={`/subjects/${subject}`} className="inline-flex rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">
              Back to Topics
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const questionsPresent = Array.isArray(shuffledQuestions) && shuffledQuestions.length > 0;

  if (!questionsPresent) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="pt-20 pb-12">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">No questions found</h1>
            <p className="text-slate-600 mb-6">No questions available for this topic.</p>
            <Link href={`/subjects/${subject}`} className="inline-flex rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">
              Back to Topics
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const rawOptions = currentQuestion.options ?? { en: currentQuestion.options_en ?? [], hi: currentQuestion.options_hi ?? [] };
  const finalOptions = getOptionTexts(rawOptions, lang);

  const questionText =
    extractText(currentQuestion.question ?? currentQuestion.question_text ?? currentQuestion.question_en ?? currentQuestion.question_hi, lang) ||
    'Untitled question';

  const questionId = String(
    currentQuestion.id ?? currentQuestion._id ?? currentQuestion.pk ?? currentQuestion.ID ?? currentQuestion.question_id ?? `${subject}-${currentQuestionIndex + 1}`
  );

  const askedInText = extractText(currentQuestion.asked_in ?? currentQuestion.askedIn ?? currentQuestion.askedInText, lang);

  const correctAnswerField = currentQuestion.correct_answer ?? currentQuestion.answer;
  const correctAnswerText = resolveCorrectAnswerText(correctAnswerField, lang, finalOptions);
  const explanationText = extractText(currentQuestion.explanation ?? currentQuestion.explanation_text, lang);

  const correctAnswerIndex = finalOptions.findIndex((option) => option.trim() === correctAnswerText.trim());

  const handleOptionClick = (clickedIndex: number) => {
    if (isAnswered) return;

    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoAdvanceTimeoutRef.current !== null) {
      window.clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }

    const clickedOptionText = finalOptions[clickedIndex] ?? '';
    const isMatch = clickedOptionText.trim() === correctAnswerText.trim();

    setSelectedOptionIndex(clickedIndex);
    setIsAnswered(true);
    setIsAnswerCorrect(isMatch);

    if (isMatch) {
      setScore((prev) => prev + 1);
      autoAdvanceTimeoutRef.current = window.setTimeout(() => {
        autoAdvanceTimeoutRef.current = null;
        if (currentQuestionIndex + 1 < shuffledQuestions.length) {
          setCurrentQuestionIndex((prev) => prev + 1);
          resetForNextQuestion();
        } else {
          setQuizCompleted(true);
        }
      }, 1000);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      resetForNextQuestion();
    }
  };

  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="pt-20 pb-16">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Quiz complete</p>
              <h1 className="mt-6 text-4xl font-bold text-slate-900">Better luck next time</h1>
              <p className="mt-4 text-slate-600">You answered <span className="font-semibold text-slate-900">{score}</span> of <span className="font-semibold text-slate-900">{shuffledQuestions.length}</span> correctly.</p>
              <p className="mt-2 text-slate-500">Review what you learned and try the next topic.</p>
              <Link href={`/subjects/${subject}`} className="mt-8 inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">
                Back to Topics
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{decodedTopic} Quiz</h1>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-1 min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 sm:px-4 sm:py-2 sm:text-sm">
                  Question {currentQuestionIndex + 1}
                </div>
                {askedInText && (
                  <div className="rounded-full bg-slate-100 text-slate-600 px-3 py-1.5 text-[10px] font-medium sm:text-xs">
                    {askedInText}
                  </div>
                )}
              </div>
              <div className={`flex h-11 min-w-[3rem] items-center justify-center gap-2 rounded-full border px-3 text-sm font-semibold transition ${timeLeft <= 10 ? 'border-red-200 bg-red-50 text-red-600' : 'border-slate-200 bg-slate-50 text-slate-900'}`}>
                <span>⏱️</span>
                <span>{String(timeLeft).padStart(2, '0')}</span>
              </div>
            </div>

            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900">{questionText}</h2>
            </div>

            <div className="grid gap-3 mb-6">
              {finalOptions.length ? (
                finalOptions.map((option, optionIndex) => {
                  const isSelected = selectedOptionIndex === optionIndex;
                  const isCorrectOption = optionIndex === correctAnswerIndex;
                  const isSelectedCorrect = isAnswered && isSelected && isAnswerCorrect;
                  const isSelectedIncorrect = isAnswered && isSelected && !isAnswerCorrect;
                  const shouldRevealCorrect = isAnswered && !isAnswerCorrect && isCorrectOption;

                  let buttonClass =
                    'rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 text-left cursor-pointer transition hover:border-slate-400 hover:bg-slate-50';

                  if (isSelectedCorrect || shouldRevealCorrect) {
                    buttonClass =
                      'rounded-2xl border border-green-500 bg-green-50 px-4 py-3 text-green-700 text-left cursor-default';
                  } else if (isSelectedIncorrect) {
                    buttonClass =
                      'rounded-2xl border border-red-500 bg-red-50 px-4 py-3 text-red-700 text-left cursor-default';
                  }

                  return (
                    <motion.button
                      key={`${option}-${optionIndex}`}
                      type="button"
                      onClick={() => handleOptionClick(optionIndex)}
                      disabled={isAnswered}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      className={buttonClass}
                    >
                      <span className="font-semibold mr-2">{String.fromCharCode(65 + optionIndex)}.</span>
                      {option}
                    </motion.button>
                  );
                })
              ) : (
                <p className="text-slate-600">No options available for this question.</p>
              )}
            </div>

            {isAnswered && !isAnswerCorrect && explanationText && selectedOptionIndex !== null && (
              <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6">
                <p className="text-sm font-semibold text-blue-900 mb-2">Explanation:</p>
                <p className="text-blue-800">{explanationText}</p>
              </div>
            )}

            {isAnswered && !isAnswerCorrect && currentQuestionIndex < shuffledQuestions.length - 1 && (
              <div className="mt-6 text-center">
                <motion.button
                  type="button"
                  onClick={handleNext}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
                >
                  Next Question →
                </motion.button>
              </div>
            )}

            {isAnswered && currentQuestionIndex === shuffledQuestions.length - 1 && !quizCompleted && !isAnswerCorrect && (
              <div className="mt-6 text-center">
                <motion.button
                  type="button"
                  onClick={() => setQuizCompleted(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
                >
                  Finish Quiz →
                </motion.button>
              </div>
            )}

            {quizCompleted && (
              <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Quiz complete</p>
                <h2 className="mt-4 text-3xl font-bold text-slate-900">Better luck next time</h2>
                <p className="mt-4 text-slate-600">You answered <span className="font-semibold text-slate-900">{score}</span> of <span className="font-semibold text-slate-900">{shuffledQuestions.length}</span> correctly.</p>
                <p className="mt-2 text-slate-500">Review what you learned and try the next topic.</p>
                <Link href={`/subjects/${subject}`} legacyBehavior>
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
                  >
                    Back to Topics
                  </motion.a>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
