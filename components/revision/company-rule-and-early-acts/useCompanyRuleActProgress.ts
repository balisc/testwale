'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  COMPANY_RULE_ACT_CHAPTER_TOTAL,
  COMPANY_RULE_ACT_CHAPTERS,
  COMPANY_RULE_REVISION_VERSION,
} from '@/content/revision/indian-polity/company-rule-and-early-acts.v1';
import { useAuth } from '@/lib/AuthContext';

const STORAGE_PREFIX = 'qw-revision-act-progress';

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${COMPANY_RULE_REVISION_VERSION}:${userId}`;
}

function readCompletedIds(userId: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const valid = new Set<string>(COMPANY_RULE_ACT_CHAPTERS.map((chapter) => chapter.id));
    return parsed.filter((id): id is string => typeof id === 'string' && valid.has(id));
  } catch {
    return [];
  }
}

function writeCompletedIds(userId: string, ids: string[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey(userId), JSON.stringify(ids));
}

export type CompanyRuleActProgress = {
  kind: 'guest' | 'tracked';
  completed: number;
  total: number;
  percent: number;
  completedIds: string[];
  markChapterComplete: (chapterId: string) => void;
};

export function useCompanyRuleActProgress(): CompanyRuleActProgress {
  const { user, loading } = useAuth();
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  useEffect(() => {
    if (loading || !user) {
      setCompletedIds([]);
      return;
    }
    setCompletedIds(readCompletedIds(user.id));
  }, [user, loading]);

  const markChapterComplete = useCallback(
    (chapterId: string) => {
      if (!user) return;
      if (!COMPANY_RULE_ACT_CHAPTERS.some((chapter) => chapter.id === chapterId)) return;
      setCompletedIds((prev) => {
        if (prev.includes(chapterId)) return prev;
        const next = [...prev, chapterId];
        writeCompletedIds(user.id, next);
        return next;
      });
    },
    [user],
  );

  return useMemo(() => {
    const total = COMPANY_RULE_ACT_CHAPTER_TOTAL;
    if (!user) {
      return {
        kind: 'guest' as const,
        completed: 0,
        total,
        percent: 0,
        completedIds: [],
        markChapterComplete,
      };
    }
    const completed = completedIds.length;
    return {
      kind: 'tracked' as const,
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      completedIds,
      markChapterComplete,
    };
  }, [user, completedIds, markChapterComplete]);
}
