import { loadSubjectByRouteSlug } from '@/lib/catalogRouteGuards';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ subject: string }>;
};

export default async function SubjectCatalogLayout({ children, params }: LayoutProps) {
  const { subject: routeSubject } = await params;
  const row = await loadSubjectByRouteSlug(routeSubject);
  if (!row) notFound();
  return children;
}
