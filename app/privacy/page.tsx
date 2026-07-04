import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Privacy Policy',
  description: 'Privacy Policy for QuestionWale — how we handle your data when you sign in and practice MCQs.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 md:px-6 md:py-20">
      <h1 className="text-3xl font-bold text-[#0F172A]">Privacy Policy</h1>
      <p className="mt-4 text-slate-600 leading-relaxed">
        QuestionWale respects your privacy. When you sign in with Google, we receive basic profile information
        needed to create and maintain your account, such as your name and email address.
      </p>
      <p className="mt-4 text-slate-600 leading-relaxed">
        Practice activity and progress data are stored to support features like attempt tracking and accuracy
        summaries. We do not sell your personal information.
      </p>
      <p className="mt-4 text-slate-600 leading-relaxed">
        For questions about your data, please use our{' '}
        <Link href="/contact" className="font-semibold text-brand hover:underline">
          Contact
        </Link>{' '}
        page.
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
