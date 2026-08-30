import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Privacy Policy',
  description: 'How QuestionWale handles account, practice, support, cookie and security data.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-14 md:px-6 md:py-20">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">Privacy Policy</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          This policy describes the categories of information QuestionWale handles to operate its bilingual
          MCQ practice, account and support features. It is a factual product disclosure, not legal advice.
        </p>
        <p className="mt-3 text-sm text-slate-500">Effective and last updated: 29 August 2026</p>
      </header>

      <div className="mt-10 space-y-9 text-sm leading-7 text-slate-600">
        <section>
          <h2 className="text-xl font-bold text-slate-950">Information you provide</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li><strong>Account data:</strong> name, email address, authentication provider, and profile image when supplied. Email accounts use a securely hashed password; Google sign-in supplies the basic account details you approve in that flow.</li>
            <li><strong>Profile and preparation choices:</strong> profile details, language, target exam, stage or tier preferences and study settings you choose.</li>
            <li><strong>Contact and support submissions:</strong> full name, email, mobile number, subject, optional issue category and message.</li>
            <li><strong>Learner content:</strong> notes, bookmarks, question reports and other feedback you intentionally submit.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Practice and technical data</h2>
          <p className="mt-3">
            When account features are used, QuestionWale records attempts, selected answers, correctness,
            time spent, progress, retry/history state and related learning summaries. Essential cookies are
            used for app sessions, OAuth hand-off and language preference. Security controls may process
            request details and keyed, non-plain-text rate-limit identifiers to prevent abuse and protect accounts.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Why the information is used</h2>
          <p className="mt-3">
            The information supports authentication, saved progress, personalized exam navigation, notes and
            bookmarks, support responses, question corrections, reliability, fraud and abuse prevention, and
            improvement of the service. QuestionWale does not sell personal information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Service providers</h2>
          <p className="mt-3">
            QuestionWale relies on infrastructure providers for hosting and database services. Google processes
            information when you choose Google sign-in. These providers receive only the information needed for
            their role and operate under their own terms and privacy practices. Private credentials and internal
            vendor configuration are never disclosed on this page.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Retention and requests</h2>
          <p className="mt-3">
            Account and practice information is retained while needed to provide account features and maintain
            learning history. Support submissions are retained while needed to respond, review issues and protect
            the service. Some records may need to remain for security, integrity or applicable obligations. The
            product does not currently expose a self-service deletion control; use the Contact page to request
            access, correction or account/data deletion review.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-950">Contact and policy changes</h2>
          <p className="mt-3">
            For privacy or account requests, use the{' '}
            <Link href="/contact" className="font-semibold text-brand hover:underline">Contact</Link>{' '}
            page and choose “Account Issue” or describe the request. This policy may be updated when product
            features or data handling change; the date above identifies the current version.
          </p>
        </section>
      </div>

      <Link href="/" className="mt-10 inline-flex min-h-[44px] items-center text-sm font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2">
        Back to Home
      </Link>
    </main>
  );
}
