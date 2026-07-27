import { NextResponse } from 'next/server';
import { listRankedExamOptions } from '@/lib/polity/examRankingV2';

export const dynamic = 'force-dynamic';

export async function GET() {
  const exams = await listRankedExamOptions();
  return NextResponse.json(
    { exams },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  );
}
