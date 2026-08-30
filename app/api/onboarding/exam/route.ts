import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAuthUserFromCookies } from '@/lib/authCookies';
import {
  ExamCatalogueDatabaseError,
  getExamOnboardingDetails,
  listExamSelectorOptions,
} from '@/lib/examOnboardingServer';
import { validateTargetExamDate } from '@/lib/examOnboarding';
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

  let state: Awaited<ReturnType<typeof getExamOnboardingDetails>>;
  let options: Awaited<ReturnType<typeof listExamSelectorOptions>>;
  try {
    [state, options] = await Promise.all([
      getExamOnboardingDetails(session.id),
      listExamSelectorOptions(),
    ]);
  } catch (error) {
    const code = error instanceof ExamCatalogueDatabaseError
      ? error.databaseCode
      : 'database_error';
    const message = error instanceof Error ? error.message : 'database_error';
    console.warn(`[exam-onboarding/get] code=${code} message=${message}`);
    return NextResponse.json(
      { error: 'catalogue_unavailable' },
      { status: 503, headers: PRIVATE_NO_STORE },
    );
  }

  // Preference is deliberately downstream from the catalogue. A stale
  // preference relation must never turn a successful exam query into “0 exams”.
  const preferenceResult = await getSavedExamPreference(session.id, state.targetExamProfileId);

  return NextResponse.json(
    {
      state,
      options,
      savedPreference: preferenceResult.status === 'ready' ? preferenceResult.preference : null,
      preferenceStatus: preferenceResult.status,
      preferenceError: preferenceResult.status === 'error' ? preferenceResult.code : null,
    },
    { headers: PRIVATE_NO_STORE },
  );
}

export async function POST(request: Request) {
  const session = await getAuthUserFromCookies();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: PRIVATE_NO_STORE });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400, headers: PRIVATE_NO_STORE });
  }

  if (
    Object.prototype.hasOwnProperty.call(body, 'userId') ||
    Object.prototype.hasOwnProperty.call(body, 'user_id')
  ) {
    return NextResponse.json({ error: 'invalid_user_scope' }, { status: 400, headers: PRIVATE_NO_STORE });
  }

  // The user id is intentionally not accepted from the request body.
  // contentExamId is also intentionally ignored; the server resolves it from
  // exam_selector_options after validating the submitted profile ID.
  const examDate = validateTargetExamDate(body.examDate);
  if (!examDate) {
    return NextResponse.json({ error: 'invalid_date' }, { status: 400, headers: PRIVATE_NO_STORE });
  }
  if (body.preparationMode !== 'MCQ' && body.preparationMode !== 'WRITTEN') {
    return NextResponse.json(
      { error: 'invalid_preparation_mode' },
      { status: 400, headers: PRIVATE_NO_STORE },
    );
  }
  const result = await saveExamPreparationPreference(session.id, {
    examProfileId: typeof body.examProfileId === 'string' ? body.examProfileId : '',
    examDate,
    tierCode: body.tierCode === 'TIER_I' || body.tierCode === 'TIER_II' ? body.tierCode : null,
    stageCode: typeof body.stageCode === 'string' ? body.stageCode : '',
    preparationMode: body.preparationMode,
    completeOnboarding: true,
  });

  if (!result.ok) {
    const status = /database|PGRST|57014|not_configured/i.test(result.code) ? 503 : 400;
    return NextResponse.json(
      { error: status === 503 ? 'preference_unavailable' : 'invalid_preference' },
      { status, headers: PRIVATE_NO_STORE },
    );
  }

  revalidateTag(SELECTED_EXAM_CONTEXT_CACHE_TAG, { expire: 0 });
  revalidateTag(EXAM_DASHBOARD_PREFERENCE_CACHE_TAG, { expire: 0 });

  return NextResponse.json(
    { success: true, preference: result.preference },
    { headers: PRIVATE_NO_STORE },
  );
}
