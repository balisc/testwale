import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';
import {
  EXAM_DASHBOARD_PREFERENCE_CACHE_TAG,
  getSelectedExamContext,
  getSelectedExamLearningForContext,
} from '@/lib/examLearningServer';
import { getSavedExamPreference } from '@/lib/examPreferenceServer';
import { getSscCglStageTaxonomy } from '@/lib/sscCglSyllabusServer';
import { getSscCglStageByCode, isSscCglExamCode } from '@/lib/sscCglSyllabus';

export const dynamic = 'force-dynamic';
const HEADERS = { 'Cache-Control': 'private, no-store' } as const;
const getCachedDashboardPreference = unstable_cache(
  (userId: string, examProfileId: string) => getSavedExamPreference(userId, examProfileId),
  ['exam-dashboard-preference-v1'],
  { revalidate: 60, tags: [EXAM_DASHBOARD_PREFERENCE_CACHE_TAG] },
);

export async function GET() {
  const selected = await getSelectedExamContext();
  if (selected.status === 'unauthenticated') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: HEADERS });
  }
  if (selected.status === 'incomplete') {
    return NextResponse.json({ error: 'onboarding_incomplete' }, { status: 409, headers: HEADERS });
  }
  if (selected.status === 'inactive') {
    return NextResponse.json({ error: 'selected_exam_inactive' }, { status: 409, headers: HEADERS });
  }
  if (selected.status === 'error') {
    return NextResponse.json({ error: 'learning_snapshot_failed' }, { status: 503, headers: HEADERS });
  }

  // Preference validation and the selected-stage taxonomy are independent from
  // the learning snapshot. Start the whole chain now so no remote read waits for
  // the progress payload to finish first.
  const preferencePromise = isSscCglExamCode(selected.examCode)
    ? getCachedDashboardPreference(selected.userId, selected.examProfileId)
    : Promise.resolve(null);
  const taxonomyPromise = preferencePromise.then(async (preference) => {
    if (!preference || preference.status !== 'ready') return null;
    const stage = getSscCglStageByCode(preference.preference.stageCode);
    if (!stage) return { status: 'invalid' as const };
    try {
      return { status: 'ready' as const, taxonomy: await getSscCglStageTaxonomy(stage) };
    } catch (error) {
      console.warn(
        `[learning/dashboard] selected SSC CGL stage failed to load: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { status: 'error' as const };
    }
  });
  const [result, preference, taxonomyResult] = await Promise.all([
    getSelectedExamLearningForContext(selected),
    preferencePromise,
    taxonomyPromise,
  ]);
  if (result.status === 'error') {
    return NextResponse.json({ error: 'learning_snapshot_failed' }, { status: 503, headers: HEADERS });
  }

  if (!isSscCglExamCode(result.snapshot.exam.code)) {
    return NextResponse.json(result.snapshot, { headers: HEADERS });
  }

  if (!preference) {
    return NextResponse.json(
      { ...result.snapshot, sscCglSelection: { status: 'error' } },
      { headers: HEADERS },
    );
  }
  if (preference.status === 'missing' || preference.status === 'invalid') {
    return NextResponse.json(
      { ...result.snapshot, sscCglSelection: { status: 'missing' } },
      { headers: HEADERS },
    );
  }
  if (preference.status === 'error') {
    return NextResponse.json(
      { ...result.snapshot, sscCglSelection: { status: 'error' } },
      { headers: HEADERS },
    );
  }

  if (!taxonomyResult || taxonomyResult.status === 'invalid') {
    return NextResponse.json(
      { ...result.snapshot, sscCglSelection: { status: 'error' } },
      { headers: HEADERS },
    );
  }
  if (taxonomyResult.status === 'error') {
    return NextResponse.json(
      { ...result.snapshot, sscCglSelection: { status: 'error' } },
      { headers: HEADERS },
    );
  }

  return NextResponse.json(
    {
      ...result.snapshot,
      sscCglSelection: {
        status: 'ready',
        preference: preference.preference,
        taxonomy: taxonomyResult.taxonomy,
      },
    },
    { headers: HEADERS },
  );
}
