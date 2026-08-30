import { NextResponse } from 'next/server';
import {
  loadSubtopicByRouteSlugs,
  loadSubjectByRouteSlug,
  loadTopicByRouteSlugs,
} from '@/lib/catalogRouteGuards';
import {
  findPublishedSyllabusSubject,
  findPublishedSyllabusSubtopic,
  findPublishedSyllabusTopic,
} from '@/lib/examSyllabus';
import { getPublicExamPathIndexStrict } from '@/lib/publicExamExplorer';
import {
  buildQuestionLookupContext,
  extractQuestionIdFromQuestionSlug,
  fetchQuestionById,
  inferSubjectKeyFromTopicSlug,
} from '@/lib/questionLookup';

export const revalidate = 300;

const PUBLIC_CACHE = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
} as const;

const NOT_FOUND_CACHE = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
} as const;

function parseCatalogPath(pathname: string): {
  routeSubject: string;
  topicSlug?: string;
  subtopicSlug?: string;
} | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] !== 'subjects' || segments.length < 2) return null;

  const routeSubject = segments[1]!;
  if (segments.length === 2) {
    return { routeSubject };
  }

  const topicSlug = segments[2]!;
  if (segments.length === 3) {
    return { routeSubject, topicSlug };
  }

  if (segments[3] === 'practice') {
    const subtopicSlug = segments[4];
    if (!subtopicSlug) return { routeSubject, topicSlug };
    return { routeSubject, topicSlug, subtopicSlug };
  }

  const subtopicSlug = segments[3]!;
  return { routeSubject, topicSlug, subtopicSlug };
}

async function examPathExists(pathname: string, stageCode: string | null): Promise<boolean> {
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] !== 'exams' || segments.length < 2 || segments.length > 5) return false;

  const snapshot = await getPublicExamPathIndexStrict(segments[1]!, stageCode);
  if (!snapshot) return false;
  if (segments.length === 2) return true;

  const subject = findPublishedSyllabusSubject(snapshot.subjects, segments[2]!);
  if (!subject) return false;
  if (segments.length === 3) return true;

  const topic = findPublishedSyllabusTopic(snapshot.topics, subject.id, segments[3]!);
  if (!topic) return false;
  if (segments.length === 4) return true;

  return Boolean(findPublishedSyllabusSubtopic(snapshot.subtopics, topic.id, segments[4]!));
}

async function questionPathExists(pathname: string): Promise<boolean> {
  const segments = pathname.split('/').filter(Boolean);
  const questionSegments = segments.slice(1);
  if (segments[0] !== 'question' || questionSegments.length < 1 || questionSegments.length > 3) {
    return false;
  }

  const currentSlug = questionSegments[questionSegments.length - 1]!;
  const questionId = extractQuestionIdFromQuestionSlug(currentSlug);
  if (!questionId) return false;
  const topicSlug = questionSegments.length >= 2 ? questionSegments[0]! : '';
  const question = await fetchQuestionById(
    questionId,
    buildQuestionLookupContext({
      topicSlug,
      questionSlug: currentSlug,
      subjectKey: inferSubjectKeyFromTopicSlug(topicSlug),
    }),
  );
  return Boolean(question);
}

/** Read-only catalog path probe for proxy 404 enforcement. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const pathname = url.searchParams.get('path')?.trim() ?? '';
  const isSupported =
    pathname.startsWith('/subjects/') ||
    pathname.startsWith('/exams/') ||
    pathname.startsWith('/question/');
  if (!isSupported) {
    return NextResponse.json({ error: 'unsupported_path' }, { status: 400, headers: PUBLIC_CACHE });
  }

  if (pathname.startsWith('/exams/')) {
    const exists = await examPathExists(pathname, url.searchParams.get('stage'));
    return exists
      ? new NextResponse(null, { status: 204, headers: PUBLIC_CACHE })
      : NextResponse.json({ exists: false }, { status: 404, headers: NOT_FOUND_CACHE });
  }

  if (pathname.startsWith('/question/')) {
    const exists = await questionPathExists(pathname);
    return exists
      ? new NextResponse(null, { status: 204, headers: PUBLIC_CACHE })
      : NextResponse.json({ exists: false }, { status: 404, headers: NOT_FOUND_CACHE });
  }

  const parsed = parseCatalogPath(pathname);
  if (!parsed) {
    return NextResponse.json({ error: 'invalid_path' }, { status: 400, headers: PUBLIC_CACHE });
  }

  const { routeSubject, topicSlug, subtopicSlug } = parsed;
  const subjectRow = await loadSubjectByRouteSlug(routeSubject);
  if (!subjectRow) {
    return NextResponse.json({ exists: false }, { status: 404, headers: NOT_FOUND_CACHE });
  }

  if (!topicSlug) {
    return new NextResponse(null, { status: 204, headers: PUBLIC_CACHE });
  }

  if (!subtopicSlug) {
    const topicRow = await loadTopicByRouteSlugs(routeSubject, topicSlug);
    return topicRow
      ? new NextResponse(null, { status: 204, headers: PUBLIC_CACHE })
      : NextResponse.json({ exists: false }, { status: 404, headers: NOT_FOUND_CACHE });
  }

  const subtopicRow = await loadSubtopicByRouteSlugs(routeSubject, topicSlug, subtopicSlug);
  return subtopicRow
    ? new NextResponse(null, { status: 204, headers: PUBLIC_CACHE })
    : NextResponse.json({ exists: false }, { status: 404, headers: NOT_FOUND_CACHE });
}
