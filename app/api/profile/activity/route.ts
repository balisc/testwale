import { NextResponse } from 'next/server';
import { getAuthUserFromCookies } from '@/lib/authCookies';
import { getUserProfileActivity } from '@/lib/profileActivityServer';
import { isProfileTabEnabled } from '@/lib/profileTabAccess';

export const dynamic = 'force-dynamic';

const PRIVATE_NO_STORE = {
  'Cache-Control': 'private, no-store',
} as const;

export async function GET(request: Request) {
  if (!isProfileTabEnabled('activity')) {
    return NextResponse.json({ error: 'not_found' }, { status: 404, headers: PRIVATE_NO_STORE });
  }

  const session = await getAuthUserFromCookies();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: PRIVATE_NO_STORE });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period');

  const payload = await getUserProfileActivity(session.id, period);
  return NextResponse.json(payload, { headers: PRIVATE_NO_STORE });
}
