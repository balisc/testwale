import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white text-slate-900 px-4">
      <div className="max-w-xl text-center">
        <h1 className="text-5xl font-extrabold mb-4">Page not found</h1>
        <p className="text-lg text-slate-600 mb-8">
          This page is not available. Choose a subject or return home to continue practicing.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/" className="px-6 py-3 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800">
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
