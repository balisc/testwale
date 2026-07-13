import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getBaliCatalogSearchItems } from '@/app/bali/lib/catalogSearch';

export const runtime = 'nodejs';
export const revalidate = 300;

const getCachedBaliSearchItems = unstable_cache(
  async () => getBaliCatalogSearchItems(),
  ['bali-catalog-search-items-v1'],
  { revalidate: 300 },
);

export async function GET() {
  try {
    const items = await getCachedBaliSearchItems();
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
