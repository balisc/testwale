import { NextResponse } from 'next/server';
import { clearAuthCookie, getAuthUserFromCookies } from '@/lib/authCookies';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getAuthUserFromCookies();
  return NextResponse.json({ user });
}

export async function DELETE() {
  await clearAuthCookie();
  return NextResponse.json({ success: true });
}
