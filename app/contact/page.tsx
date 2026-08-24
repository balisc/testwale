import type { Metadata } from 'next';
import ContactClient from './ContactClient';
import { buildPageMetadata } from '@/lib/seo';

const title = 'Contact & Support';
const description =
  'Contact QuestionWale for support, feedback, topic requests, or to report wrong questions. Our team responds within 24–48 hours to help improve your exam preparation.';

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path: '/contact',
});

export default function ContactPage() {
  return <ContactClient />;
}
