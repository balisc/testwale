import { NextResponse } from 'next/server';
import {
  buildQuestionLookupContext,
  extractQuestionIdFromQuestionSlug,
  fetchQuestionById,
  getQuestionTextField,
  inferSubjectKeyFromTopicSlug,
} from '@/lib/questionLookup';
import { generateQuestionSlug } from '@/lib/slugGenerator';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return '';
  }
}

function getQuestionPath(params: { slug?: string | string[] }) {
  const rawSlug = params.slug;
  if (Array.isArray(rawSlug)) {
    return rawSlug.map((item) => safeDecodeURIComponent(String(item)).trim()).filter(Boolean);
  }
  if (typeof rawSlug === 'string') {
    return [safeDecodeURIComponent(rawSlug).trim()].filter(Boolean);
  }
  return [];
}

/** Public question GET — strip answer-key fields even if a fallback row still has them. */
function toPublicQuestionPayload(question: Record<string, unknown>) {
  const {
    answer: _a,
    explanation: _e,
    correct_option: _c,
    correct_answer: _ca,
    Correct_Answer: _CA,
    ...safe
  } = question;
  return safe;
}

export async function GET(request: Request, context: { params: Promise<{ slug: string[] }> }) {
  const params = await context.params;
  const pathSegments = getQuestionPath(params);
  if (pathSegments.length < 1 || pathSegments.length > 3) {
    return NextResponse.json({ error: 'Invalid question path.' }, { status: 400 });
  }

  if (pathSegments.length === 1) {
    const questionId = pathSegments[0];
    const subjectParam = new URL(request.url).searchParams.get('subject')?.trim();
    const question = await fetchQuestionById(
      questionId,
      buildQuestionLookupContext({
        subjectKey: subjectParam || undefined,
      }),
    );
    if (!question) {
      return NextResponse.json({ error: 'Question not found.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json(
      { question: toPublicQuestionPayload(question as Record<string, unknown>) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const topicSlug = pathSegments[0];
  const questionSlug = pathSegments[pathSegments.length - 1];
  const questionId = extractQuestionIdFromQuestionSlug(questionSlug);
  if (!questionId) {
    return NextResponse.json({ error: 'Invalid question path.' }, { status: 400 });
  }

  const lookupContext = buildQuestionLookupContext({
    topicSlug,
    questionSlug,
    subjectKey: inferSubjectKeyFromTopicSlug(topicSlug),
  });
  const question = await fetchQuestionById(questionId, lookupContext);
  if (!question) {
    return NextResponse.json({ error: 'Question not found.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  const canonicalQuestionSlug = generateQuestionSlug(getQuestionTextField(question) ?? '', question.id).trim();
  if (canonicalQuestionSlug !== questionSlug) {
    return NextResponse.json({ error: 'Question not found.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  return NextResponse.json(
    { question: toPublicQuestionPayload(question as Record<string, unknown>) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
