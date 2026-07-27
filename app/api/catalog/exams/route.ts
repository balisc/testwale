import { NextResponse } from 'next/server';
import { listExamsFromCache } from '@/lib/catalogCache';
import { sortExamsForDisplay } from '@/lib/polity';

export const dynamic = 'force-dynamic';

export async function GET() {
  const exams = sortExamsForDisplay(await listExamsFromCache());
  return NextResponse.json(
    { exams },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  );
}
