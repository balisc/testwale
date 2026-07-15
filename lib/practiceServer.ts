import type { SupabaseClient } from '@supabase/supabase-js';
import supabase, { getSupabaseHostname } from '@/lib/supabase';
import type { ReportQuestionResponse, SubmitAnswerResponse, PracticeProgress, UserAttemptSummary, ScopedProgressSnapshot } from '@/lib/practice';
import type { AdvanceSubtopicCycleResult, SubtopicQuestionBatchState } from '@/lib/practiceMastery';
import {
  parseAdvanceSubtopicCycleResult,
  parseSubtopicQuestionBatchState,
} from '@/lib/practiceMastery';

export type PracticeMasteryRpcError =
  | 'mastery_migration_pending'
  | 'question_state_failed'
  | 'advance_cycle_failed'
  | 'invalid_rpc_response';

export type PracticeSupabaseErrorDetails = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

/** Log full PostgREST/Postgres error in development; keep production logs short. */
function logPracticeSupabaseError(scope: string, error: PracticeSupabaseErrorDetails | null | undefined) {
  if (!error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[${scope}]`, { code: null, message: 'null response / no row' });
    }
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${scope}]`, {
      code: error.code ?? null,
      message: error.message ?? null,
      details: error.details ?? null,
      hint: error.hint ?? null,
    });
    return;
  }

  console.error(`[${scope}]`, error.message ?? error);
}

/**
 * True only when the RPC itself is missing from the schema cache.
 * Never treat Postgres 42703 (undefined_column) as a missing function —
 * messages like "column questions.subject does not exist" also contain "does not exist".
 */
function isMissingRpcError(error: PracticeSupabaseErrorDetails | null | undefined): boolean {
  if (!error) return false;
  if (error.code === '42703') return false;
  return (
    error.code === '42883' ||
    error.code === 'PGRST202' ||
    error.message?.includes('Could not find the function') === true ||
    /function .+ does not exist/i.test(error.message ?? '') === true
  );
}

function asPracticeSupabaseError(error: unknown): PracticeSupabaseErrorDetails | null {
  if (!error || typeof error !== 'object') return null;
  const row = error as PracticeSupabaseErrorDetails;
  return {
    code: row.code,
    message: row.message,
    details: row.details,
    hint: row.hint,
  };
}
import type { RecordQuestionAttemptInput, UserProgressDashboard } from '@/lib/practiceAnalytics';
import { normalizeProgressDashboard } from '@/lib/practiceAnalytics';
import { getAuthUserFromCookies } from '@/lib/authCookies';
import { createPracticeProof } from '@/lib/practiceProof';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

/** Service role client when configured; otherwise null (signed RPC + anon client is used). */
export async function getPracticeAdmin() {
  const admin = getSupabaseAdmin();
  if (!admin) return { admin: null, error: null };
  return { admin, error: null };
}

/** Requires cookie session only — does not require SUPABASE_SERVICE_ROLE_KEY. */
export async function requirePracticeUser() {
  const user = await getAuthUserFromCookies();
  if (!user) return { user: null, admin: null, error: 'unauthorized' as const };
  const admin = getSupabaseAdmin();
  return { user, admin, error: null };
}

export function practiceErrorResponse(
  error: string,
  status: number,
  details?: PracticeSupabaseErrorDetails | Record<string, unknown> | null,
) {
  const isStale = error === 'STALE_QUESTION' || error === 'stale_question';
  const body: Record<string, unknown> = {
    error: isStale ? 'STALE_QUESTION' : error,
  };
  if (isStale) {
    body.code = 'STALE_QUESTION';
  }
  if (process.env.NODE_ENV !== 'production' && details) {
    body.details = details;
  } else if (isStale && details && typeof details === 'object' && 'reason' in details) {
    // Minimal production hint so clients can branch without leaking internals.
    body.reason = (details as { reason?: unknown }).reason ?? 'zero_rows';
  }
  return Response.json(body, { status });
}

function parseScopedProgress(raw: unknown): ScopedProgressSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const attempted = Number(row.attempted ?? row.attempts_count ?? 0);
  const correct = Number(row.correct ?? row.correct_count ?? 0);
  const wrong = Number(row.wrong ?? row.wrong_count ?? attempted - correct);
  const accuracy = Number(row.accuracy ?? row.accuracy_percent ?? 0);
  return { attempted, correct, wrong, accuracy };
}

function scopedProgressToPracticeProgress(snapshot: ScopedProgressSnapshot): PracticeProgress {
  return {
    attempted: snapshot.attempted,
    correct: snapshot.correct,
    wrong: snapshot.wrong,
    accuracy: snapshot.accuracy,
    bySubject: [],
    byTopic: [],
  };
}

async function fetchScopedProgressFromViews(
  admin: SupabaseClient,
  userId: string,
  ids: { subjectId: string | null; topicId: string | null; subtopicId: string | null },
): Promise<{
  progress: PracticeProgress;
  subtopic_progress: ScopedProgressSnapshot | null;
  topic_progress: ScopedProgressSnapshot | null;
  subject_progress: ScopedProgressSnapshot | null;
} | null> {
  let subtopicProgress: ScopedProgressSnapshot | null = null;
  let topicProgress: ScopedProgressSnapshot | null = null;
  let subjectProgress: ScopedProgressSnapshot | null = null;

  if (ids.subtopicId) {
    const { data } = await admin
      .from('user_subtopic_progress')
      .select('attempts_count, correct_count, wrong_count, accuracy_percent')
      .eq('user_id', userId)
      .eq('subtopic_id', ids.subtopicId)
      .maybeSingle();
    if (data) {
      subtopicProgress = parseScopedProgress({
        attempted: data.attempts_count,
        correct: data.correct_count,
        wrong: data.wrong_count,
        accuracy: data.accuracy_percent,
      });
    }
  }

  if (ids.topicId) {
    const { data } = await admin
      .from('user_topic_progress')
      .select('attempts_count, correct_count, wrong_count, accuracy_percent')
      .eq('user_id', userId)
      .eq('topic_id', ids.topicId)
      .maybeSingle();
    if (data) {
      topicProgress = parseScopedProgress({
        attempted: data.attempts_count,
        correct: data.correct_count,
        wrong: data.wrong_count,
        accuracy: data.accuracy_percent,
      });
    }
  }

  if (ids.subjectId) {
    const { data } = await admin
      .from('user_subject_progress')
      .select('attempts_count, correct_count, wrong_count, accuracy_percent')
      .eq('user_id', userId)
      .eq('subject_id', ids.subjectId)
      .maybeSingle();
    if (data) {
      subjectProgress = parseScopedProgress({
        attempted: data.attempts_count,
        correct: data.correct_count,
        wrong: data.wrong_count,
        accuracy: data.accuracy_percent,
      });
    }
  }

  const scoped =
    subtopicProgress ?? topicProgress ?? subjectProgress ?? {
      attempted: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
    };

  return {
    progress: scopedProgressToPracticeProgress(scoped),
    subtopic_progress: subtopicProgress,
    topic_progress: topicProgress,
    subject_progress: subjectProgress,
  };
}

function buildPracticeProgress(
  rows: Array<{ subject_id: string | null; topic_id: string | null; is_correct: boolean }>,
): PracticeProgress {
  const attempted = rows.length;
  const correct = rows.filter((row) => row.is_correct).length;
  const wrong = attempted - correct;
  const accuracy = attempted > 0 ? Math.round((correct * 1000) / attempted) / 10 : 0;

  const subjectMap = new Map<string, { attempted: number; correct: number }>();
  const topicMap = new Map<string, { attempted: number; correct: number }>();

  for (const row of rows) {
    const subjectKey = row.subject_id ?? 'unknown';
    const topicKey = row.topic_id ?? 'unknown';
    const subjectEntry = subjectMap.get(subjectKey) ?? { attempted: 0, correct: 0 };
    subjectEntry.attempted += 1;
    if (row.is_correct) subjectEntry.correct += 1;
    subjectMap.set(subjectKey, subjectEntry);

    const topicEntry = topicMap.get(topicKey) ?? { attempted: 0, correct: 0 };
    topicEntry.attempted += 1;
    if (row.is_correct) topicEntry.correct += 1;
    topicMap.set(topicKey, topicEntry);
  }

  return {
    attempted,
    correct,
    wrong,
    accuracy,
    bySubject: Array.from(subjectMap.entries()).map(([subject_id, stats]) => ({
      subject_id: subject_id === 'unknown' ? null : subject_id,
      attempted: stats.attempted,
      correct: stats.correct,
      accuracy: stats.attempted > 0 ? Math.round((stats.correct * 1000) / stats.attempted) / 10 : 0,
    })),
    byTopic: Array.from(topicMap.entries()).map(([topic_id, stats]) => ({
      topic_id: topic_id === 'unknown' ? null : topic_id,
      attempted: stats.attempted,
      correct: stats.correct,
      accuracy: stats.attempted > 0 ? Math.round((stats.correct * 1000) / stats.attempted) / 10 : 0,
    })),
  };
}

async function getPracticeProgressRowsSigned(
  userId: string,
  filters: { subjectId: string | null; topicId: string | null; subtopicId: string | null },
): Promise<Array<{ subject_id: string | null; topic_id: string | null; is_correct: boolean }> | null> {
  const { proof, expiresAt } = createPracticeProof('progress', [userId]);

  const { data, error: rpcError } = await supabase.rpc('get_practice_progress_rows_verified', {
    p_user_id: userId,
    p_subject_id: filters.subjectId,
    p_topic_id: filters.topicId,
    p_subtopic_id: filters.subtopicId,
    p_expires_at: expiresAt,
    p_proof: proof,
  });

  if (rpcError || !Array.isArray(data)) {
    console.error('[practice/progressSigned] RPC failed:', rpcError);
  } else {
    return data as Array<{ subject_id: string | null; topic_id: string | null; is_correct: boolean }>;
  }

  // Fallback: full dashboard RPC then filter (requires fix_practice_save.sql grant)
  const dashboard = await getUserProgressDashboardAnon(userId);
  if (!dashboard) return null;

  return progressRowsFromDashboard(dashboard, filters);
}

function progressRowsFromDashboard(
  dashboard: UserProgressDashboard,
  filters: { subjectId: string | null; topicId: string | null; subtopicId: string | null },
): Array<{ subject_id: string | null; topic_id: string | null; is_correct: boolean }> {
  if (filters.subtopicId) {
    const row = dashboard.by_subtopic.find((item) => item.subtopic_id === filters.subtopicId);
    if (!row) return [];
    return synthesizeProgressRows(row.attempts_count, row.correct_count, {
      subject_id: row.subject_id,
      topic_id: row.topic_id,
    });
  }

  if (filters.topicId) {
    const row = dashboard.by_topic.find((item) => item.topic_id === filters.topicId);
    if (!row) return [];
    return synthesizeProgressRows(row.attempts_count, row.correct_count, {
      subject_id: row.subject_id,
      topic_id: row.topic_id,
    });
  }

  if (filters.subjectId) {
    const row = dashboard.by_subject.find((item) => item.subject_id === filters.subjectId);
    if (!row) return [];
    return synthesizeProgressRows(row.attempts_count, row.correct_count, {
      subject_id: row.subject_id,
      topic_id: null,
    });
  }

  const { overview } = dashboard;
  return synthesizeProgressRows(overview.total_attempts, overview.correct_count, {
    subject_id: null,
    topic_id: null,
  });
}

/** Approximate row list from aggregate counts (for progress cards). */
function synthesizeProgressRows(
  attempts: number,
  correct: number,
  ids: { subject_id: string | null; topic_id: string | null },
): Array<{ subject_id: string | null; topic_id: string | null; is_correct: boolean }> {
  const rows: Array<{ subject_id: string | null; topic_id: string | null; is_correct: boolean }> = [];
  for (let i = 0; i < correct; i += 1) {
    rows.push({ ...ids, is_correct: true });
  }
  for (let i = 0; i < attempts - correct; i += 1) {
    rows.push({ ...ids, is_correct: false });
  }
  return rows;
}

async function getUserProgressDashboardAnon(userId: string): Promise<UserProgressDashboard | null> {
  const { data, error } = await supabase.rpc('get_user_progress_dashboard', {
    p_user_id: userId,
  });

  if (error || !data) {
    if (error) console.error('[practice/dashboardAnon] RPC failed:', error);
    return null;
  }

  return normalizeProgressDashboard(data as Record<string, unknown>);
}

export async function getPracticeProgressForUser(
  userId: string,
  filters: { subjectId?: string | null; topicId?: string | null; subtopicId?: string | null },
): Promise<PracticeProgress | null> {
  const normalized = {
    subjectId: filters.subjectId ?? null,
    topicId: filters.topicId ?? null,
    subtopicId: filters.subtopicId ?? null,
  };

  const admin = getSupabaseAdmin();
  if (admin) {
    const scoped = await fetchScopedProgressFromViews(admin, userId, normalized);
    if (scoped) {
      return scoped.progress;
    }

    if (!normalized.subjectId && !normalized.topicId && !normalized.subtopicId) {
      const dashboard = await getUserProgressDashboard(admin, userId);
      if (!dashboard) return null;
      const { overview } = dashboard;
      return {
        attempted: overview.total_attempts,
        correct: overview.correct_count,
        wrong: overview.wrong_count,
        accuracy: overview.accuracy_percent,
        bySubject: [],
        byTopic: [],
      };
    }

    return scopedProgressToPracticeProgress({ attempted: 0, correct: 0, wrong: 0, accuracy: 0 });
  }

  const rows = await getPracticeProgressRowsSigned(userId, normalized);
  if (!rows) return null;
  return buildPracticeProgress(rows);
}

function computeCorrectPercentage(attemptCount: number, correctCount: number): number | null {
  if (attemptCount <= 0) return null;
  return Math.round((correctCount * 10000) / attemptCount) / 100;
}

function normalizeSubmitResponse(raw: Record<string, unknown>): SubmitAnswerResponse {
  const attemptCount = Number(raw.attempt_count ?? 0);
  const correctCount = Number(raw.correct_count ?? 0);
  const isNewAttempt =
    raw.is_new_attempt === true ||
    raw.is_new_attempt === 'true' ||
    raw.already_attempted === false;

  const progressRaw = raw.progress;
  const progressSnapshot = progressRaw ? parseScopedProgress(progressRaw) : null;
  const parsedProgress = progressSnapshot
    ? scopedProgressToPracticeProgress(progressSnapshot)
    : null;

  return {
    is_correct: Boolean(raw.is_correct),
    correct_option: String(raw.correct_option ?? raw.correct_answer ?? ''),
    explanation: (raw.explanation ?? {}) as SubmitAnswerResponse['explanation'],
    attempt_count: attemptCount,
    correct_count: correctCount,
    correct_percentage:
      raw.correct_percentage != null
        ? Number(raw.correct_percentage)
        : computeCorrectPercentage(attemptCount, correctCount),
    is_new_attempt: isNewAttempt,
    already_attempted: !isNewAttempt,
    selected_option: String(raw.selected_option ?? ''),
    is_mastered: raw.is_mastered === true || raw.is_mastered === 'true',
    progress: parsedProgress,
    subtopic_progress: parseScopedProgress(raw.subtopic_progress),
    topic_progress: parseScopedProgress(raw.topic_progress),
    subject_progress: parseScopedProgress(raw.subject_progress),
  };
}

function normalizeReportResponse(raw: Record<string, unknown>): ReportQuestionResponse {
  const isNewReport =
    raw.is_new_report === true ||
    raw.is_new_report === 'true' ||
    raw.already_reported === false;

  return {
    success: raw.success !== false,
    is_new_report: isNewReport,
    already_reported: !isNewReport,
    report_count: Number(raw.report_count ?? 0),
    message: typeof raw.message === 'string' ? raw.message : undefined,
  };
}

type QuestionAnswerRow = {
  id: string;
  correct_option: string;
  explanation: unknown;
  attempt_count: number | null;
  correct_count: number | null;
  subject_id: string | null;
  topic_id: string | null;
  subtopic_id: string | null;
};

export type CheckAnswerLookupResult =
  | { ok: true; data: SubmitAnswerResponse }
  | {
      ok: false;
      reason: 'invalid_option' | 'supabase_error' | 'zero_rows';
      questionId: string;
      error?: PracticeSupabaseErrorDetails | null;
    };

/**
 * Server-side answer check against public.questions (anon/readable RLS path).
 * Does not update counters. Never cached — every call hits Supabase.
 */
export async function checkAnswerOnServer(
  questionId: string,
  selectedOption: string,
): Promise<SubmitAnswerResponse | null> {
  const result = await lookupQuestionAnswerOnServer(questionId, selectedOption);
  return result.ok ? result.data : null;
}

/** Same as checkAnswerOnServer but returns why lookup failed (dev stale-ID diagnostics). */
export async function lookupQuestionAnswerOnServer(
  questionId: string,
  selectedOption: string,
): Promise<CheckAnswerLookupResult> {
  const option = selectedOption.trim().toUpperCase();
  if (!['A', 'B', 'C', 'D'].includes(option)) {
    return { ok: false, reason: 'invalid_option', questionId };
  }

  // Answer-key columns must never be read with the public anon key once column
  // grants are applied. Prefer service-role; fall back to RPC-only paths via submitSigned.
  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      ok: false,
      reason: 'supabase_error',
      questionId,
      error: {
        code: 'SERVICE_ROLE_REQUIRED',
        message:
          'SUPABASE_SERVICE_ROLE_KEY is required to reveal answers after submission when public SELECT on correct_option/explanation is revoked.',
        details: undefined,
        hint: 'Set SUPABASE_SERVICE_ROLE_KEY on the server.',
      },
    };
  }

  const { data, error } = await admin
    .from('questions')
    .select('id, correct_option, explanation, attempt_count, correct_count, is_active, is_verified')
    .eq('id', questionId)
    .eq('is_active', true)
    .eq('is_verified', true)
    .maybeSingle();

  if (process.env.NODE_ENV !== 'production') {
    console.info('[practice/checkAnswerOnServer]', {
      submittedQuestionId: questionId,
      displayedQuestionId: questionId,
      zeroRows: !error && !data,
      code: error?.code ?? null,
      message: error?.message ?? null,
      details: error?.details ?? null,
      supabaseHost: getSupabaseHostname(),
      cacheSource: 'none (uncached live lookup)',
    });
  }

  if (error) {
    logPracticeSupabaseError('[practice/checkAnswerOnServer]', asPracticeSupabaseError(error));
    return {
      ok: false,
      reason: 'supabase_error',
      questionId,
      error: asPracticeSupabaseError(error),
    };
  }

  if (!data) {
    return { ok: false, reason: 'zero_rows', questionId };
  }

  const row = data as Omit<QuestionAnswerRow, 'subject_id' | 'topic_id' | 'subtopic_id'> & {
    is_active?: boolean;
    is_verified?: boolean;
  };
  const isCorrect = String(row.correct_option ?? '').trim().toUpperCase() === option;
  const attemptCount = Number(row.attempt_count ?? 0);
  const correctCount = Number(row.correct_count ?? 0);

  return {
    ok: true,
    data: {
      is_correct: isCorrect,
      correct_option: String(row.correct_option ?? ''),
      explanation: (row.explanation ?? {}) as SubmitAnswerResponse['explanation'],
      attempt_count: attemptCount,
      correct_count: correctCount,
      correct_percentage: computeCorrectPercentage(attemptCount, correctCount),
      is_new_attempt: false,
      already_attempted: false,
      selected_option: option,
    },
  };
}

async function submitQuestionAnswerDirect(
  admin: SupabaseClient,
  userId: string,
  questionId: string,
  selectedOption: string,
  timeTakenSeconds: number | null,
): Promise<SubmitAnswerResponse | null> {
  const option = selectedOption.trim().toUpperCase();

  const { data: question, error: questionError } = await admin
    .from('questions')
    .select(
      'id, correct_option, explanation, attempt_count, correct_count, subject_id, topic_id, subtopic_id',
    )
    .eq('id', questionId)
    .eq('is_active', true)
    .eq('is_verified', true)
    .maybeSingle();

  if (questionError || !question) {
    logPracticeSupabaseError('[practice/submitDirect] question lookup failed', asPracticeSupabaseError(questionError));
    return null;
  }

  const row = question as QuestionAnswerRow;
  const correctOption = String(row.correct_option ?? '').trim().toUpperCase();
  const isCorrect = correctOption === option;

  // Raw attempt history — every submit is logged for analytics.
  const historySaved = await recordQuestionAttempt(admin, userId, {
    questionId,
    subjectId: row.subject_id,
    topicId: row.topic_id,
    subtopicId: row.subtopic_id,
    selectedOption: option,
    correctOption,
    isCorrect,
    timeSpentSeconds: timeTakenSeconds,
  });
  if (!historySaved) {
    console.warn('[practice/submitDirect] history insert failed; continuing with answer reveal');
  }

  const { data: inserted, error: insertError } = await admin
    .from('user_attempts')
    .insert({
      user_id: userId,
      question_id: questionId,
      selected_option: option,
      is_correct: isCorrect,
      time_taken_seconds: timeTakenSeconds,
      subject_id: row.subject_id,
      topic_id: row.topic_id,
      subtopic_id: row.subtopic_id,
    })
    .select('id')
    .maybeSingle();

  if (insertError && insertError.code !== '23505') {
    logPracticeSupabaseError('[practice/submitDirect] insert failed', asPracticeSupabaseError(insertError));
    return null;
  }

  const isNewAttempt = Boolean(inserted?.id);
  let attemptCount = Number(row.attempt_count ?? 0);
  let correctCount = Number(row.correct_count ?? 0);
  let returnedOption = option;
  let finalIsCorrect = isCorrect;

  const { data: masteredRows } = await admin
    .from('user_question_attempts')
    .select('id')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .eq('is_correct', true)
    .limit(1);

  const isMastered = Boolean(masteredRows && masteredRows.length > 0);

  if (isNewAttempt) {
    const { data: updated, error: updateError } = await admin
      .from('questions')
      .update({
        attempt_count: attemptCount + 1,
        correct_count: correctCount + (isCorrect ? 1 : 0),
      })
      .eq('id', questionId)
      .select('attempt_count, correct_count')
      .maybeSingle();

    if (updateError || !updated) {
      console.error('[practice/submitDirect] counter update failed:', updateError);
      await admin
        .from('user_attempts')
        .delete()
        .eq('user_id', userId)
        .eq('question_id', questionId);
      return null;
    }

    attemptCount = Number(updated.attempt_count ?? 0);
    correctCount = Number(updated.correct_count ?? 0);
  } else {
    const { data: existing, error: existingError } = await admin
      .from('user_attempts')
      .select('selected_option, is_correct')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .maybeSingle();

    if (existingError || !existing) {
      console.error('[practice/submitDirect] existing attempt lookup failed:', existingError);
      return null;
    }

    returnedOption = String(existing.selected_option);
    finalIsCorrect = isCorrect;

    const { data: refreshed, error: refreshError } = await admin
      .from('questions')
      .select('attempt_count, correct_count')
      .eq('id', questionId)
      .maybeSingle();

    if (refreshError || !refreshed) {
      console.error('[practice/submitDirect] counter refresh failed:', refreshError);
      return null;
    }

    attemptCount = Number(refreshed.attempt_count ?? 0);
    correctCount = Number(refreshed.correct_count ?? 0);
  }

  const progressBundle = await fetchScopedProgressFromViews(admin, userId, {
    subjectId: row.subject_id,
    topicId: row.topic_id,
    subtopicId: row.subtopic_id,
  });

  return {
    is_correct: finalIsCorrect,
    correct_option: String(row.correct_option ?? ''),
    explanation: (row.explanation ?? {}) as SubmitAnswerResponse['explanation'],
    attempt_count: attemptCount,
    correct_count: correctCount,
    correct_percentage: computeCorrectPercentage(attemptCount, correctCount),
    is_new_attempt: isNewAttempt,
    already_attempted: !isNewAttempt,
    selected_option: returnedOption,
    is_mastered: isMastered,
    progress: progressBundle?.progress ?? null,
    subtopic_progress: progressBundle?.subtopic_progress ?? null,
    topic_progress: progressBundle?.topic_progress ?? null,
    subject_progress: progressBundle?.subject_progress ?? null,
  };
}

export async function submitQuestionAnswer(
  admin: SupabaseClient,
  userId: string,
  questionId: string,
  selectedOption: string,
  timeTakenSeconds: number | null,
): Promise<SubmitAnswerResponse | null> {
  const { data, error: rpcError } = await admin.rpc('submit_question_answer', {
    p_user_id: userId,
    p_question_id: questionId,
    p_selected_option: selectedOption,
    p_time_taken_seconds: timeTakenSeconds,
  });

  if (!rpcError && data) {
    return normalizeSubmitResponse(data as Record<string, unknown>);
  }

  if (rpcError) {
    logPracticeSupabaseError('[practice/submit] RPC failed', asPracticeSupabaseError(rpcError));

    if (isMissingRpcError(rpcError)) {
      console.warn('[practice/submit] RPC missing, using direct fallback');
      return submitQuestionAnswerDirect(
        admin,
        userId,
        questionId,
        selectedOption,
        timeTakenSeconds,
      );
    }

    // Column / schema errors (e.g. 42703): still try the ID-only direct path which uses subject_id/topic_id.
    if (rpcError.code === '42703') {
      console.warn('[practice/submit] RPC column error — retrying via direct subject_id/topic_id path');
      return submitQuestionAnswerDirect(
        admin,
        userId,
        questionId,
        selectedOption,
        timeTakenSeconds,
      );
    }
  }

  return submitQuestionAnswerDirect(admin, userId, questionId, selectedOption, timeTakenSeconds);
}

/** Signed RPC path — works with SUPABASE_ANON_KEY (no service role). */
async function submitQuestionAnswerSigned(
  userId: string,
  questionId: string,
  selectedOption: string,
  timeTakenSeconds: number | null,
): Promise<SubmitAnswerResponse | null> {
  const option = selectedOption.trim().toUpperCase();
  const { proof, expiresAt } = createPracticeProof('submit', [userId, questionId, option]);

  const { data, error: rpcError } = await supabase.rpc('submit_question_answer_verified', {
    p_user_id: userId,
    p_question_id: questionId,
    p_selected_option: option,
    p_time_taken_seconds: timeTakenSeconds,
    p_expires_at: expiresAt,
    p_proof: proof,
  });

  if (!rpcError && data) {
    return normalizeSubmitResponse(data as Record<string, unknown>);
  }

  if (rpcError) {
    logPracticeSupabaseError('[practice/submitSigned] RPC failed', asPracticeSupabaseError(rpcError));
  }

  // Fallback: direct RPC (requires grant — run scripts/fix_practice_save.sql)
  const { data: directData, error: directError } = await supabase.rpc('submit_question_answer', {
    p_user_id: userId,
    p_question_id: questionId,
    p_selected_option: option,
    p_time_taken_seconds: timeTakenSeconds,
  });

  if (!directError && directData) {
    return normalizeSubmitResponse(directData as Record<string, unknown>);
  }

  if (directError) {
    logPracticeSupabaseError('[practice/submit] direct RPC failed', asPracticeSupabaseError(directError));

    const missingDirect =
      isMissingRpcError(directError) ||
      directError.message?.includes('permission denied') === true;

    if (missingDirect) {
      console.error(
        '[practice/submit] Cannot save attempt — run scripts/fix_practice_save.sql in Supabase, or add SUPABASE_SERVICE_ROLE_KEY to .env.local',
      );
    }
  }

  // Last resort: reveal answer only (no DB save)
  return checkAnswerOnServer(questionId, option);
}

/**
 * Save attempt for logged-in user.
 * Uses service role when available, otherwise HMAC-signed RPC via anon key.
 */
export async function submitQuestionAnswerForUser(
  userId: string,
  questionId: string,
  selectedOption: string,
  timeTakenSeconds: number | null,
): Promise<SubmitAnswerResponse | null> {
  const admin = getSupabaseAdmin();
  if (admin) {
    return submitQuestionAnswer(admin, userId, questionId, selectedOption, timeTakenSeconds);
  }

  return submitQuestionAnswerSigned(userId, questionId, selectedOption, timeTakenSeconds);
}

/** Inserts one row into user_question_attempts (full attempt history). */
export async function recordQuestionAttempt(
  admin: SupabaseClient,
  userId: string,
  input: RecordQuestionAttemptInput,
): Promise<boolean> {
  const option = input.selectedOption.trim().toUpperCase();
  const correctOption = input.correctOption.trim().toUpperCase();
  if (!['A', 'B', 'C', 'D'].includes(option) || !['A', 'B', 'C', 'D'].includes(correctOption)) {
    return false;
  }

  const timeSpentSeconds =
    typeof input.timeSpentSeconds === 'number' && input.timeSpentSeconds >= 0
      ? Math.round(input.timeSpentSeconds)
      : null;

  const { error } = await admin.from('user_question_attempts').insert({
    user_id: userId,
    question_id: input.questionId,
    subject_id: input.subjectId ?? null,
    topic_id: input.topicId ?? null,
    subtopic_id: input.subtopicId ?? null,
    selected_option: option,
    correct_option: correctOption,
    is_correct: input.isCorrect,
    time_spent_seconds: timeSpentSeconds,
  });

  if (error) {
    console.error('[practice/recordQuestionAttempt]', error);
    return false;
  }

  return true;
}

async function fetchProgressDashboardDirect(
  admin: SupabaseClient,
  userId: string,
): Promise<UserProgressDashboard | null> {
  const { data: overviewRow, error: overviewError } = await admin
    .from('user_question_attempts')
    .select('question_id, is_correct')
    .eq('user_id', userId);

  if (overviewError) {
    console.error('[practice/dashboardDirect] overview failed:', overviewError);
    return null;
  }

  const rows = overviewRow ?? [];
  const totalAttempts = rows.length;
  const uniqueQuestions = new Set(rows.map((r) => String(r.question_id))).size;
  const correctCount = rows.filter((r) => r.is_correct).length;
  const wrongCount = totalAttempts - correctCount;
  const accuracyPercent =
    totalAttempts > 0 ? Math.round((correctCount * 10000) / totalAttempts) / 100 : 0;

  return normalizeProgressDashboard({
    overview: {
      total_attempts: totalAttempts,
      unique_questions_attempted: uniqueQuestions,
      correct_count: correctCount,
      wrong_count: wrongCount,
      accuracy_percent: accuracyPercent,
    },
    by_subject: [],
    by_topic: [],
    by_subtopic: [],
    recent_attempts: [],
  });
}

export async function getUserProgressDashboard(
  admin: SupabaseClient,
  userId: string,
): Promise<UserProgressDashboard | null> {
  const { data, error: rpcError } = await admin.rpc('get_user_progress_dashboard', {
    p_user_id: userId,
  });

  if (!rpcError && data) {
    return normalizeProgressDashboard(data as Record<string, unknown>);
  }

  if (rpcError) {
    logPracticeSupabaseError('[practice/dashboard] RPC failed', asPracticeSupabaseError(rpcError));

    if (isMissingRpcError(rpcError) || rpcError.message?.includes('user_question_attempts') === true) {
      console.warn('[practice/dashboard] RPC missing, using limited fallback');
      return fetchProgressDashboardDirect(admin, userId);
    }
  }

  return fetchProgressDashboardDirect(admin, userId);
}

async function getUserProgressDashboardSigned(userId: string): Promise<UserProgressDashboard | null> {
  const { proof, expiresAt } = createPracticeProof('dashboard', [userId]);

  const { data, error: rpcError } = await supabase.rpc('get_user_progress_dashboard_verified', {
    p_user_id: userId,
    p_expires_at: expiresAt,
    p_proof: proof,
  });

  if (!rpcError && data) {
    return normalizeProgressDashboard(data as Record<string, unknown>);
  }

  if (rpcError) {
    console.error('[practice/dashboardSigned] RPC failed:', rpcError);
  }

  return getUserProgressDashboardAnon(userId);
}

/** Dashboard stats for logged-in user (service role or signed RPC). */
export async function getUserProgressDashboardForUser(userId: string): Promise<UserProgressDashboard | null> {
  const admin = getSupabaseAdmin();
  if (admin) {
    return getUserProgressDashboard(admin, userId);
  }
  return getUserProgressDashboardSigned(userId);
}

async function reportQuestionDirect(
  admin: SupabaseClient,
  userId: string,
  questionId: string,
  reason: string,
  details: string | null,
): Promise<ReportQuestionResponse | null> {
  const { data: question, error: questionError } = await admin
    .from('questions')
    .select('id, report_count')
    .eq('id', questionId)
    .eq('is_active', true)
    .eq('is_verified', true)
    .maybeSingle();

  if (questionError || !question) {
    console.error('[practice/reportDirect] question lookup failed:', questionError);
    return null;
  }

  const trimmedDetails = details?.trim() ? details.trim() : null;

  const { data: inserted, error: insertError } = await admin
    .from('question_reports')
    .insert({
      user_id: userId,
      question_id: questionId,
      reason,
      details: trimmedDetails,
    })
    .select('id')
    .maybeSingle();

  if (insertError && insertError.code !== '23505') {
    console.error('[practice/reportDirect] insert failed:', insertError);
    return null;
  }

  const isNewReport = Boolean(inserted?.id);
  let reportCount = Number((question as { report_count: number | null }).report_count ?? 0);

  if (isNewReport) {
    const { data: updated, error: updateError } = await admin
      .from('questions')
      .update({ report_count: reportCount + 1 })
      .eq('id', questionId)
      .select('report_count')
      .maybeSingle();

    if (updateError || !updated) {
      console.error('[practice/reportDirect] counter update failed:', updateError);
      await admin
        .from('question_reports')
        .delete()
        .eq('user_id', userId)
        .eq('question_id', questionId);
      return null;
    }

    reportCount = Number(updated.report_count ?? 0);
  }

  return {
    success: true,
    is_new_report: isNewReport,
    already_reported: !isNewReport,
    report_count: reportCount,
    message: isNewReport ? undefined : 'already_reported',
  };
}

export async function reportQuestion(
  admin: SupabaseClient,
  userId: string,
  questionId: string,
  reason: string,
  details: string | null,
): Promise<ReportQuestionResponse | null> {
  const { data, error: rpcError } = await admin.rpc('report_question', {
    p_user_id: userId,
    p_question_id: questionId,
    p_reason: reason,
    p_details: details,
  });

  if (!rpcError && data) {
    return normalizeReportResponse(data as Record<string, unknown>);
  }

  if (rpcError) {
    logPracticeSupabaseError('[practice/report] RPC failed', asPracticeSupabaseError(rpcError));

    if (isMissingRpcError(rpcError) || rpcError.code === '42703') {
      console.warn('[practice/report] RPC unavailable/column error, using direct fallback');
      return reportQuestionDirect(admin, userId, questionId, reason, details);
    }
  }

  return reportQuestionDirect(admin, userId, questionId, reason, details);
}

type AttemptJoinRow = {
  question_id: string;
  selected_option: string;
  is_correct: boolean;
  attempted_at: string;
  questions: {
    correct_option: string;
    explanation: unknown;
    attempt_count: number | null;
    correct_count: number | null;
  } | {
    correct_option: string;
    explanation: unknown;
    attempt_count: number | null;
    correct_count: number | null;
  }[] | null;
};

function mapAttemptRow(row: AttemptJoinRow): UserAttemptSummary {
  const question = Array.isArray(row.questions) ? row.questions[0] ?? null : row.questions;
  const attemptCount = Number(question?.attempt_count ?? 0);
  const correctCount = Number(question?.correct_count ?? 0);

  return {
    question_id: String(row.question_id),
    selected_option: String(row.selected_option),
    is_correct: Boolean(row.is_correct),
    attempted_at: String(row.attempted_at),
    correct_option: question?.correct_option,
    explanation: question?.explanation as UserAttemptSummary['explanation'],
    attempt_count: attemptCount,
    correct_count: correctCount,
    correct_percentage: attemptCount > 0 ? Math.round((correctCount * 10000) / attemptCount) / 100 : null,
  };
}

export type SubtopicAttemptState = {
  correctQuestionIds: string[];
  attempts: UserAttemptSummary[];
};

/** Loads per-question attempt state for a subtopic (used to hide mastered questions). */
export async function getSubtopicAttemptState(
  admin: SupabaseClient,
  userId: string,
  subtopicId: string,
  questionIds?: string[],
): Promise<SubtopicAttemptState | null> {
  let query = admin
    .from('user_attempts')
    .select(
      'question_id, selected_option, is_correct, attempted_at, questions:question_id (correct_option, explanation, attempt_count, correct_count)',
    )
    .eq('user_id', userId)
    .eq('subtopic_id', subtopicId);

  if (questionIds?.length) {
    query = query.in('question_id', questionIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[practice/getSubtopicAttemptState]', error);
    return null;
  }

  const attempts = ((data ?? []) as AttemptJoinRow[]).map(mapAttemptRow);
  const correctQuestionIds = attempts.filter((attempt) => attempt.is_correct).map((attempt) => attempt.question_id);

  return { correctQuestionIds, attempts };
}

/** Clears saved attempts and practice cycle state for a subtopic. */
export async function resetSubtopicProgress(
  admin: SupabaseClient,
  userId: string,
  subtopicId: string,
  examCode?: string | null,
): Promise<boolean> {
  const normalizedExam = examCode?.trim() ? examCode.trim().toUpperCase() : 'ALL';

  const { error: rpcError } = await admin.rpc('reset_subtopic_practice_progress', {
    p_user_id: userId,
    p_subtopic_id: subtopicId,
    p_exam_code: normalizedExam,
  });

  if (!rpcError) return true;

  logPracticeSupabaseError('[practice/resetSubtopicProgress] RPC failed', asPracticeSupabaseError(rpcError));

  if (!isMissingRpcError(rpcError)) {
    return false;
  }

  const { error: attemptsError } = await admin
    .from('user_attempts')
    .delete()
    .eq('user_id', userId)
    .eq('subtopic_id', subtopicId);

  if (attemptsError) {
    console.error('[practice/resetSubtopicProgress]', attemptsError);
    return false;
  }

  await admin
    .from('user_question_attempts')
    .delete()
    .eq('user_id', userId)
    .eq('subtopic_id', subtopicId);

  await admin
    .from('user_practice_scope_state')
    .delete()
    .eq('user_id', userId)
    .eq('scope_type', 'subtopic')
    .eq('scope_id', subtopicId);

  return true;
}

export async function getSubtopicBatchQuestionState(
  admin: SupabaseClient,
  userId: string,
  subtopicId: string,
  examCode: string | null | undefined,
  questionIds: string[],
): Promise<
  | { ok: true; state: SubtopicQuestionBatchState }
  | { ok: false; error: PracticeMasteryRpcError }
> {
  const normalizedExam = examCode?.trim() ? examCode.trim().toUpperCase() : 'ALL';

  const { data, error } = await admin.rpc('get_subtopic_batch_question_state', {
    p_user_id: userId,
    p_subtopic_id: subtopicId,
    p_exam_code: normalizedExam,
    p_question_ids: questionIds,
  });

  if (error) {
    if (isMissingRpcError(error)) {
      console.error('[practice/getSubtopicBatchQuestionState] RPC missing:', error.message);
      return { ok: false, error: 'mastery_migration_pending' };
    }
    console.error('[practice/getSubtopicBatchQuestionState]', error.message);
    return { ok: false, error: 'question_state_failed' };
  }

  const parsed = parseSubtopicQuestionBatchState(data);
  if (!parsed.ok) {
    console.error('[practice/getSubtopicBatchQuestionState] invalid RPC payload');
    return { ok: false, error: 'invalid_rpc_response' };
  }

  return { ok: true, state: parsed.state };
}

export async function advanceSubtopicPracticeCycle(
  admin: SupabaseClient,
  userId: string,
  subtopicId: string,
  examCode: string | null | undefined,
): Promise<
  | { ok: true; state: AdvanceSubtopicCycleResult }
  | { ok: false; error: PracticeMasteryRpcError }
> {
  const normalizedExam = examCode?.trim() ? examCode.trim().toUpperCase() : 'ALL';

  const { data, error } = await admin.rpc('advance_subtopic_practice_cycle', {
    p_user_id: userId,
    p_subtopic_id: subtopicId,
    p_exam_code: normalizedExam,
  });

  if (error) {
    if (isMissingRpcError(error)) {
      console.error('[practice/advanceSubtopicPracticeCycle] RPC missing:', error.message);
      return { ok: false, error: 'mastery_migration_pending' };
    }
    console.error('[practice/advanceSubtopicPracticeCycle]', error.message);
    return { ok: false, error: 'advance_cycle_failed' };
  }

  const parsed = parseAdvanceSubtopicCycleResult(data);
  if (!parsed.ok) {
    console.error('[practice/advanceSubtopicPracticeCycle] invalid RPC payload');
    return { ok: false, error: 'invalid_rpc_response' };
  }

  return { ok: true, state: parsed.state };
}

/** @deprecated First-attempt mastery — use getSubtopicBatchQuestionState for subtopic mastery loop. */
export async function getCorrectQuestionIdsForBatch(
  admin: SupabaseClient,
  userId: string,
  questionIds: string[],
): Promise<string[] | null> {
  if (questionIds.length === 0) return [];

  const { data, error } = await admin
    .from('user_attempts')
    .select('question_id')
    .eq('user_id', userId)
    .eq('is_correct', true)
    .in('question_id', questionIds);

  if (error) {
    console.error('[practice/getCorrectQuestionIdsForBatch]', error.message);
    return null;
  }

  const correctQuestionIds = new Set<string>();
  for (const row of data ?? []) {
    correctQuestionIds.add(String((row as { question_id: string }).question_id));
  }

  return [...correctQuestionIds];
}
