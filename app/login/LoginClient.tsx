'use client';

import AuthPageClient from '@/app/components/AuthPageClient';

export default function LoginClient({ googleClientId = '' }: { googleClientId?: string }) {
  return <AuthPageClient googleClientId={googleClientId} />;
}
