import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/authCookies';

export const dynamic = 'force-dynamic';

export async function POST() {
  await clearAuthCookie();
  return NextResponse.json({ success: true });
}
