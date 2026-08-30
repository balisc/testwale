import type { Metadata } from 'next';
import ContactClient from './ContactClient';
import { buildPageMetadata } from '@/lib/seo';

const title = 'Contact & Support';
const description =
  'Contact QuestionWale for support, account questions, feedback, topic requests, or to report a content issue.';

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path: '/contact',
});

export default function ContactPage() {
  return <ContactClient />;
}
