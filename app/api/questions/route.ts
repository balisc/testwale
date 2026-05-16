import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
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

    return NextResponse.json({ questions }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Questions API error:', error);
    return NextResponse.json(
      {
        error: 'Supabase query failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
