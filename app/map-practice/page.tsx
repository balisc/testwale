import type { Metadata } from 'next';
import MapPracticePage from './MapPracticePage';
import { canonical } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Map Practice',
  description: 'Practice India, World, and current affairs map-based questions with interactive click-to-answer mode.',
  ...canonical('/map-practice'),
};

export default function Page() {
  return <MapPracticePage />;
}
