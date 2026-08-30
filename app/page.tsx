import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import '@/app/home/home.css';
import HomeHero from '@/app/home/components/HomeHero';
import PublicExamExplorer from '@/app/home/components/PublicExamExplorer';
import HomeSubjects from '@/app/home/components/HomeSubjects';
import JsonLd from '@/components/JsonLd';
import {
  absoluteUrl,
  BASE_URL,
  canonical,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
} from '@/lib/seo';
import { getHomeData } from '@/lib/homeData';
import { getPublicExamSelectorOptions } from '@/lib/publicExamExplorer';

const title = 'Government Exam MCQ Practice in Hindi & English';
const description =
  'Practice source-verified bilingual MCQs for SSC, Railway, UPSC and State Exams with topic-wise quizzes, progress tracking and explanations where available.';
const ogImage = absoluteUrl(DEFAULT_OG_IMAGE);

const homepageStructuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: BASE_URL,
    logo: absoluteUrl('/logo/questionwale_logo.webp'),
    description: DEFAULT_DESCRIPTION,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
  },
];

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
  const [homeData, publicExamOptions] = await Promise.all([
    getHomeData(),
    getPublicExamSelectorOptions(),
  ]);
  return (
    <div className="home-page w-full min-w-0 overflow-x-clip bg-[#FAFAFC] text-[#18181B] antialiased">
      <JsonLd data={homepageStructuredData} />
      <main>
        <HomeHero totalQuestions={homeData.stats.questions} />
        <PublicExamExplorer options={publicExamOptions} />
        <HomeSubjects subjectCounts={homeData.subjectCounts} />
        <HomeBelowFold />
      </main>
    </div>
  );
}
