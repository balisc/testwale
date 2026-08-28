import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAuthUserFromCookies } from '@/lib/authCookies';
import {
  EXAM_DASHBOARD_PREFERENCE_CACHE_TAG,
  SELECTED_EXAM_CONTEXT_CACHE_TAG,
} from '@/lib/examLearningServer';
import { getSscChslStageByCode } from '@/lib/sscChsl';
import {
  getSscChslPreference,
  getSscChslStageAvailability,
  saveSscChslPreference,
} from '@/lib/sscChslServer';

export const dynamic = 'force-dynamic';
const PRIVATE_NO_STORE = { 'Cache-Control': 'private, no-store' } as const;

export async function GET() {
  const session = await getAuthUserFromCookies();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: PRIVATE_NO_STORE });
  }
  const [preference, availability] = await Promise.all([
    getSscChslPreference(session.id),
    getSscChslStageAvailability(),
  ]);
  if (preference.status === 'error' || availability.status === 'error') {
    return NextResponse.json({ error: 'preference_database_error' }, { status: 503, headers: PRIVATE_NO_STORE });
  }
  return NextResponse.json({
    preference: preference.status === 'ready' ? preference.preference : null,
    status: preference.status,
    stages: availability.stages,
  }, { headers: PRIVATE_NO_STORE });
}

export async function PUT(request: Request) {
  const session = await getAuthUserFromCookies();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: PRIVATE_NO_STORE });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400, headers: PRIVATE_NO_STORE });
  }
  if ('userId' in body || 'user_id' in body) {
    return NextResponse.json({ error: 'invalid_user_scope' }, { status: 400, headers: PRIVATE_NO_STORE });
  }
  const stage = typeof body.stageCode === 'string' ? getSscChslStageByCode(body.stageCode) : null;
  if (!stage) {
    return NextResponse.json({ error: 'invalid_stage' }, { status: 400, headers: PRIVATE_NO_STORE });
  }

  const availability = await getSscChslStageAvailability();
  if (availability.status === 'error') {
    return NextResponse.json({ error: availability.code }, { status: 503, headers: PRIVATE_NO_STORE });
  }
  if (!availability.stages.some((item) => item.stageCode === stage.code && item.isAvailable)) {
    return NextResponse.json({ error: 'stage_unavailable' }, { status: 400, headers: PRIVATE_NO_STORE });
  }

  const result = await saveSscChslPreference(session.id, stage.code);
  if (!result.ok) {
    const status = result.code === 'invalid_stage' || result.code === 'preparation_track_unavailable'
      ? 400
      : 503;
    return NextResponse.json({ error: result.code }, { status, headers: PRIVATE_NO_STORE });
  }

  revalidateTag(SELECTED_EXAM_CONTEXT_CACHE_TAG, { expire: 0 });
  revalidateTag(EXAM_DASHBOARD_PREFERENCE_CACHE_TAG, { expire: 0 });
  revalidatePath('/dashboard');
  revalidatePath('/profile');
  revalidatePath('/ssc-chsl');
  return NextResponse.json({ preference: result.preference }, { headers: PRIVATE_NO_STORE });
}
