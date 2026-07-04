import type { SupabaseClient } from '@supabase/supabase-js';
import supabase from '@/lib/supabase';
import type { ReportQuestionResponse, SubmitAnswerResponse } from '@/lib/practice';
import { getAuthUserFromCookies } from '@/lib/authCookies';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function getPracticeAdmin() {
  const admin = getSupabaseAdmin();
  if (!admin) return { admin: null, error: 'service_unavailable' as const };
  return { admin, error: null };
}

export async function requirePracticeUser() {
  const user = await getAuthUserFromCookies();
  if (!user) return { user: null, admin: null, error: 'unauthorized' as const };
  const { admin, error } = await getPracticeAdmin();
  if (error) return { user, admin: null, error };
  return { user, admin, error: null };
}

export function practiceErrorResponse(error: string, status: number) {
  return Response.json({ error }, { status });
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

  return {
    is_correct: Boolean(raw.is_correct),
    correct_option: String(raw.correct_option ?? ''),
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

/** Server-side answer check using anon client (no service role required). Does not update counters. */
export async function checkAnswerOnServer(
  questionId: string,
  selectedOption: string,
): Promise<SubmitAnswerResponse | null> {
  const option = selectedOption.trim().toUpperCase();
  if (!['A', 'B', 'C', 'D'].includes(option)) return null;

  const { data, error } = await supabase
    .from('questions')
    .select('correct_option, explanation, attempt_count, correct_count')
    .eq('id', questionId)
    .eq('is_active', true)
    .eq('is_verified', true)
    .maybeSingle();

  if (error || !data) {
    console.error('[practice/checkAnswerOnServer]', error);
    return null;
  }

  const row = data as Omit<QuestionAnswerRow, 'id' | 'subject_id' | 'topic_id' | 'subtopic_id'>;
  const isCorrect = String(row.correct_option ?? '').trim().toUpperCase() === option;
  const attemptCount = Number(row.attempt_count ?? 0);
  const correctCount = Number(row.correct_count ?? 0);

  return {
    is_correct: isCorrect,
    correct_option: String(row.correct_option ?? ''),
    explanation: (row.explanation ?? {}) as SubmitAnswerResponse['explanation'],
    attempt_count: attemptCount,
    correct_count: correctCount,
    correct_percentage: computeCorrectPercentage(attemptCount, correctCount),
    is_new_attempt: false,
    already_attempted: false,
    selected_option: option,
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
    console.error('[practice/submitDirect] question lookup failed:', questionError);
    return null;
  }

  const row = question as QuestionAnswerRow;
  const isCorrect = String(row.correct_option ?? '').trim().toUpperCase() === option;

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
    console.error('[practice/submitDirect] insert failed:', insertError);
    return null;
  }

  const isNewAttempt = Boolean(inserted?.id);
  let attemptCount = Number(row.attempt_count ?? 0);
  let correctCount = Number(row.correct_count ?? 0);
  let returnedOption = option;
  let finalIsCorrect = isCorrect;

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
    finalIsCorrect = Boolean(existing.is_correct);

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
    const missingFunction =
      rpcError.code === '42883' ||
      rpcError.message?.includes('does not exist') ||
      rpcError.message?.includes('Could not find the function');

    if (missingFunction) {
      console.warn('[practice/submit] RPC missing, using direct fallback');
      return submitQuestionAnswerDirect(
        admin,
        userId,
        questionId,
        selectedOption,
        timeTakenSeconds,
      );
    }

    console.error('[practice/submit] RPC failed:', rpcError);
  }

  return submitQuestionAnswerDirect(admin, userId, questionId, selectedOption, timeTakenSeconds);
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
    const missingFunction =
      rpcError.code === '42883' ||
      rpcError.message?.includes('does not exist') ||
      rpcError.message?.includes('Could not find the function');

    if (missingFunction) {
      console.warn('[practice/report] RPC missing, using direct fallback');
      return reportQuestionDirect(admin, userId, questionId, reason, details);
    }

    console.error('[practice/report] RPC failed:', rpcError);
  }

  return reportQuestionDirect(admin, userId, questionId, reason, details);
}
