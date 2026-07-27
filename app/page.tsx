import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import '@/app/home/home.css';
import HomeHero from '@/app/home/components/HomeHero';
import HomeExamStrip from '@/app/home/components/HomeExamStrip';
import HomeSubjects from '@/app/home/components/HomeSubjects';
import { getHomeData } from '@/lib/homeData';
import { absoluteUrl, canonical, DEFAULT_OG_IMAGE } from '@/lib/seo';

const title = 'Government Exam MCQ Practice in Hindi & English';
const description =
  'Practice source-verified bilingual MCQs for SSC, Railway, UPSC and State Exams with clear explanations, topic-wise quizzes and progress tracking.';
const ogImage = absoluteUrl(DEFAULT_OG_IMAGE);

export const metadata: Metadata = {
  title,
  description,
  ...canonical('/'),
  openGraph: {
    title,
    description,
    url: absoluteUrl('/'),
    type: 'website',
    siteName: 'QuestionWale',
    images: [{ url: ogImage, width: 1200, height: 630, alt: 'QuestionWale — Government exam MCQ practice' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [ogImage],
  },
};

export const revalidate = 300;

const HomeBelowFold = dynamic(() => import('@/app/home/components/HomeBelowFold'), {
  loading: () => null,
});

export default async function HomePage() {
  const homeData = await getHomeData();

  return (
    <div className="home-page w-full min-w-0 overflow-x-clip bg-[#FAFAFC] text-[#18181B] antialiased">
      <main>
        <HomeHero totalQuestions={homeData.stats.questions} />
        <HomeExamStrip />
        {/* Keep #subjects in initial HTML so cross-page scroll can target it */}
        <HomeSubjects subjectCounts={homeData.subjectCounts} />
        <HomeBelowFold />
      </main>
    </div>
  );
}
