import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Terms of Service',
  description: 'Terms of Service for QuestionWale — rules for using our MCQ practice platform.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 md:px-6 md:py-20">
      <h1 className="text-3xl font-bold text-[#0F172A]">Terms of Service</h1>
      <p className="mt-4 text-slate-600 leading-relaxed">
        By using QuestionWale, you agree to practice responsibly and use the platform for personal exam
        preparation. Content is provided for educational purposes. Account features such as progress tracking
        require signing in with Google.
      </p>
      <p className="mt-4 text-slate-600 leading-relaxed">
        We may update these terms as the platform evolves. Continued use of QuestionWale after changes means
        you accept the updated terms.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-[44px] items-center text-sm font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2"
      >
        Back to Home
      </Link>
    </main>
  );
}
