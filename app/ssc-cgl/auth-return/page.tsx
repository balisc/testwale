import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthUserFromCookies } from '@/lib/authCookies';
import { getSafeRedirectPath } from '@/lib/safeRedirect';
import {
  getSscCglPreference,
  saveSscCglPreference,
} from '@/lib/sscCglPreferenceServer';
import { parseSscCglRoute } from '@/lib/sscCglSyllabus';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Completing SSC CGL sign-in',
  robots: { index: false, follow: false },
};

export default async function SscCglAuthReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const session = await getAuthUserFromCookies();
  if (!session) redirect('/ssc-cgl');

  const params = await searchParams;
  const rawReturnTo = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  const returnTo = getSafeRedirectPath(rawReturnTo, '/ssc-cgl');
  const url = new URL(returnTo, 'https://questionwale.local');
  const segments = url.pathname.split('/').filter(Boolean);
  const route = segments[0] === 'ssc-cgl' ? parseSscCglRoute(segments.slice(1)) : null;
  if (!route) redirect('/ssc-cgl');

  const existing = await getSscCglPreference(session.id);
  if (existing.status === 'ready') redirect(returnTo);
  if (existing.status === 'error') redirect('/ssc-cgl');

  const tierCode = route.stage.tier === 'tier-1' ? 'TIER_I' : 'TIER_II';
  const saved = await saveSscCglPreference(session.id, tierCode, 'create_if_missing');
  if (!saved.ok) redirect('/ssc-cgl');
  redirect(returnTo);
}
