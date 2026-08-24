import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getAuthUserFromCookies } from '@/lib/authCookies';
import { logPracticeDebug, serializeError, toJsonSafe } from '@/lib/practiceDebugLog';
import {
  lookupQuestionAnswerOnServer,
  submitQuestionAnswerForUser,
} from '@/lib/practiceServer';
import { STALE_QUESTION_CODE } from '@/lib/questionBatchCache';
import { revalidateQuestionBatchCache } from '@/lib/revalidateQuestionBatchCache';
import { getSupabaseHostname } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  getExamLearningProgressCacheTag,
  getSelectedExamContext,
} from '@/lib/examLearningServer';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'private, no-store' } as const;

type SubmitBody = {
  questionId?: string;
  selectedOption?: string;
  timeTakenSeconds?: number | null;
  subtopicId?: string | null;
  topicId?: string | null;
  subjectSlug?: string | null;
  topicSlug?: string | null;
  subtopicSlug?: string | null;
  cacheSource?: string | null;
};

type ApiCode =
  | 'INVALID_REQUEST'
  | 'UNAUTHENTICATED'
  | 'QUESTION_NOT_FOUND'
  | 'STALE_QUESTION'
  | 'DUPLICATE_SUBMISSION'
  | 'INTERNAL_ERROR';

function jsonApi(
  status: number,
  body: Record<string, unknown>,
) {
  return NextResponse.json(toJsonSafe(body), { status, headers: NO_STORE });
}

function bustQuestionBatchCache(subtopicId: string, topicId: string) {
  if (!subtopicId && !topicId) return;
  revalidateQuestionBatchCache({
    subtopicId: subtopicId || null,
    topicId: topicId || null,
  });
}

async function questionExistsPublic(
  questionId: string,
  examProfileId?: string,
): Promise<boolean | null> {
  const admin = getSupabaseAdmin();
  const client = admin;
  if (!client) {
    // Fall back to lookup path below when no service role.
    return null;
  }

  const query = client
    .from('questions')
    .select('id, question_exam_profile_mappings!inner(exam_profile_id, is_active)')
    .eq('id', questionId)
    .eq('is_active', true)
    .eq('is_verified', true)
    .eq('question_exam_profile_mappings.exam_profile_id', examProfileId ?? '')
    .eq('question_exam_profile_mappings.is_active', true);
  const { data, error } = await query.maybeSingle();

  if (error) {
    logPracticeDebug('[practice/submit] existence check failed', {
      supabaseError: serializeError(error),
    });
    return null;
  }

  return Boolean(data?.id);
}

function staleQuestionBody(extra?: Record<string, unknown>) {
  return {
    ok: false,
    code: STALE_QUESTION_CODE,
    error: STALE_QUESTION_CODE,
    message: 'This question is no longer available.',
    refreshSession: true,
    ...extra,
  };
}

function hasAnswerExplanation(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const localized = value as Record<string, unknown>;
  return ['en', 'hi'].some(
    (key) => typeof localized[key] === 'string' && localized[key].trim().length > 0,
  );
}

export async function POST(request: Request) {
  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return jsonApi(400, {
      ok: false,
      code: 'INVALID_REQUEST' satisfies ApiCode,
      error: 'INVALID_REQUEST',
      message: 'Invalid request body.',
      refreshSession: false,
    });
  }

  const questionId = String(body.questionId ?? '').trim();
  const selectedOption = String(body.selectedOption ?? '').trim().toUpperCase();
  const subtopicId = body.subtopicId ? String(body.subtopicId).trim() : '';
  const topicId = body.topicId ? String(body.topicId).trim() : '';
  const cacheSource = body.cacheSource ? String(body.cacheSource).trim() : 'client';

  const uuidOk =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      questionId,
    );

  if (!uuidOk || !['A', 'B', 'C', 'D'].includes(selectedOption)) {
    return jsonApi(400, {
      ok: false,
      code: 'INVALID_REQUEST' satisfies ApiCode,
      error: 'INVALID_REQUEST',
      message: 'questionId must be a UUID and selectedOption must be A–D.',
      refreshSession: false,
    });
  }

  const timeTakenSeconds =
    typeof body.timeTakenSeconds === 'number' && body.timeTakenSeconds >= 0
      ? Math.min(86_400, Math.round(body.timeTakenSeconds))
      : null;

  const user = await getAuthUserFromCookies();

  logPracticeDebug('[practice/submit] attempt', {
    questionId,
    selectedOption,
    cacheSource,
    subjectSlug: body.subjectSlug ?? null,
    topicSlug: body.topicSlug ?? null,
    subtopicSlug: body.subtopicSlug ?? null,
    subtopicId: subtopicId || null,
    topicId: topicId || null,
    supabaseHost: getSupabaseHostname(),
    authenticated: Boolean(user),
  });

  if (user) {
    const selected = await getSelectedExamContext();
    if (selected.status === 'incomplete') return jsonApi(409, { ok: false, code: 'ONBOARDING_INCOMPLETE', error: 'ONBOARDING_INCOMPLETE' });
    if (selected.status === 'inactive') return jsonApi(409, { ok: false, code: 'SELECTED_EXAM_INACTIVE', error: 'SELECTED_EXAM_INACTIVE' });
    if (selected.status !== 'ready' || selected.userId !== user.id) return jsonApi(503, { ok: false, code: 'INTERNAL_ERROR', error: 'INTERNAL_ERROR' });
    const exists = await questionExistsPublic(questionId, selected.examProfileId);
    if (exists === false) {
      bustQuestionBatchCache(subtopicId, topicId);
      return jsonApi(409, staleQuestionBody({ questionId }));
    }

    try {
      const result = await submitQuestionAnswerForUser(
        user.id,
        questionId,
        selectedOption,
        timeTakenSeconds,
      );

      if (!result) {
        // Distinguish hard-missing question from other RPC failures when possible.
        const recheck = await questionExistsPublic(questionId, selected.examProfileId);
        if (recheck === false) {
          bustQuestionBatchCache(subtopicId, topicId);
          return jsonApi(409, staleQuestionBody({ questionId }));
        }

        logPracticeDebug('[practice/submit] authenticated submit returned null', {
          questionId,
          exists: recheck,
        });

        return jsonApi(500, {
          ok: false,
          code: 'INTERNAL_ERROR' satisfies ApiCode,
          error: 'INTERNAL_ERROR',
          message: 'Could not submit answer.',
          refreshSession: false,
        });
      }

      let answerResult = result;
      if (!result.correct_option?.trim() || !hasAnswerExplanation(result.explanation)) {
        // Older submit RPC versions can save correctly but omit answer-detail
        // fields. Fill them from the authoritative question row before replying.
        const reveal = await lookupQuestionAnswerOnServer(questionId, selectedOption);
        if (reveal.ok) {
          answerResult = {
            ...result,
            correct_option: result.correct_option?.trim()
              ? result.correct_option
              : reveal.data.correct_option,
            explanation: hasAnswerExplanation(result.explanation)
              ? result.explanation
              : reveal.data.explanation,
          };
        }
      }

      revalidateTag(getExamLearningProgressCacheTag(user.id), { expire: 0 });
      return NextResponse.json(toJsonSafe(answerResult), { headers: NO_STORE });
    } catch (error) {
      logPracticeDebug('[practice/submit] authenticated submit threw', {
        supabaseError: serializeError(error),
        questionId,
      });
      return jsonApi(500, {
        ok: false,
        code: 'INTERNAL_ERROR' satisfies ApiCode,
        error: 'INTERNAL_ERROR',
        message: 'Could not submit answer.',
        refreshSession: false,
      });
    }
  }

  // Guest reveal — never cache.
  const lookup = await lookupQuestionAnswerOnServer(questionId, selectedOption);
  if (!lookup.ok) {
    bustQuestionBatchCache(subtopicId, topicId);

    logPracticeDebug('[practice/submit] guest lookup failed', {
      questionId,
      reason: lookup.reason,
      cacheSource,
      supabaseHost: getSupabaseHostname(),
      supabaseError: lookup.error ? serializeError(lookup.error) : null,
    });

    if (lookup.reason === 'zero_rows' || lookup.reason === 'invalid_option') {
      if (lookup.reason === 'invalid_option') {
        return jsonApi(400, {
          ok: false,
          code: 'INVALID_REQUEST',
          error: 'INVALID_REQUEST',
          message: 'Invalid selected option.',
          refreshSession: false,
        });
      }
      return jsonApi(409, staleQuestionBody({ questionId }));
    }

    return jsonApi(500, {
      ok: false,
      code: 'INTERNAL_ERROR' satisfies ApiCode,
      error: 'INTERNAL_ERROR',
      message: 'Could not check answer.',
      refreshSession: false,
      ...(process.env.NODE_ENV !== 'production' && lookup.error
        ? { supabaseError: serializeError(lookup.error) }
        : {}),
    });
  }

  return NextResponse.json(toJsonSafe(lookup.data), { headers: NO_STORE });
}
