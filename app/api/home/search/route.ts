import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getHomeCatalogSearchItems } from '@/app/home/lib/catalogSearch';

export const runtime = 'nodejs';
export const revalidate = 300;

const getCachedHomeSearchItems = unstable_cache(
  async () => getHomeCatalogSearchItems(),
  ['home-catalog-search-items-v1'],
  { revalidate: 300 },
);

export async function GET() {
  try {
    const items = await getCachedHomeSearchItems();
    return NextResponse.json(
      { items },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      },
    );
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
