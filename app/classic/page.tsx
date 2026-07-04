import type { Metadata } from 'next';
import HomeClientLegacy from '../HomeClientLegacy';
import { canonical } from '@/lib/seo';
import { getHomeData } from '@/lib/homeData';

export const metadata: Metadata = {
  title: 'Classic Home - QuestionWale',
  description: 'Previous QuestionWale homepage layout.',
  ...canonical('/classic'),
};

export const revalidate = 300;

export default async function ClassicHomePage({
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
    <HomeClientLegacy
      initialSiteStats={homeData.stats}
      initialSubjectCounts={homeData.subjectCounts}
      initialSuggestions={homeData.suggestions}
      initialSearchQuery={initialSearchQuery}
    />
  );
}
