import { redirect } from 'next/navigation';
import { slugifySubject } from '@/lib/slugGenerator';

const decodeTopicSlug = (slug: string) => {
  try {
    return decodeURIComponent(slug);
  } catch (err) {
    console.error('--- TERMINAL DEBUG: decodeURIComponent failed ---', err);
    return slug;
  }
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RedirectTopicPage({ params }: { params: { subject: string; topicSlug: string } }) {
  const subject = String(params.subject ?? '').trim().toLowerCase();
  const decodedTopic = decodeTopicSlug(String(params.topicSlug ?? '').trim());
  const topicSlug = slugifySubject(decodedTopic);
  redirect(`/${subject}/topics/${topicSlug}`);
}
