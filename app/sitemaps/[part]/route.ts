import { NextResponse } from 'next/server';
import { BASE_URL } from '@/lib/seo';

export const revalidate = 3600;

export async function GET(_: Request, { params }: { params: Promise<{ part: string }> }) {
  const { part: rawPart } = await params;
  const part = String(rawPart ?? '');
  if (!/^(?:\d+|sitemap-questions-\d+\.xml)$/.test(part)) {
    return new Response('Not Found', { status: 404 });
  }

  return NextResponse.redirect(`${BASE_URL}/sitemap.xml`, 308);
}
