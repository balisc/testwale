import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import DashboardClient from './DashboardClient';

export const metadata: Metadata = buildPageMetadata({
  title: 'My Progress',
  description: 'Track your MCQ practice attempts, accuracy, and subject-wise progress on QuestionWale.',
  path: '/dashboard',
  noIndex: true,
});

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <DashboardClient />
    </main>
  );
}
