
import Link from 'next/link';
import HomeSubjectCard, {
  HistoryIcon,
  MoreSubjectsIcons,
  PolityIcon,
} from './HomeSubjectCard';
import { contentCanStartPractice, derivePublicContentStatus } from '@/lib/contentStatus';
import { getSubjectPageHref } from '@/lib/subjectRoutes';

export default function HomeSubjects({
  subjectCounts,
}: {
  subjectCounts: Record<string, number>;
}) {
  const polityQuestionCount = Math.max(0, Number(subjectCounts.polity ?? 0));
  const polityStatus = derivePublicContentStatus({
    isActive: true,
    questionCount: polityQuestionCount,
  });
  const polityIsActive = contentCanStartPractice(polityStatus);
  const historyQuestionCount = Math.max(0, Number(subjectCounts.history ?? 0));
  const historyStatus = derivePublicContentStatus({
    isActive: true,
    questionCount: historyQuestionCount,
  });
  const historyIsActive = contentCanStartPractice(historyStatus);
  const otherActiveCount = Object.entries(subjectCounts).filter(
    ([key, count]) => key !== 'polity' && key !== 'history' && Number(count) > 0,
  ).length;

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
            state={polityIsActive ? 'active' : 'comingSoon'}
            title="Indian Polity"
            description="Constitution, governance, Parliament, judiciary and public institutions."
            icon={<PolityIcon />}
            badge={polityIsActive ? 'Active' : 'Coming Soon'}
            meta={[
              polityIsActive
                ? `${new Intl.NumberFormat('en-IN').format(polityQuestionCount)} Published Questions`
                : 'No published questions yet',
              'Topic-wise',
              'हिंदी + English',
            ]}
            href={polityIsActive ? getSubjectPageHref('polity') : undefined}
            ctaLabel={polityIsActive ? 'Start Practice' : 'Coming Soon'}
            showProgress={false}
            progressPercent={0}
            progressLabel={undefined}
          />

          <HomeSubjectCard
            state={historyIsActive ? 'active' : 'comingSoon'}
            title="Indian History"
            description="Ancient, medieval and modern Indian history for competitive examinations."
            icon={<HistoryIcon />}
            badge={historyIsActive ? 'Active' : 'Coming Soon'}
            meta={[
              historyIsActive
                ? `${new Intl.NumberFormat('en-IN').format(historyQuestionCount)} Published Questions`
                : 'No published questions yet',
              'Topic-wise',
              'हिंदी + English',
            ]}
            href={historyIsActive ? getSubjectPageHref('history') : undefined}
            ctaLabel={historyIsActive ? 'Start Practice' : 'Coming Soon'}
          />

          <HomeSubjectCard
            state="more"
            title={otherActiveCount > 0 ? 'Explore All Subjects' : 'More Subjects Coming Soon'}
            description={otherActiveCount > 0
              ? `${otherActiveCount} more published subjects are ready to explore.`
              : 'Geography, Economics, Science, Reasoning and more are being prepared.'}
            icon={<MoreSubjectsIcons />}
            href="/subjects"
            ctaLabel={otherActiveCount > 0 ? 'View Published Subjects' : 'Explore Upcoming Subjects'}
          />
        </div>
      </div>

    </section>
  );
}
