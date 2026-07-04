import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Disclaimer',
  description: 'Disclaimer for QuestionWale — educational use, accuracy limits, and third-party content.',
  path: '/disclaimer',
});

export default function DisclaimerPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 md:px-6 md:py-20">
      <h1 className="text-3xl font-bold text-[#0F172A]">Disclaimer</h1>
      <p className="mt-4 text-slate-600 leading-relaxed">
        QuestionWale provides MCQ practice content for educational and exam-preparation purposes only. While
        we strive for accuracy, questions, answers, and explanations may contain errors or become outdated as
        syllabus and exam patterns change.
      </p>
      <p className="mt-4 text-slate-600 leading-relaxed">
        QuestionWale is not affiliated with UPSC, SSC, Railway Recruitment Boards, or any government
        examination authority unless explicitly stated. Official notifications and syllabus should always be
        verified from the respective exam body.
      </p>
      <p className="mt-4 text-slate-600 leading-relaxed">
        Use of this platform is at your own discretion. QuestionWale is not liable for outcomes based solely
        on practice scores or content on this site.
      </p>
      <Link
        href="/subjects"
        className="mt-8 inline-flex min-h-[44px] items-center text-sm font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2"
      >
        Browse Subjects
      </Link>
    </main>
  );
}
