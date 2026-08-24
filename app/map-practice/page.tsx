import type { Metadata } from 'next';
import MapPracticePage from './MapPracticePage';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Map Practice',
  description: 'Practice India, World, and current affairs map-based questions with interactive click-to-answer mode.',
  path: '/map-practice',
});

export default function Page() {
  return <MapPracticePage />;
}
