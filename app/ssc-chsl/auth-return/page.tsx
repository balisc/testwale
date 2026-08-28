import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthUserFromCookies } from '@/lib/authCookies';
import { getSafeRedirectPath } from '@/lib/safeRedirect';
import { parseSscChslRoute } from '@/lib/sscChsl';
import { getSscChslPreference, saveSscChslPreference } from '@/lib/sscChslServer';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Completing SSC CHSL sign-in',
  robots: { index: false, follow: false },
};

export default async function SscChslAuthReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const session = await getAuthUserFromCookies();
  if (!session) redirect('/ssc-chsl');
  const raw = (await searchParams).returnTo;
  const returnTo = getSafeRedirectPath(Array.isArray(raw) ? raw[0] : raw, '/ssc-chsl');
  const url = new URL(returnTo, 'https://questionwale.local');
  const segments = url.pathname.split('/').filter(Boolean);
  const route = segments[0] === 'ssc-chsl' ? parseSscChslRoute(segments.slice(1)) : null;
  if (!route) redirect('/ssc-chsl');

  const existing = await getSscChslPreference(session.id);
  if (existing.status === 'ready') redirect(returnTo);
  if (existing.status === 'error') redirect('/ssc-chsl');
  const saved = await saveSscChslPreference(session.id, route.stage.code);
  if (!saved.ok) redirect('/ssc-chsl');
  redirect(returnTo);
}
