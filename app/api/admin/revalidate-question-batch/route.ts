import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { revalidateQuestionBatchCache } from '@/lib/revalidateQuestionBatchCache';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

function getRevalidateSecret(): string | null {
  return process.env.QUESTION_CACHE_REVALIDATE_SECRET?.trim() ?? null;
}

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function isAuthorized(request: Request): boolean {
  const secret = getRevalidateSecret();
  if (!secret) return false;

  const bearer = request.headers.get('authorization');
  if (bearer?.startsWith('Bearer ')) {
    return secretsMatch(bearer.slice(7).trim(), secret);
  }

  const headerSecret = request.headers.get('x-question-cache-revalidate-secret');
  if (headerSecret) {
    return secretsMatch(headerSecret.trim(), secret);
  }

  return false;
}

type RevalidateBody = {
  subtopicId?: string;
  topicId?: string;
};

/**
 * Manual cache invalidation for public question batches.
 * Required after Supabase Dashboard edits — the app has no in-app question admin mutations.
 */
export async function POST(request: Request) {
  if (!getRevalidateSecret()) {
    return NextResponse.json(
      { error: 'revalidation_not_configured' },
      { status: 503, headers: NO_STORE },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: NO_STORE });
  }

  let body: RevalidateBody = {};
  try {
    body = (await request.json()) as RevalidateBody;
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400, headers: NO_STORE });
  }

  const { revalidatedTags } = revalidateQuestionBatchCache({
    subtopicId: body.subtopicId,
    topicId: body.topicId,
  });

  return NextResponse.json(
    {
      ok: true,
      revalidatedTags,
      fallbackBroadTag: revalidatedTags.length === 1 && revalidatedTags[0] === 'question-batch',
    },
    { headers: NO_STORE },
  );
}
