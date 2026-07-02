import type { Metadata } from 'next';
import SignUpClient from './SignUpClient';
import { canonical } from '@/lib/seo';
import { getGoogleClientId } from '@/lib/googleAuth';

export const dynamic = 'force-dynamic';

const title = 'Sign Up - QuestionWale';
const description =
  'Sign up with Google on QuestionWale to save your practice, scores, progress and rankings across every device.';

export const metadata: Metadata = {
  title,
  description,
  ...canonical('/signup'),
  openGraph: {
    title,
    description,
    url: '/signup',
    type: 'website',
    siteName: 'Questionwale',
  },
  twitter: { card: 'summary_large_image', title, description },
};

export default function SignUpPage() {
  return <SignUpClient googleClientId={getGoogleClientId()} />;
}
