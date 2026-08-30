import { NextResponse } from 'next/server';
import { issueEmailVerification } from '@/lib/accountSecurity';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let email = '';
  try {
    const body = await request.json();
    email = String(body?.email ?? '');
  } catch {
    // Keep this endpoint enumeration-resistant.
  }
  await issueEmailVerification(email, request);
  return NextResponse.json(
    { accepted: true },
    { status: 202, headers: { 'Cache-Control': 'private, no-store' } },
  );
}
