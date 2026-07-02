'use client';

import AuthPageClient from '@/app/components/AuthPageClient';

export default function SignUpClient({ googleClientId = '' }: { googleClientId?: string }) {
  return <AuthPageClient googleClientId={googleClientId} />;
}
