import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Terms of Service',
  description: 'Product terms for accounts, acceptable use, educational content, reports and service availability on QuestionWale.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-14 md:px-6 md:py-20">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">Terms of Service</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          These terms describe the practical rules for using QuestionWale. They are not presented as lawyer-approved advice.
        </p>
        <p className="mt-3 text-sm text-slate-500">Effective and last updated: 29 August 2026</p>
      </header>

      <div className="mt-10 space-y-9 text-sm leading-7 text-slate-600">
        <section>
          <h2 className="text-xl font-bold text-slate-950">Using QuestionWale</h2>
          <p className="mt-3">
            QuestionWale provides educational MCQ practice and study navigation. You may browse public content
            without an account where offered. Email or Google sign-in is required for account features such as
            saved progress, preferences, notes, bookmarks and history. Keep your sign-in details secure and give
            accurate information when creating or recovering an account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Acceptable use</h2>
          <p className="mt-3">
            Do not abuse, disrupt, scrape at a harmful rate, bypass access controls, probe other users&apos; data,
            submit malicious code, impersonate another person, or use the service unlawfully. Automated use must
            respect published access controls and reasonable service capacity. Access may be restricted when
            reasonably necessary to protect learners, data or service availability.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Content and intellectual property</h2>
          <p className="mt-3">
            The platform design, original explanations and QuestionWale-created materials belong to their
            respective owners and are provided for personal learning use. Official documents and third-party
            references remain the property of their publishers. Do not republish substantial portions of the
            service or remove source and ownership notices without permission.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Reports and submissions</h2>
          <p className="mt-3">
            You may submit question reports, support messages, topic requests and suggestions. Submit only
            information you are entitled to share, avoid sensitive credentials, and keep reports relevant. You
            allow QuestionWale to use the submission as needed to provide support, investigate a report and
            improve or correct the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Availability and accuracy</h2>
          <p className="mt-3">
            Features, question availability and published syllabus mappings may change. QuestionWale works to
            keep content useful but cannot promise uninterrupted availability or that every answer, explanation,
            syllabus mapping or count is error-free or permanently current. Practice scores do not guarantee an
            examination result. See the <Link href="/disclaimer" className="font-semibold text-brand hover:underline">Disclaimer</Link> and confirm official rules with the responsible exam body.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Non-affiliation, updates and contact</h2>
          <p className="mt-3">
            QuestionWale is not a government website and is not affiliated with SSC, UPSC, Railway Recruitment
            Boards or another examination authority unless explicitly stated. These terms may change as the
            product evolves; the effective date above identifies the current version. Questions can be sent
            through the <Link href="/contact" className="font-semibold text-brand hover:underline">Contact</Link> page.
          </p>
        </section>
      </div>

      <Link href="/" className="mt-10 inline-flex min-h-[44px] items-center text-sm font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2">
        Back to Home
      </Link>
    </main>
  );
}
