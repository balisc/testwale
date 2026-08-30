import { NextResponse } from 'next/server';
import { consumePasswordRecovery } from '@/lib/accountSecurity';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ok = await consumePasswordRecovery(
      String(body?.token ?? ''),
      String(body?.newPassword ?? ''),
    );
    if (!ok) {
      return NextResponse.json(
        { success: false, code: 'invalidOrExpiredToken' },
        { status: 400, headers: { 'Cache-Control': 'private, no-store' } },
      );
    }
    return NextResponse.json(
      { success: true },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return NextResponse.json(
      { success: false, code: 'invalidOrExpiredToken' },
      { status: 400, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
}
