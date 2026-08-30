import type { Metadata } from 'next';
import ResetPasswordClient from './ResetPasswordClient';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  ...buildPageMetadata({
    title: 'Choose a New Password',
    description: 'Complete a secure QuestionWale password reset.',
    path: '/reset-password',
    noIndex: true,
  }),
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
