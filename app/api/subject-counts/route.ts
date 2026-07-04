import { NextResponse } from 'next/server';
import { getHomepageSubjectCounts } from '@/lib/subjectCounts';

export const revalidate = 300;
const PUBLIC_CACHE = 'public, s-maxage=300, stale-while-revalidate=600';

export async function GET() {
  try {
    const counts = await getHomepageSubjectCounts();
    return NextResponse.json(counts, {
      headers: { 'Cache-Control': PUBLIC_CACHE },
    });
  } catch (error) {
    console.error('Subject counts API error:', error);
    return NextResponse.json({}, { status: 500 });
  }
}
