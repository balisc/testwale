import type { Metadata } from 'next';
import Link from 'next/link';
import { canonical } from '@/lib/seo';

const title = 'About Questionwale - Coming Soon';
const description = 'The Questionwale about page is being updated. Browse subjects and practice competitive exam MCQs while this page is prepared.';

export const metadata: Metadata = {
  title,
  description,
  ...canonical('/about_us'),
  robots: { index: false, follow: true },
  openGraph: { title, description, url: '/about_us', type: 'website', siteName: 'Questionwale' },
  twitter: { card: 'summary_large_image', title, description },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-24 text-slate-900">
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">About Us</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Coming soon</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">
          We are updating this page with a clearer story about Questionwale, our exam-prep mission, and how students can use topic-wise MCQs.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/subjects" className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
            Browse Subjects
          </Link>
          <Link href="/" className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Go Home
          </Link>
        </div>
      </section>
    </main>
  );
}
