import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/authCookies';

export const dynamic = 'force-dynamic';

const PRIVATE_NO_STORE = { 'Cache-Control': 'private, no-store' } as const;

export async function POST() {
  await clearAuthCookie();
  return NextResponse.json({ success: true }, { headers: PRIVATE_NO_STORE });
}
