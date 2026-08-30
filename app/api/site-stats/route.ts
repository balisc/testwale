import { NextResponse } from 'next/server';
import { getCatalogSiteStats } from '@/lib/catalogStats';

export const revalidate = 300;
const PUBLIC_CACHE = 'public, s-maxage=300, stale-while-revalidate=600';

export async function GET() {
  try {
    const catalogStats = await getCatalogSiteStats();
    if (catalogStats) {
      return NextResponse.json(catalogStats, { headers: { 'Cache-Control': PUBLIC_CACHE } });
    }
  } catch {
    // The aggregate is temporarily unavailable. Do not substitute stale bundled data.
  }

  return NextResponse.json(
    { error: 'Published counts are temporarily unavailable.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
