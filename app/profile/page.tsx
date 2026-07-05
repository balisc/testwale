import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import ProfileClient from './ProfileClient';

export const metadata: Metadata = buildPageMetadata({
  title: 'My Profile — QuestionWale',
  description: 'Your QuestionWale profile with stats, readiness score, strengths, weaknesses, and activity.',
  path: '/profile',
});

export default function ProfilePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F8FAFC]">
      <ProfileClient />
    </main>
  );
}
