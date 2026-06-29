import type { Metadata } from 'next';
import GeographyClient from './GeographyClient';
import { buildSubjectMetadata } from '@/lib/seo';

export const revalidate = 3600;

export const metadata: Metadata = buildSubjectMetadata('Geography', '/geography');

export default function GeographyPage() {
  return <GeographyClient />;
}
