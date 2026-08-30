import type { Metadata } from 'next';
import ForgotPasswordClient from './ForgotPasswordClient';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  ...buildPageMetadata({
    title: 'Password Recovery',
    description: 'Request a secure QuestionWale password-reset link.',
    path: '/forgot-password',
    noIndex: true,
  }),
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
