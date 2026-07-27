import { NextResponse } from 'next/server';
import { getAuthUserFromCookies } from '@/lib/authCookies';
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

  const ok = await updateUserProfile(session.id, {
    bio: typeof body.bio === 'string' ? body.bio.slice(0, 280) : undefined,
    country: typeof body.country === 'string' ? body.country.slice(0, 80) : undefined,
    target_exam: typeof body.target_exam === 'string' ? body.target_exam.slice(0, 120) : undefined,
    daily_goal: typeof body.daily_goal === 'number' ? body.daily_goal : undefined,
    weekly_goal: typeof body.weekly_goal === 'number' ? body.weekly_goal : undefined,
    monthly_goal: typeof body.monthly_goal === 'number' ? body.monthly_goal : undefined,
  });

  if (!ok) {
    return NextResponse.json({ error: 'update_failed' }, { status: 500, headers: PRIVATE_NO_STORE });
  }

  const profile = await getUserProfilePage(session.id);
  const payload = profile
    ? mergeSessionUser(profile, session)
    : await buildProfilePageForSession(session);

  return NextResponse.json(payload, { headers: PRIVATE_NO_STORE });
}
