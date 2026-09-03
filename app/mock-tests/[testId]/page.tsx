import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthUserFromCookies } from '@/lib/authCookies';
import { buildPageMetadata } from '@/lib/seo';
import MockTestWorkspace from './MockTestWorkspace';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'SSC CGL Tier 1 Mock Test',
  description: 'Your private SSC CGL Tier 1 mock-test workspace.',
  path: '/mock-tests',
  noIndex: true,
});

export default async function MockTestPage({ params }: { params: Promise<{ testId: string }> }) {
  const user = await getAuthUserFromCookies();
  const { testId } = await params;
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/mock-tests/${testId}`)}`);
  return <MockTestWorkspace testId={testId} />;
}
