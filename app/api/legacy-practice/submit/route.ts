import { NextResponse } from 'next/server';
import questionsData from '@/data/questions.json';
import {
  getLegacyExplanation,
  resolveLegacyCorrectIndex,
  type LegacyQuizLanguage,
} from '@/lib/legacyQuiz';
import { getSubjectConfig } from '@/lib/subjects';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const QUESTION_ID_PATTERN = /^[\p{L}\p{N}_-]{1,80}$/u;

type AnswerRow = {
  id: string | number;
  options: unknown;
  correct_answer: unknown;
  explanation: unknown;
};

function normalizeSubject(value: unknown) {
  return String(value ?? '').trim().toLocaleLowerCase().replace(/[\s_]+/g, '-');
}

function findLocalAnswer(subject: string, questionId: string): AnswerRow | null {
  const row = (questionsData as Array<Record<string, unknown>>).find(
    (candidate) =>
      String(candidate.id ?? '') === questionId &&
      normalizeSubject(candidate.subject) === subject,
  );
  if (!row) return null;
  return {
    id: String(row.id ?? ''),
    options: row.options ?? { en: row.options_en ?? [], hi: row.options_hi ?? [] },
    correct_answer: row.correct_answer ?? row.answer,
    explanation: row.explanation ?? row.explanation_text,
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const subject = normalizeSubject(input?.subject);
  const questionId = typeof input?.questionId === 'string' ? input.questionId.trim() : '';
  const selectedOptionIndex = input?.selectedOptionIndex;
  const language: LegacyQuizLanguage = input?.language === 'hi' ? 'hi' : 'en';
  const config = getSubjectConfig(subject);

  if (
    !config ||
    !QUESTION_ID_PATTERN.test(questionId) ||
    !Number.isInteger(selectedOptionIndex) ||
    (selectedOptionIndex as number) < 0 ||
    (selectedOptionIndex as number) > 9
  ) {
    return NextResponse.json({ error: 'invalid_answer' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  let row: AnswerRow | null = null;
  if (admin) {
    const { data, error } = await admin
      .from(config.table)
      .select('id,options,correct_answer,explanation')
      .eq('id', questionId)
      .maybeSingle();
    if (error) {
      console.error('Legacy answer lookup failed:', error.message);
      return NextResponse.json({ error: 'answer_unavailable' }, { status: 500 });
    }
    row = data as AnswerRow | null;
  } else if (process.env.NODE_ENV !== 'production') {
    row = findLocalAnswer(subject, questionId);
  } else {
    return NextResponse.json({ error: 'service_unavailable' }, { status: 503 });
  }

  if (!row) {
    return NextResponse.json({ error: 'question_not_found' }, { status: 404 });
  }

  const correctOptionIndex = resolveLegacyCorrectIndex(
    row.correct_answer,
    row.options,
    language,
  );
  if (correctOptionIndex < 0) {
    return NextResponse.json({ error: 'answer_unavailable' }, { status: 500 });
  }

  return NextResponse.json(
    {
      isCorrect: selectedOptionIndex === correctOptionIndex,
      correctOptionIndex,
      explanation: getLegacyExplanation(row.explanation, language),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
