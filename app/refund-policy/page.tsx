import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Refund Policy',
  description: 'Refund Policy for QuestionWale — free MCQ practice platform with no paid subscriptions.',
  path: '/refund-policy',
});

export default function RefundPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 md:px-6 md:py-20">
      <h1 className="text-3xl font-bold text-[#0F172A]">Refund Policy</h1>
      <p className="mt-4 text-slate-600 leading-relaxed">
        QuestionWale currently offers free access to MCQ practice content. There are no paid subscriptions,
        courses, or premium plans requiring payment at this time.
      </p>
      <p className="mt-4 text-slate-600 leading-relaxed">
        If paid features are introduced in the future, this policy will be updated with clear refund terms
        before any purchase is required.
      </p>
      <p className="mt-4 text-slate-600 leading-relaxed">
        For account or billing questions, please contact us via the{' '}
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
