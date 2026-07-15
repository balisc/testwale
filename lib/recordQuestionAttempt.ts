import type { RecordQuestionAttemptInput } from '@/lib/practiceAnalytics';

export type { RecordQuestionAttemptInput };

/**
 * Client helper to persist a question attempt via the practice submit API.
 * Prefer `/api/practice/submit` from QuestionPractice — this wraps the same endpoint
 * for other MCQ flows that already know correct/isCorrect locally.
 *
 * Does not throw on failure; returns null so answer reveal is never blocked.
 */
export async function recordQuestionAttempt(
  input: RecordQuestionAttemptInput,
): Promise<{ saved: boolean }> {
  try {
    const response = await fetch('/api/practice/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: input.questionId,
        selectedOption: input.selectedOption,
        timeTakenSeconds: input.timeSpentSeconds ?? null,
      }),
    });

    if (!response.ok) {
      console.warn('[recordQuestionAttempt] save failed', response.status);
      return { saved: false };
    }

    return { saved: true };
  } catch (error) {
    console.warn('[recordQuestionAttempt] save error', error);
    return { saved: false };
  }
}
