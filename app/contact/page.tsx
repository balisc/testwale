import type { Metadata } from 'next';
import ContactClient from './ContactClient';
import { canonical } from '@/lib/seo';

const title = 'Contact QuestionWale - Get Help & Support';
const description =
  'Contact QuestionWale for support, feedback, topic requests, or to report wrong questions. Our team responds within 24–48 hours to help improve your exam preparation.';

export const metadata: Metadata = {
  title,
  description,
  ...canonical('/contact'),
  openGraph: {
    title,
    description,
    url: '/contact',
    type: 'website',
    siteName: 'Questionwale',
  },
  twitter: { card: 'summary_large_image', title, description },
};

export default function ContactPage() {
  return <ContactClient />;
}
