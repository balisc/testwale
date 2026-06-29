import { NextResponse } from 'next/server';
import { BASE_URL } from '@/lib/seo';

export const revalidate = 3600;

export function GET() {
  return NextResponse.redirect(`${BASE_URL}/sitemap.xml`, 308);
}
