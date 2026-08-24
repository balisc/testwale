import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

type LayoutProps = {
  children: ReactNode;
};

/** Exact-exam subtopics are validated against the selected syllabus by the page. */
export default function SubtopicPracticeLayout({ children }: LayoutProps) {
  return children;
}
