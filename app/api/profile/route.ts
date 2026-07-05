import { NextResponse } from 'next/server';
import { getAuthUserFromCookies } from '@/lib/authCookies';
import { getUserProfilePage, mergeSessionUser, updateUserProfile } from '@/lib/profileServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAuthUserFromCookies();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const profile = await getUserProfilePage(session.id);
  if (!profile) {
    return NextResponse.json({ error: 'profile_failed' }, { status: 500 });
  }

  return NextResponse.json(mergeSessionUser(profile, session));
}

export async function PATCH(request: Request) {
  const session = await getAuthUserFromCookies();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const ok = await updateUserProfile(session.id, {
    bio: typeof body.bio === 'string' ? body.bio.slice(0, 280) : undefined,
    country: typeof body.country === 'string' ? body.country.slice(0, 80) : undefined,
    target_exam: typeof body.target_exam === 'string' ? body.target_exam.slice(0, 120) : undefined,
    daily_goal: typeof body.daily_goal === 'number' ? body.daily_goal : undefined,
    weekly_goal: typeof body.weekly_goal === 'number' ? body.weekly_goal : undefined,
    monthly_goal: typeof body.monthly_goal === 'number' ? body.monthly_goal : undefined,
  });

  if (!ok) {
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }

  const profile = await getUserProfilePage(session.id);
  if (!profile) {
    return NextResponse.json({ error: 'profile_failed' }, { status: 500 });
  }

  return NextResponse.json(mergeSessionUser(profile, session));
}
