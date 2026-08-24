import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { buildPageMetadata } from '@/lib/seo';
import { isProfileTabEnabled } from '@/lib/profileTabAccess';
import ProfileInsightsPage from '../ProfileInsightsPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'Learning Insights',
  description: 'Understand what you know and what to study next on QuestionWale.',
  path: '/profile/insights',
  noIndex: true,
});

export default function ProfileInsightsRoute() {
  if (!isProfileTabEnabled('insights')) {
    redirect('/profile');
  }

  return (
    <main className="min-h-screen w-full min-w-0 max-w-full bg-white">
      <ProfileInsightsPage />
    </main>
  );
}
