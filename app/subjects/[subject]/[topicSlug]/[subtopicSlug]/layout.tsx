import type { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
};

/** Exact-exam subtopics are validated against the selected syllabus by the page. */
export default function SubtopicRevisionLayout({ children }: LayoutProps) {
  return children;
}
