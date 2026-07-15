import LoadingTestPageContent from "../components/LoadingTestPageContent";
import type { Metadata } from 'next';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Loading test',
  robots: { index: false, follow: false },
};

export default function LoadingTestPage() {
  return <LoadingTestPageContent />;
}
