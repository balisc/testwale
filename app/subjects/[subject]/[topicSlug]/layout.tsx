import type { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
};

/** See the subject layout: exact-exam topic slugs are validated by the page. */
export default function TopicCatalogLayout({ children }: LayoutProps) {
  return children;
}
