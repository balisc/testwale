import type { Metadata } from 'next';
import SignUpClient from './SignUpClient';
import { buildPageMetadata } from '@/lib/seo';
import { getGoogleClientId } from '@/lib/googleAuth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPageMetadata({
  title: 'Sign Up',
  description:
    'Sign up with Google on QuestionWale to save your practice, scores, progress and rankings across every device.',
  path: '/signup',
  noIndex: true,
});

export default function SignUpPage() {
  return <SignUpClient googleClientId={getGoogleClientId()} />;
}
