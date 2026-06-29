import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import { canonical } from '@/lib/seo';
import { getHomeData } from '@/lib/homeData';

const title = 'Questionwale - MCQ Practice for Competitive Exams';
const description = 'Practice UPSC, PSC, history, polity, geography, economics, science, math, reasoning, and current affairs MCQs with topic-wise quizzes on Questionwale.';

export const metadata: Metadata = {
  title,
  description,
  ...canonical('/'),
  openGraph: {
    title,
    description,
    url: '/',
    type: 'website',
    siteName: 'Questionwale',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export const revalidate = 300;

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string | string[] }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const homeData = await getHomeData();
  const initialSearchQuery = Array.isArray(resolvedSearchParams.search)
    ? resolvedSearchParams.search[0]
    : resolvedSearchParams.search;

  return (
    <HomeClient
      initialSiteStats={homeData.stats}
      initialSubjectCounts={homeData.subjectCounts}
      initialSuggestions={homeData.suggestions}
      initialSearchQuery={initialSearchQuery}
    />
  );
}
