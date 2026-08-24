import { NextResponse } from 'next/server';
import { getAuthUserFromCookies } from '@/lib/authCookies';
import { getExamPreparationTracks } from '@/lib/examPreferenceServer';

export const dynamic = 'force-dynamic';

const PRIVATE_NO_STORE = { 'Cache-Control': 'private, no-store' } as const;

export async function GET(request: Request) {
  const session = await getAuthUserFromCookies();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: PRIVATE_NO_STORE });
  }

  const examProfileId = new URL(request.url).searchParams.get('examProfileId')?.trim() ?? '';
  const result = await getExamPreparationTracks(examProfileId);
  if (result.status === 'invalid_exam_profile') {
    return NextResponse.json(
      { error: 'invalid_exam_profile' },
      { status: 400, headers: PRIVATE_NO_STORE },
    );
  }
  if (result.status === 'error') {
    return NextResponse.json(
      { error: 'track_database_error', databaseCode: result.code },
      { status: 503, headers: PRIVATE_NO_STORE },
    );
  }
  return NextResponse.json({ tracks: result.tracks }, { headers: PRIVATE_NO_STORE });
}
