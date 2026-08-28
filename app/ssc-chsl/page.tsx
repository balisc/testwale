import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthUserFromCookies } from '@/lib/authCookies';
import { getSscChslPreferenceHref } from '@/lib/sscChsl';
import {
  getSscChslPreference,
  getSscChslStageAvailability,
} from '@/lib/sscChslServer';
import SscChslPreferenceLoadError from './SscChslPreferenceLoadError';
import SscChslTierSelectionPage from './SscChslTierSelectionPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'SSC CHSL Preparation',
  description: 'Prepare for SSC CHSL through a focused, tier-wise syllabus and exact exam question practice.',
  robots: { index: false, follow: true },
};

export default async function SscChslPage({
  searchParams,
}: {
  searchParams: Promise<{ change?: string | string[] }>;
}) {
  const session = await getAuthUserFromCookies();
  if (!session) redirect('/exams/ssc-combined-higher-secondary-level-examination');
  const change = (await searchParams).change === '1';

  const [availability, preference] = await Promise.all([
    getSscChslStageAvailability(),
    getSscChslPreference(session.id),
  ]);
  if (availability.status === 'error' || preference.status === 'error') {
    return <SscChslPreferenceLoadError />;
  }

  if (!change && preference.status === 'ready') {
    const selectedStage = availability.stages.find(
      (stage) => stage.stageCode === preference.preference.stageCode && stage.isAvailable,
    );
    if (selectedStage) redirect(getSscChslPreferenceHref(preference.preference));
  }

  return <SscChslTierSelectionPage stages={availability.stages} />;
}
