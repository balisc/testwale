import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { buildPageMetadata } from '@/lib/seo';
import { isProfileTabEnabled } from '@/lib/profileTabAccess';
import ProfileSavedPage from '../ProfileSavedPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'Revision & Saved',
  description: 'Review your mistakes and return to saved learning on QuestionWale.',
  path: '/profile/saved',
  noIndex: true,
});

export default function ProfileSavedRoute() {
  if (!isProfileTabEnabled('saved')) {
    redirect('/profile');
  }

  return (    <main className="min-h-screen overflow-x-hidden bg-white">
      <ProfileSavedPage />
    </main>
  );
}
