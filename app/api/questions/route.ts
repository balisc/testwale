import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function escapeForLike(value: string) {
  return value.replace(/([%_])/g, '\\$1');
}

export async function GET(request: Request) {
  try {
    // Fetch all questions without any filtering for now
    const { data, error } = await supabase.from('history_questions').select('*');

    console.log('Error Details:', error);
    console.log('Data count:', data?.length);
    console.log('First record:', data?.[0]);

    if (error) {
      throw new Error(error.message);
    }

    const questions = (data ?? []).map((row, index) => ({
      id: row.id ?? String(index),
      ...row,
    }));

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Questions API error:', error);
    return NextResponse.json(
      {
        error: 'Supabase query failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
