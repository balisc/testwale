import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { validateContactForm } from '@/lib/contactValidation';

export const dynamic = 'force-dynamic';

function isMissingTableError(error: unknown) {
  const message = String((error as { message?: string })?.message ?? '');
  return /Could not find the table|relation .* does not exist|schema cache/i.test(message);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateContactForm({
      name: String(body?.name ?? ''),
      email: String(body?.email ?? ''),
      mobile: String(body?.mobile ?? ''),
      subject: String(body?.subject ?? ''),
      message: String(body?.message ?? ''),
      category: body?.category ?? null,
    });

    if (!validation.ok) {
      return NextResponse.json(
        { success: false, field: validation.field, code: validation.code },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, code: 'saveError' },
        { status: 503 },
      );
    }

    const { error } = await admin.from('contact_us').insert({
      name: validation.data.name,
      email: validation.data.email,
      mobile: validation.data.mobile,
      subject: validation.data.subject,
      message: validation.data.message,
      category: validation.data.category,
      status: 'new',
    });

    if (error) {
      console.error('Contact submission insert error:', error.message);

      if (isMissingTableError(error)) {
        return NextResponse.json(
          { success: false, code: 'saveError' },
          { status: 503 },
        );
      }

      if (/row-level security|permission denied|42501/i.test(error.message)) {
        return NextResponse.json(
          { success: false, code: 'saveError' },
          { status: 503 },
        );
      }

      return NextResponse.json(
        { success: false, code: 'saveError' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { success: false, code: 'saveError' },
      { status: 500 },
    );
  }
}
