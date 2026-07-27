import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { buildPageMetadata } from '@/lib/seo';
import { isProfileTabEnabled } from '@/lib/profileTabAccess';
import ProfileGoalsPage from '../ProfileGoalsPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'Goals & Settings',
  description: 'Manage your targets, milestones and learning preferences on QuestionWale.',
  path: '/profile/goals',
  noIndex: true,
});

export default function ProfileGoalsRoute() {
  if (!isProfileTabEnabled('goals')) {
    redirect('/profile');
  }

  return (    <main className="min-h-screen overflow-x-hidden bg-white">
      <ProfileGoalsPage />
    </main>
  );
}
