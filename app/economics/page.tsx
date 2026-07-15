import type { Metadata } from 'next';
import EconomicsClient from './EconomicsClient';
import { buildSubjectMetadata } from '@/lib/seo';

export const revalidate = 3600;

export const metadata: Metadata = buildSubjectMetadata('Economics', '/economics');

export default function EconomicsPage() {
  return <EconomicsClient />;
}
