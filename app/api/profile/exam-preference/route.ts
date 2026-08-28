import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAuthUserFromCookies } from '@/lib/authCookies';
import { getExamOnboardingDetails } from '@/lib/examOnboardingServer';
import {
  getSavedExamPreference,
  saveExamPreparationPreference,
} from '@/lib/examPreferenceServer';
import {
  EXAM_DASHBOARD_PREFERENCE_CACHE_TAG,
  SELECTED_EXAM_CONTEXT_CACHE_TAG,
} from '@/lib/examLearningServer';

export const dynamic = 'force-dynamic';

const PRIVATE_NO_STORE = { 'Cache-Control': 'private, no-store' } as const;

export async function GET() {
  const session = await getAuthUserFromCookies();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: PRIVATE_NO_STORE });
  }
  const state = await getExamOnboardingDetails(session.id);
  const preference = await getSavedExamPreference(session.id, state.targetExamProfileId);
  if (preference.status === 'error') {
    return NextResponse.json(
      { error: 'preference_database_error', databaseCode: preference.code },
      { status: 503, headers: PRIVATE_NO_STORE },
    );
  }
  return NextResponse.json(
    { preference: preference.status === 'ready' ? preference.preference : null, status: preference.status },
    { headers: PRIVATE_NO_STORE },
  );
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
  if (body.preparationMode !== 'MCQ' && body.preparationMode !== 'WRITTEN') {
    return NextResponse.json(
      { error: 'invalid_preparation_mode' },
      { status: 400, headers: PRIVATE_NO_STORE },
    );
  }
  const result = await saveExamPreparationPreference(session.id, {
    examProfileId: typeof body.examProfileId === 'string' ? body.examProfileId : '',
    stageCode: typeof body.stageCode === 'string' ? body.stageCode : '',
    preparationMode: body.preparationMode,
    tierCode: body.tierCode === 'TIER_I' || body.tierCode === 'TIER_II' ? body.tierCode : null,
    completeOnboarding: false,
  });
  if (!result.ok) {
    const unavailable = result.code === 'preparation_track_unavailable' || result.code === 'invalid_preference';
    return NextResponse.json(
      { error: result.code },
      { status: unavailable ? 400 : 503, headers: PRIVATE_NO_STORE },
    );
  }
  revalidateTag(SELECTED_EXAM_CONTEXT_CACHE_TAG, { expire: 0 });
  revalidateTag(EXAM_DASHBOARD_PREFERENCE_CACHE_TAG, { expire: 0 });
  revalidatePath('/dashboard');
  revalidatePath('/profile');
  revalidatePath('/onboarding');
  revalidatePath('/ssc-cgl');
  revalidatePath('/ssc-chsl');
  return NextResponse.json({ preference: result.preference }, { headers: PRIVATE_NO_STORE });
}
