'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import ModalPortal from '@/components/ModalPortal';
import HomeSubjectCard, {
  HistoryIcon,
  MoreSubjectsIcons,
  PolityIcon,
} from './HomeSubjectCard';

export default function HomeSubjects({
  subjectCounts,
}: {
  subjectCounts: Record<string, number>;
}) {
  const { user } = useAuth();
  const [notifyOpen, setNotifyOpen] = useState(false);
  const titleId = useId();
  const signedIn = Boolean(user);
  const polityQuestionCount = Math.max(0, Number(subjectCounts.polity ?? 0));
  const polityQuestionLabel = polityQuestionCount > 0
    ? `${new Intl.NumberFormat('en-IN').format(polityQuestionCount)} Questions`
    : 'Verified Questions';

  return (
    <section id="subjects" className="bg-[#FAFAFC] py-16 sm:py-20 max-[479px]:py-10">
      <div className="home-container w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-[28px] font-bold tracking-tight text-[#18181B] sm:text-[36px] sm:leading-[44px] max-[479px]:text-2xl">
              Choose Your Subject
            </h2>
            <p className="mt-2 text-base text-[#667085] max-[479px]:text-sm">
              Start with a subject and progress topic by topic.
            </p>
          </div>
          <Link
            href="/subjects"
            className="text-[15px] font-semibold text-[#6D28D9] transition hover:text-[#5B21B6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9] focus-visible:ring-offset-2"
          >
            View All Subjects →
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
          <HomeSubjectCard
            state="active"
            title="Indian Polity"
            description="Constitution, governance, Parliament, judiciary and public institutions."
            icon={<PolityIcon />}
            badge="Active"
            meta={[polityQuestionLabel, '18 Topics', 'हिंदी + English']}
            href="/subjects/indian-polity"
            ctaLabel={signedIn ? 'Continue Practice' : 'Start Practice'}
            showProgress={false}
            progressPercent={0}
            progressLabel={undefined}
          />

          <HomeSubjectCard
            state="comingSoon"
            title="Indian History"
            description="Ancient, medieval and modern Indian history for competitive examinations."
            icon={<HistoryIcon />}
            badge="Coming Soon"
            meta={['3 Eras', 'Topic-wise', 'हिंदी + English']}
            ctaLabel="Notify Me"
            ctaIcon="bell"
            onAction={() => setNotifyOpen(true)}
          />

          <HomeSubjectCard
            state="more"
            title="More Subjects Coming Soon"
            description="Geography, Economics, Science, Reasoning and more are being prepared."
            icon={<MoreSubjectsIcons />}
            href="/subjects"
            ctaLabel="Explore Upcoming Subjects"
          />
        </div>
      </div>

      <ModalPortal
        open={notifyOpen}
        onClose={() => setNotifyOpen(false)}
        labelledBy={titleId}
        zClassName="z-[80]"
        panelClassName="max-w-md rounded-2xl border border-[#E4E7EC] bg-white p-4 shadow-xl min-[360px]:p-6"
      >
        <h3 id={titleId} className="text-lg font-bold text-[#18181B]">
          Get notified for Indian History
        </h3>
        <p className="mt-2 text-sm leading-6 text-[#667085]">
          We&apos;ll let you know when topic-wise bilingual History MCQs are ready to practise.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setNotifyOpen(false)}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E4E7EC] px-4 text-[15px] font-semibold text-[#344054] transition hover:bg-[#FAFAFC]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => setNotifyOpen(false)}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#6D28D9] px-4 text-[15px] font-semibold text-white transition hover:bg-[#5B21B6]"
          >
            Notify Me
          </button>
        </div>
      </ModalPortal>
    </section>
  );
}
