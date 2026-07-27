import { NextResponse } from 'next/server';
import { getAuthUserFromCookies } from '@/lib/authCookies';
import { getUserProfileInsights } from '@/lib/profileInsightsServer';
import { isProfileTabEnabled } from '@/lib/profileTabAccess';

export const dynamic = 'force-dynamic';

const PRIVATE_NO_STORE = {
  'Cache-Control': 'private, no-store',
} as const;

export async function GET() {
  if (!isProfileTabEnabled('insights')) {
    return NextResponse.json({ error: 'not_found' }, { status: 404, headers: PRIVATE_NO_STORE });
  }

  const session = await getAuthUserFromCookies();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: PRIVATE_NO_STORE });
  }

  const insights = await getUserProfileInsights(session.id);
  if (!insights) {
    return NextResponse.json({ error: 'insights_unavailable' }, { status: 500, headers: PRIVATE_NO_STORE });
  }

  return NextResponse.json(insights, { headers: PRIVATE_NO_STORE });
}
