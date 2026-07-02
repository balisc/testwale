import type { Metadata } from 'next';
import LoginClient from './LoginClient';
import { canonical } from '@/lib/seo';
import { getGoogleClientId } from '@/lib/googleAuth';

export const dynamic = 'force-dynamic';

const title = 'Sign In - QuestionWale';
const description =
  'Sign in to QuestionWale with Google to save your practice, scores, progress and rankings across every device.';

export const metadata: Metadata = {
  title,
  description,
  ...canonical('/login'),
};

export default function LoginPage() {
  return <LoginClient googleClientId={getGoogleClientId()} />;
}
