import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import ProfileClient from './ProfileClient';

export const metadata: Metadata = buildPageMetadata({
  title: 'My Profile',
  description: 'Your QuestionWale profile with stats, readiness score, strengths, weaknesses, and activity.',
  path: '/profile',
  noIndex: true,
});

export default function ProfilePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F8FAFC]">
      <ProfileClient />
    </main>
  );
}
