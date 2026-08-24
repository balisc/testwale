import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import ProfileOverviewPage from './ProfileOverviewPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'My Profile',
  description: 'Your QuestionWale profile with stats, readiness score, strengths, weaknesses, and activity.',
  path: '/profile',
  noIndex: true,
});

export default function ProfilePage() {
  return (
    <main className="min-h-screen w-full min-w-0 max-w-full bg-white">
      <ProfileOverviewPage />
    </main>
  );
}
