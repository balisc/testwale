'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardCheck, CloudCheck, RefreshCcw } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import {
  resolveMockShowcaseCta,
  selectInitialMockExam,
  type MockShowcaseUserState,
  type PublicMockExamSummary,
} from '@/lib/mockTests/showcase';
import CBTPreviewCard from './CBTPreviewCard';
import ExamMockSelector from './ExamMockSelector';
import MockTestCTA from './MockTestCTA';

const BENEFITS = [
  { label: 'Real exam pattern', icon: ClipboardCheck },
  { label: 'Fresh test every time', icon: RefreshCcw },
  { label: 'Saved to your profile', icon: CloudCheck },
] as const;

type ShowcaseStateResponse = {
  authenticated?: boolean;
  userState?: MockShowcaseUserState | null;
};

export default function MockTestShowcaseSection({ exams }: { exams: PublicMockExamSummary[] }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const initialExam = useMemo(() => selectInitialMockExam(exams), [exams]);
  const [selectedId, setSelectedId] = useState(initialExam?.id ?? '');
  const [userState, setUserState] = useState<MockShowcaseUserState | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generatingRef = useRef(false);
  const idempotencyKeys = useRef(new Map<string, string>());

  const selectedExam = exams.find((exam) => exam.id === selectedId) ?? initialExam;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setUserState(null);
      return;
    }
    const controller = new AbortController();
    void fetch('/api/mock-tests/showcase-state', {
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    }).then(async (response) => {
      const body = await response.json() as ShowcaseStateResponse;
      if (!response.ok || body.authenticated !== true || !body.userState) throw new Error('showcase_state_unavailable');
      setUserState(body.userState);
    }).catch(() => {
      if (!controller.signal.aborted) setUserState({ activeTests: [], hasCompletedMock: false });
    });
    return () => controller.abort();
  }, [authLoading, user]);

  if (!selectedExam) return null;
  const cta = resolveMockShowcaseCta({ exam: selectedExam, authenticated: Boolean(user), userState });

  const generate = async () => {
    if (!user || !cta.canGenerate || generatingRef.current) return;
    generatingRef.current = true;
    setGenerating(true);
    setError(null);
    const existingKey = idempotencyKeys.current.get(selectedExam.id);
    const idempotencyKey = existingKey ?? crypto.randomUUID();
    idempotencyKeys.current.set(selectedExam.id, idempotencyKey);
    try {
      const response = await fetch('/api/mock-tests/generate', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idempotencyKey, examKey: selectedExam.examKey }),
      });
      const body = await response.json() as { testId?: string; code?: string; message?: string };
      if (response.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(selectedExam.destination)}`);
        return;
      }
      if (!response.ok || !body.testId) throw new Error(body.message ?? body.code ?? 'The mock test could not be generated.');
      idempotencyKeys.current.delete(selectedExam.id);
      router.push(`/mock-tests/${body.testId}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The mock test could not be generated.');
    } finally {
      generatingRef.current = false;
      setGenerating(false);
    }
  };

  return (
    <section
      id="full-length-mock-tests"
      aria-labelledby="mock-showcase-heading"
      className="border-b border-slate-200 bg-white py-16 sm:py-20 max-[479px]:py-10"
    >
      <div className="home-container w-full min-w-0">
        <div className="overflow-hidden rounded-[28px] border border-violet-100 bg-[#FBFAFF] p-4 shadow-[0_22px_70px_-42px_rgba(76,29,149,0.35)] sm:p-7 lg:p-10">
          <div className="grid min-w-0 items-center gap-10 lg:grid-cols-[minmax(0,0.76fr)_minmax(0,1.24fr)] lg:gap-8">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-lg border border-violet-600 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#6D28D9] max-[479px]:text-[10px] max-[479px]:tracking-wide">
                  Full-length mock tests
                </span>
                <span className="rounded-lg bg-[#6D28D9] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white max-[479px]:text-[10px] max-[479px]:tracking-wide">New</span>
              </div>
              <h2
                id="mock-showcase-heading"
                className="mt-5 max-w-[12ch] text-balance text-[28px] font-bold leading-tight tracking-tight text-[#18181B] sm:text-[36px] sm:leading-[44px] max-[479px]:text-2xl"
              >
                Practice Like It’s Exam Day.
              </h2>
              <p className="mt-3 max-w-xl text-base leading-7 text-[#667085] max-[479px]:text-sm max-[479px]:leading-6">
                Fresh exam-pattern mocks generated from verified questions—saved with complete performance analysis.
              </p>

              <ul className="mt-6 space-y-3.5" aria-label="Mock-test benefits">
                {BENEFITS.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <li key={benefit.label} className="flex min-h-11 items-center gap-3 text-sm font-medium text-[#344054]">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      {benefit.label}
                    </li>
                  );
                })}
              </ul>

              <div className="mt-7">
                <MockTestCTA cta={cta} generating={generating} onGenerate={() => void generate()} />
                <p className="mt-2.5 text-xs leading-5 text-[#667085]">
                  {user ? 'Your generated mock is saved automatically to your profile.' : 'Sign in to generate and save your test'}
                </p>
                {error ? <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
              </div>
            </div>

            <div className="min-w-0">
              <CBTPreviewCard exam={selectedExam} />
              <dl className="mx-auto mt-1 grid max-w-[680px] grid-cols-2 gap-2 text-center text-[10px] text-[#667085] sm:grid-cols-4 sm:text-xs">
                <div className="rounded-lg bg-white px-2 py-2"><dt className="font-medium">Questions</dt><dd className="mt-0.5 font-bold text-[#18181B]">{selectedExam.questionCount}</dd></div>
                <div className="rounded-lg bg-white px-2 py-2"><dt className="font-medium">Duration</dt><dd className="mt-0.5 font-bold text-[#18181B]">{selectedExam.durationMinutes} min</dd></div>
                <div className="rounded-lg bg-white px-2 py-2"><dt className="font-medium">Marks</dt><dd className="mt-0.5 font-bold text-[#18181B]">{selectedExam.maxMarks}</dd></div>
                <div className="rounded-lg bg-white px-2 py-2"><dt className="font-medium">Negative</dt><dd className="mt-0.5 font-bold text-[#18181B]">−{selectedExam.negativeMarking} · {selectedExam.timerLabel}</dd></div>
              </dl>
            </div>
          </div>

          <div className="mt-9 border-t border-violet-100 pt-6">
            <ExamMockSelector exams={exams} selectedExam={selectedExam} onSelect={(exam) => {
              setSelectedId(exam.id);
              setError(null);
            }} />
          </div>
        </div>
      </div>
    </section>
  );
}
