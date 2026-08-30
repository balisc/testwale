import { NextResponse } from 'next/server';
import { issuePasswordRecovery } from '@/lib/accountSecurity';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let email = '';
  try {
    const body = await request.json();
    email = String(body?.email ?? '');
  } catch {
    // Return the same response shape as a valid, unknown email.
  }
  await issuePasswordRecovery(email, request);
  return NextResponse.json(
    { accepted: true },
    { status: 202, headers: { 'Cache-Control': 'private, no-store' } },
  );
}
