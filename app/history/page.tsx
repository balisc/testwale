import type { Metadata } from 'next';
import HistoryClient from './HistoryClient';
import { buildSubjectMetadata } from '@/lib/seo';

export const revalidate = 3600;

export const metadata: Metadata = buildSubjectMetadata('History', '/history');

export default function HistoryPage() {
  return <HistoryClient />;
}
