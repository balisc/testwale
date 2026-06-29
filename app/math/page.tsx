import type { Metadata } from 'next';
import MathClient from './MathClient';
import { buildSubjectMetadata } from '@/lib/seo';

export const revalidate = 3600;

export const metadata: Metadata = buildSubjectMetadata('Mathematics', '/math');

export default function MathPage() {
  return <MathClient />;
}
