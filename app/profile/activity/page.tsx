import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { buildPageMetadata } from '@/lib/seo';
import { isProfileTabEnabled } from '@/lib/profileTabAccess';
import ProfileActivityPage from '../ProfileActivityPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'Activity & Performance',
  description: 'Track your practice, accuracy and study time on QuestionWale.',
  path: '/profile/activity',
  noIndex: true,
});

export default function ProfileActivityRoute() {
  if (!isProfileTabEnabled('activity')) {
    redirect('/profile');
  }

  return (    <main className="min-h-screen w-full min-w-0 max-w-full bg-white">
      <ProfileActivityPage />
    </main>
  );
}
