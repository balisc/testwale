import { permanentRedirect } from 'next/navigation';
import { slugifySubject } from '@/lib/slugGenerator';

const decodeTopicSlug = (slug: string) => {
  try {
    return decodeURIComponent(slug);
  } catch (err) {
    console.error('--- TERMINAL DEBUG: decodeURIComponent failed ---', err);
    return slug;
  }
};

export const revalidate = 3600;

export default async function RedirectTopicPage({ params }: { params: Promise<{ subject: string; topicSlug: string }> }) {
  const { subject: rawSubject, topicSlug: rawTopicSlug } = await params;
  const subject = String(rawSubject ?? '').trim().toLowerCase();
  const decodedTopic = decodeTopicSlug(String(rawTopicSlug ?? '').trim());
  const topicSlug = slugifySubject(decodedTopic);
  permanentRedirect(`/${subject}/topics/${topicSlug}`);
}
