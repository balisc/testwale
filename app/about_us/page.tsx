import type { Metadata } from 'next';
import AboutClient from './AboutClient';
import { canonical } from '@/lib/seo';
import { getHomeData } from '@/lib/homeData';

const title = 'About QuestionWale - Exam MCQ Practice Platform';
const description =
  'QuestionWale helps government exam aspirants practice topic-wise MCQs with detailed explanations in English and Hindi for UPSC, State PSC, SSC and more.';

export const metadata: Metadata = {
  title,
  description,
  ...canonical('/about_us'),
  openGraph: {
    title,
    description,
    url: '/about_us',
    type: 'website',
    siteName: 'Questionwale',
  },
  twitter: { card: 'summary_large_image', title, description },
};

export const revalidate = 300;

export default async function AboutPage() {
  const { stats } = await getHomeData();

  return <AboutClient stats={stats} />;
}
