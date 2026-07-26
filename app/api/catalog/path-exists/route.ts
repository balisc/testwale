import { NextResponse } from 'next/server';
import {
  loadSubtopicByRouteSlugs,
  loadSubjectByRouteSlug,
  loadTopicByRouteSlugs,
} from '@/lib/catalogRouteGuards';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'private, no-store' } as const;

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

/** Read-only catalog path probe for proxy 404 enforcement. */
export async function GET(request: Request) {
  const pathname = new URL(request.url).searchParams.get('path')?.trim() ?? '';
  if (!pathname.startsWith('/subjects/')) {
    return NextResponse.json({ error: 'unsupported_path' }, { status: 400, headers: NO_STORE });
  }

  const parsed = parseCatalogPath(pathname);
  if (!parsed) {
    return NextResponse.json({ error: 'invalid_path' }, { status: 400, headers: NO_STORE });
  }

  const { routeSubject, topicSlug, subtopicSlug } = parsed;
  const subjectRow = await loadSubjectByRouteSlug(routeSubject);
  if (!subjectRow) {
    return NextResponse.json({ exists: false }, { status: 404, headers: NO_STORE });
  }

  if (!topicSlug) {
    return new NextResponse(null, { status: 204, headers: NO_STORE });
  }

  if (!subtopicSlug) {
    const topicRow = await loadTopicByRouteSlugs(routeSubject, topicSlug);
    return topicRow
      ? new NextResponse(null, { status: 204, headers: NO_STORE })
      : NextResponse.json({ exists: false }, { status: 404, headers: NO_STORE });
  }

  const subtopicRow = await loadSubtopicByRouteSlugs(routeSubject, topicSlug, subtopicSlug);
  return subtopicRow
    ? new NextResponse(null, { status: 204, headers: NO_STORE })
    : NextResponse.json({ exists: false }, { status: 404, headers: NO_STORE });
}
