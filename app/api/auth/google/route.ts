import { NextResponse } from 'next/server';
import { authenticateGoogleCredential } from '@/lib/googleAuthSession';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const credential = String(body?.credential ?? '');
    const result = await authenticateGoogleCredential(credential);

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          code: result.code,
          message: result.message,
        },
        { status: result.status },
      );
    }

    return NextResponse.json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    console.error('Google auth API error:', error);
    return NextResponse.json({ success: false, code: 'submitError' }, { status: 500 });
  }
}
