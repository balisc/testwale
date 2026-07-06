import { NextResponse } from 'next/server';
import {
  clampQuestionLimit,
  DEFAULT_QUESTION_LIMIT,
  MAX_QUESTION_LIMIT,
} from '@/lib/supabaseQueryLimits';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export type QuestionListFilters = {
  subject?: string;
  topic?: string;
  topicId?: string;
  subtopicId?: string;
  subtopicSlug?: string;
};

export function resolveQuestionListLimit(raw: string | null | undefined): number {
  return clampQuestionLimit(raw, DEFAULT_QUESTION_LIMIT);
}

export function parseQuestionListFilters(searchParams: URLSearchParams): QuestionListFilters {
  return {
    subject: searchParams.get('subject')?.trim().toLowerCase() || undefined,
    topic: searchParams.get('topic')?.trim() || undefined,
    topicId: searchParams.get('topic_id')?.trim() || undefined,
    subtopicId: searchParams.get('subtopic_id')?.trim() || undefined,
    subtopicSlug: searchParams.get('subtopic_slug')?.trim() || undefined,
  };
}

export function hasRequiredQuestionListFilter(filters: QuestionListFilters): boolean {
  return Boolean(
    filters.subject ||
      filters.topic ||
      filters.topicId ||
      filters.subtopicId ||
      filters.subtopicSlug,
  );
}

export function missingQuestionListFilterResponse() {
  return NextResponse.json(
    {
      error:
        'A filter is required (subject, topic, topic_id, subtopic_id, or subtopic_slug). Full question bank requests are not allowed.',
    },
    { status: 400, headers: NO_STORE },
  );
}

export function enforceQuestionListLimit(rows: unknown[], limit: number) {
  return rows.slice(0, Math.min(limit, MAX_QUESTION_LIMIT));
}

export function questionListJsonResponse(questions: unknown[], limit: number) {
  const capped = enforceQuestionListLimit(questions, limit);
  return NextResponse.json({ questions: capped }, { headers: NO_STORE });
}
