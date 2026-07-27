import { NextResponse } from 'next/server';
import { getAuthUserFromCookies } from '@/lib/authCookies';
import { validateGoalPatch } from '@/lib/profileGoalsCore';
import {
  buildProfilePageForSession,
  getUserProfilePage,
  mergeSessionUser,
  updateUserProfile,
} from '@/lib/profileServer';

export const dynamic = 'force-dynamic';

const PRIVATE_NO_STORE = {
  'Cache-Control': 'private, no-store',
} as const;

export async function GET() {
  const session = await getAuthUserFromCookies();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: PRIVATE_NO_STORE });
  }

  const profile = await getUserProfilePage(session.id);
  const payload = profile
    ? mergeSessionUser(profile, session)
    : await buildProfilePageForSession(session);

  return NextResponse.json(payload, { headers: PRIVATE_NO_STORE });
}

export async function PATCH(request: Request) {
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

  const goalValidation = validateGoalPatch({
    daily_goal: body.daily_goal,
    weekly_goal: body.weekly_goal,
    monthly_goal: body.monthly_goal,
  });

  const patch: Parameters<typeof updateUserProfile>[1] = {};
  if (typeof body.bio === 'string') patch.bio = body.bio.slice(0, 280);
  if (typeof body.country === 'string') patch.country = body.country.slice(0, 80);
  if (typeof body.target_exam === 'string') patch.target_exam = body.target_exam.slice(0, 120);
  if (typeof body.exam_date === 'string') {
    const examDate = body.exam_date.trim().slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(examDate)) {
      patch.exam_date = examDate;
    }
  }

  if (goalValidation.ok) {
    Object.assign(patch, goalValidation.patch);
  } else if (
    body.daily_goal !== undefined ||
    body.weekly_goal !== undefined ||
    body.monthly_goal !== undefined
  ) {
    return NextResponse.json({ error: 'invalid_goals' }, { status: 400, headers: PRIVATE_NO_STORE });
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'nothing_to_update' }, { status: 400, headers: PRIVATE_NO_STORE });
  }

  const ok = await updateUserProfile(session.id, patch);

  if (!ok) {
    return NextResponse.json({ error: 'update_failed' }, { status: 500, headers: PRIVATE_NO_STORE });
  }

  const profile = await getUserProfilePage(session.id);
  const payload = profile
    ? mergeSessionUser(profile, session)
    : await buildProfilePageForSession(session);

  return NextResponse.json(payload, { headers: PRIVATE_NO_STORE });
}
