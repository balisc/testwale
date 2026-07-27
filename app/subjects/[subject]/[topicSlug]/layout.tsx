import { loadTopicByRouteSlugs } from '@/lib/catalogRouteGuards';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ subject: string; topicSlug: string }>;
};

export default async function TopicCatalogLayout({ children, params }: LayoutProps) {
  const { subject: routeSubject, topicSlug } = await params;
  const row = await loadTopicByRouteSlugs(routeSubject, topicSlug);
  if (!row) notFound();
  return children;
}
