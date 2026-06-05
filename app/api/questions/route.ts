import { NextResponse } from 'next/server';
import questionsData from '@/data/questions.json';
import supabase from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { data, error } = await supabase.from('history_questions').select('*');

    if (error) {
      console.warn('Questions API fallback to local JSON:', error.message);
      const fallbackQuestions = questionsData.map((row: any, index: number) => ({
        ...row,
        id: row.id ?? String(index),
      }));
      return NextResponse.json({ questions: fallbackQuestions }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const questions = (data ?? []).map((row: any, index: number) => ({
      ...row,
      id: row.id ?? String(index),
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
