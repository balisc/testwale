import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAuthUserFromCookies } from '@/lib/authCookies';
import { isSscCglPreferenceTier } from '@/lib/sscCglPreference';
import {
  getSscCglPreference,
  getSscCglTierAvailability,
  saveSscCglPreference,
} from '@/lib/sscCglPreferenceServer';

export const dynamic = 'force-dynamic';

const PRIVATE_NO_STORE = { 'Cache-Control': 'private, no-store' } as const;

export async function GET() {
  const session = await getAuthUserFromCookies();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: PRIVATE_NO_STORE });
  }

  const [result, availability] = await Promise.all([
    getSscCglPreference(session.id),
    getSscCglTierAvailability(),
  ]);
  if (result.status === 'error') {
    return NextResponse.json({ error: result.code }, { status: 503, headers: PRIVATE_NO_STORE });
  }
  if (availability.status === 'error') {
    return NextResponse.json({ error: availability.code }, { status: 503, headers: PRIVATE_NO_STORE });
  }
  return NextResponse.json(
    {
      preference: result.status === 'ready' ? result.preference : null,
      tiers: availability.tiers,
    },
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
  if (!isSscCglPreferenceTier(body.tierCode)) {
    return NextResponse.json({ error: 'invalid_tier' }, { status: 400, headers: PRIVATE_NO_STORE });
  }
  const mode = body.mode === 'create_if_missing' ? 'create_if_missing' : body.mode === 'replace' ? 'replace' : null;
  if (!mode) {
    return NextResponse.json({ error: 'invalid_mode' }, { status: 400, headers: PRIVATE_NO_STORE });
  }

  const result = await saveSscCglPreference(session.id, body.tierCode, mode);
  if (!result.ok) {
    const status = result.code === 'tier_unavailable' ? 400 : 503;
    return NextResponse.json({ error: result.code }, { status, headers: PRIVATE_NO_STORE });
  }

  revalidatePath('/profile');
  revalidatePath('/ssc-cgl');

  return NextResponse.json(result, { headers: PRIVATE_NO_STORE });
}
