'use client';

import { useSearchParams } from 'next/navigation';
import { getSafeRedirectPath } from '@/lib/safeRedirect';
import AuthPageClient from '@/app/components/AuthPageClient';

export default function LoginClient({ googleClientId = '' }: { googleClientId?: string }) {
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirectPath(searchParams.get('redirect'), '/subjects');
  const authError = searchParams.get('message') ?? (searchParams.get('error') ? 'Google sign-in failed. Please try again.' : '');

  return (
    <AuthPageClient
      googleClientId={googleClientId}
      redirectTo={redirectTo}
      initialError={authError}
    />
  );
}
