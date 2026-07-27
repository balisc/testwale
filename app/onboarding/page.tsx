import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import OnboardingClient from './OnboardingClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'Set Your Exam Goal',
  description: 'Choose your target exam and date on QuestionWale.',
  path: '/onboarding',
  noIndex: true,
});

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <OnboardingClient />
    </main>
  );
}
