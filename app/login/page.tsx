import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginClient from './LoginClient';
import { canonical } from '@/lib/seo';
import { getGoogleClientId } from '@/lib/googleAuth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign In',
  description:
    'Sign in to QuestionWale with Google to save your practice, scores, progress and rankings across every device.',
  ...canonical('/login'),
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginClient googleClientId={getGoogleClientId()} />
    </Suspense>
  );
}
