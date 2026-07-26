import { loadSubtopicByRouteSlugs } from '@/lib/catalogRouteGuards';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ subject: string; topicSlug: string; subtopicSlug: string }>;
};

export default async function SubtopicRevisionLayout({ children, params }: LayoutProps) {
  const { subject: routeSubject, topicSlug, subtopicSlug } = await params;
  const row = await loadSubtopicByRouteSlugs(routeSubject, topicSlug, subtopicSlug);
  if (!row) notFound();
  return children;
}
