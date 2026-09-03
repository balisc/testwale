import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthUserFromCookies } from '@/lib/authCookies';
import { buildPageMetadata } from '@/lib/seo';
import MockTestResultClient from './MockTestResultClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = buildPageMetadata({ title: 'Mock Test Result', description: 'Your private SSC CGL mock result and question review.', path: '/mock-tests', noIndex: true });

export default async function MockTestResultPage({ params }: { params: Promise<{ testId: string }> }) {
  const user = await getAuthUserFromCookies();
  const { testId } = await params;
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/mock-tests/${testId}/result`)}`);
  return <MockTestResultClient testId={testId} />;
}

