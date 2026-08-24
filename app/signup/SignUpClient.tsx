'use client';

import AuthPageClient from '@/app/components/AuthPageClient';
import { useSearchParams } from 'next/navigation';
import { getSafeRedirectPath } from '@/lib/safeRedirect';

export default function SignUpClient({ googleClientId = '' }: { googleClientId?: string }) {
  const searchParams = useSearchParams();
  const returnTo = getSafeRedirectPath(
    searchParams.get('returnTo') ?? searchParams.get('redirect'),
    '/dashboard',
  );
  const onboardingPath = `/onboarding?returnTo=${encodeURIComponent(returnTo)}`;
  return <AuthPageClient googleClientId={googleClientId} redirectTo={onboardingPath} />;
}
