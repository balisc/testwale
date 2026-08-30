import type { Metadata } from 'next';
import VerifyEmailClient from './VerifyEmailClient';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  ...buildPageMetadata({
    title: 'Verify Email',
    description: 'Complete QuestionWale account email verification.',
    path: '/verify-email',
    noIndex: true,
  }),
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return <VerifyEmailClient />;
}
