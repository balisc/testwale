import type { Metadata } from 'next';
import SignUpClient from './SignUpClient';
import { canonical } from '@/lib/seo';
import { getGoogleClientId } from '@/lib/googleAuth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign Up',
  description:
    'Sign up with Google on QuestionWale to save your practice, scores, progress and rankings across every device.',
  ...canonical('/signup'),
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Sign Up',
    description:
      'Sign up with Google on QuestionWale to save your practice, scores, progress and rankings across every device.',
    url: '/signup',
    type: 'website',
    siteName: 'QuestionWale',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign Up',
    description:
      'Sign up with Google on QuestionWale to save your practice, scores, progress and rankings across every device.',
  },
};

export default function SignUpPage() {
  return <SignUpClient googleClientId={getGoogleClientId()} />;
}
