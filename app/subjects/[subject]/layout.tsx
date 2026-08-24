import type { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
};

/**
 * Route validation belongs to the page, where the authenticated user's exact
 * exam syllabus is available. A global-catalog guard here rejects valid
 * exam-specific subject slugs before the page can resolve them.
 */
export default function SubjectCatalogLayout({ children }: LayoutProps) {
  return children;
}
