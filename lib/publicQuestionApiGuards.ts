import { NextResponse } from 'next/server';
import {
  clampQuestionLimit,
  DEFAULT_QUESTION_LIMIT,
  MAX_QUESTION_LIMIT,
  QUESTION_BATCH_PAGE_SIZE,
} from '@/lib/supabaseQueryLimits';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export const PRIVATE_NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store',
} as const;

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

export function privateNoStoreJsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: PRIVATE_NO_STORE_HEADERS });
}

/** Integer batch size for cursor APIs: default fallback, min 1, max MAX_QUESTION_LIMIT. */
export function parseStrictBatchSize(
  raw: string | null | undefined,
  fallback = QUESTION_BATCH_PAGE_SIZE,
): { ok: true; value: number } | { ok: false } {
  if (raw == null || raw.trim() === '') {
    return { ok: true, value: fallback };
  }

  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    return { ok: false };
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (parsed < 1 || parsed > MAX_QUESTION_LIMIT) {
    return { ok: false };
  }

  return { ok: true, value: parsed };
}

const MAX_CORRECT_IDS_LIST = MAX_QUESTION_LIMIT;
export const MAX_CORRECT_IDS_BODY_BYTES = 8192;

export function isCorrectIdsBodyTooLarge(byteLength: number): boolean {
  if (!Number.isFinite(byteLength) || byteLength < 0) return false;
  return byteLength > MAX_CORRECT_IDS_BODY_BYTES;
}

export function isTextBodyTooLarge(text: string, maxBytes = MAX_CORRECT_IDS_BODY_BYTES): boolean {
  return Buffer.byteLength(text, 'utf8') > maxBytes;
}

/** Validates POST /api/practice/correct-ids questionIds (1–50 UUIDs, deduped). */
export function parseCorrectIdsPayload(
  body: unknown,
): { ok: true; questionIds: string[] } | { ok: false; error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'invalid_body' };
  }

  const rawIds = (body as { questionIds?: unknown }).questionIds;
  if (!Array.isArray(rawIds)) {
    return { ok: false, error: 'invalid_question_ids' };
  }

  if (rawIds.length < 1 || rawIds.length > MAX_CORRECT_IDS_LIST) {
    return { ok: false, error: 'invalid_question_ids' };
  }

  const seen = new Set<string>();
  const questionIds: string[] = [];

  for (const raw of rawIds) {
    if (typeof raw !== 'string' && typeof raw !== 'number') {
      return { ok: false, error: 'invalid_question_ids' };
    }

    const id = String(raw).trim();
    if (!isUuid(id)) {
      return { ok: false, error: 'invalid_question_ids' };
    }

    if (seen.has(id)) continue;
    seen.add(id);
    questionIds.push(id);
  }

  if (questionIds.length < 1) {
    return { ok: false, error: 'invalid_question_ids' };
  }

  return { ok: true, questionIds };
}

/** Validates POST /api/practice/attempts questionIds (0–50 UUIDs, deduped). */
export function parseBatchQuestionIdsPayload(
  body: unknown,
): { ok: true; questionIds: string[] } | { ok: false; error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'invalid_body' };
  }

  const rawIds = (body as { questionIds?: unknown }).questionIds;
  if (!Array.isArray(rawIds)) {
    return { ok: false, error: 'invalid_question_ids' };
  }

  if (rawIds.length > MAX_CORRECT_IDS_LIST) {
    return { ok: false, error: 'invalid_question_ids' };
  }

  const seen = new Set<string>();
  const questionIds: string[] = [];

  for (const raw of rawIds) {
    if (typeof raw !== 'string' && typeof raw !== 'number') {
      return { ok: false, error: 'invalid_question_ids' };
    }

    const id = String(raw).trim();
    if (!isUuid(id)) {
      return { ok: false, error: 'invalid_question_ids' };
    }

    if (seen.has(id)) continue;
    seen.add(id);
    questionIds.push(id);
  }

  return { ok: true, questionIds };
}

export function validateQuestionBatchPagePayload(
  payload: unknown,
  fetchedCursor: string | null,
): { ok: true; page: import('@/types/polity').QuestionBatchPage } | { ok: false } {
  if (!payload || typeof payload !== 'object') return { ok: false };
  const row = payload as import('@/types/polity').QuestionBatchPage;
  if (!Array.isArray(row.questions)) return { ok: false };
  if (typeof row.hasMore !== 'boolean') return { ok: false };
  if (row.hasMore && (!row.nextCursor || !isUuid(row.nextCursor))) return { ok: false };
  if (fetchedCursor && row.nextCursor && row.nextCursor === fetchedCursor) return { ok: false };
  return { ok: true, page: row };
}

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
