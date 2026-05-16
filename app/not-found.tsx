import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-slate-900 px-4">
      <div className="max-w-xl text-center">
        <h1 className="text-5xl font-extrabold mb-4">Coming soon</h1>
        <p className="text-lg text-slate-600 mb-8">
          This page is not available yet. We're working on it — check back soon.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/" className="px-6 py-3 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
