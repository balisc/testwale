import { NextResponse } from 'next/server';
import { getGoogleClientId } from '@/lib/googleAuth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const googleClientId = getGoogleClientId();

  return NextResponse.json({
    googleClientId: googleClientId || null,
    configured: Boolean(googleClientId),
  });
}
