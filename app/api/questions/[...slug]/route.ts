import { NextResponse } from 'next/server';
import {
  buildQuestionLookupContext,
  extractQuestionIdFromQuestionSlug,
  fetchQuestionById,
  inferSubjectKeyFromTopicSlug,
} from '@/lib/questionLookup';
import { generateQuestionSlug, slugifySubject } from '@/lib/slugGenerator';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type LocalizedText = string | { en?: string; hi?: string };
type QuestionItem = Record<string, any>;

function getText(value: LocalizedText | undefined, locale: 'en' | 'hi' = 'en'): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] || value.en || value.hi || '';
}

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

export async function GET(request: Request, context: { params: Promise<{ slug: string[] }> }) {
  const params = await context.params;
  const pathSegments = getQuestionPath(params);
  if (pathSegments.length < 1 || pathSegments.length > 2) {
    return NextResponse.json({ error: 'Invalid question path.' }, { status: 400 });
  }

  if (pathSegments.length === 1) {
    const questionId = pathSegments[0];
    const subjectParam = new URL(request.url).searchParams.get('subject')?.trim();
    const question = await fetchQuestionById(
      questionId,
      buildQuestionLookupContext({
        subjectKey: subjectParam || undefined,
      })
    );
    if (!question) {
      return NextResponse.json({ error: 'Question not found.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json({ question }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const [topicSlug, questionSlug] = pathSegments;
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

  const canonicalTopicSlug = slugifySubject(getText(question.topic, 'en')).trim();
  const canonicalQuestionSlug = generateQuestionSlug(question.question, question.id).trim();
  if (canonicalQuestionSlug !== questionSlug) {
    return NextResponse.json({ error: 'Question not found.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  return NextResponse.json({ question }, { headers: { 'Cache-Control': 'no-store' } });
}
