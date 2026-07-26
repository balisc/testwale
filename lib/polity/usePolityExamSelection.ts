'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { POLITY_EXAM_STORAGE_KEY } from '@/lib/polity/examRankingLabels';
import { normalizeExamCode } from '@/lib/polity';
import type { PolityRankedExamOption } from '@/types/polityExamRankingV2';

type UsePolityExamSelectionOptions = {
  examOptions: PolityRankedExamOption[];
  initialExamCode: string | null;
  initialInvalid: boolean;
};

export function usePolityExamSelection({
  examOptions,
  initialExamCode,
  initialInvalid,
}: UsePolityExamSelectionOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlExamRaw = searchParams.get('exam');
  const urlExam = urlExamRaw ? normalizeExamCode(urlExamRaw) : null;

  const validCodes = useMemo(
    () => new Set(examOptions.map((exam) => exam.exam_code)),
    [examOptions],
  );

  const selectedExam = useMemo(() => {
    if (urlExam && validCodes.has(urlExam)) {
      return examOptions.find((exam) => exam.exam_code === urlExam) ?? null;
    }
    if (initialExamCode && validCodes.has(initialExamCode) && !urlExam) {
      return examOptions.find((exam) => exam.exam_code === initialExamCode) ?? null;
    }
    return null;
  }, [urlExam, validCodes, examOptions, initialExamCode]);

  const isInvalidExam = Boolean(
    urlExam && !validCodes.has(urlExam) && (initialInvalid || !selectedExam),
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (urlExam) {
      if (validCodes.has(urlExam)) {
        window.localStorage.setItem(POLITY_EXAM_STORAGE_KEY, urlExam);
      }
      return;
    }

    if (initialExamCode && validCodes.has(initialExamCode)) {
      window.localStorage.setItem(POLITY_EXAM_STORAGE_KEY, initialExamCode);
      const params = new URLSearchParams(searchParams.toString());
      params.set('exam', initialExamCode);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [urlExam, validCodes, initialExamCode, pathname, router, searchParams]);

  const selectExam = useCallback(
    (examCode: string) => {
      const normalized = normalizeExamCode(examCode);
      if (!validCodes.has(normalized)) return;

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(POLITY_EXAM_STORAGE_KEY, normalized);
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set('exam', normalized);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams, validCodes],
  );

  return {
    selectedExam,
    selectedExamCode: selectedExam?.exam_code ?? null,
    isInvalidExam,
    invalidExamCode: isInvalidExam ? urlExam : null,
    selectExam,
  };
}

export function readStoredPolityExamCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(POLITY_EXAM_STORAGE_KEY);
    return value ? normalizeExamCode(value) : null;
  } catch {
    return null;
  }
}
