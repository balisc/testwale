import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthUserFromCookies } from '@/lib/authCookies';
import { getSscCglPreferenceHref } from '@/lib/sscCglPreference';
import { getSscCglPreference, getSscCglTierAvailability } from '@/lib/sscCglPreferenceServer';
import SscCglPreferenceLoadError from './SscCglPreferenceLoadError';
import SscCglTierSelectionPage from './SscCglTierSelectionPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'SSC CGL Preparation',
  description: 'Prepare for SSC CGL through a focused, tier-wise syllabus and SSC-level question practice.',
  robots: { index: false, follow: true },
};

export default async function SscCglPage() {
  const session = await getAuthUserFromCookies();
  if (!session) redirect('/exams/ssc-cgl');

  const availability = await getSscCglTierAvailability();
  if (availability.status === 'error') return <SscCglPreferenceLoadError />;

  const result = await getSscCglPreference(session.id);
  if (result.status === 'ready') {
    const savedTierAvailable = availability.tiers.some(
      (tier) => tier.tierCode === result.preference.tierCode && tier.isAvailable,
    );
    if (savedTierAvailable) redirect(getSscCglPreferenceHref(result.preference));
    return <SscCglTierSelectionPage persistPreference tiers={availability.tiers} saveMode="replace" />;
  }
  if (result.status === 'error') return <SscCglPreferenceLoadError />;

  return <SscCglTierSelectionPage persistPreference tiers={availability.tiers} />;
}
