import type { Metadata } from 'next';
import AboutClient from './AboutClient';
import { buildPageMetadata } from '@/lib/seo';
import { getHomeData } from '@/lib/homeData';

const title = 'About Our Exam MCQ Practice Platform';
const description =
  'QuestionWale helps government exam aspirants practice topic-wise MCQs with detailed explanations in English and Hindi for UPSC, State PSC, SSC and more.';

export const metadata: Metadata = buildPageMetadata({
  title,
  description,
  path: '/about_us',
});

export const revalidate = 300;

export default async function AboutPage() {
  const { stats } = await getHomeData();

  return <AboutClient stats={stats} />;
}
