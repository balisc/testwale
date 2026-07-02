import type { Metadata } from 'next';
import ScienceClient from './ScienceClient';
import { buildSubjectMetadata } from '@/lib/seo';

export const revalidate = 3600;

export const metadata: Metadata = buildSubjectMetadata('Science', '/science');

export default function SciencePage() {
  return <ScienceClient />;
}
