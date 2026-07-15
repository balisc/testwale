import type { Metadata } from 'next';
import ReasoningClient from './ReasoningClient';
import { buildSubjectMetadata } from '@/lib/seo';

export const revalidate = 3600;

export const metadata: Metadata = buildSubjectMetadata('Reasoning', '/reasoning');

export default function ReasoningPage() {
  return <ReasoningClient />;
}
