import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import HomeHeroSection from '@/app/components/HomeHeroSection';
import { canonical } from '@/lib/seo';
import { getHomeData } from '@/lib/homeData';
import { getServerLang } from '@/lib/serverLang';

const title = 'QuestionWale - Practice Smarter. Score Higher.';
const description =
  'Master every topic with bilingual MCQs, clear explanations and focused practice for competitive exams on QuestionWale.';

export const metadata: Metadata = {
  title,
  description,
  ...canonical('/'),
  openGraph: {
    title,
    description,
    url: '/',
    type: 'website',
    siteName: 'QuestionWale',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

export const revalidate = 300;

export default async function HomePage() {
  const [homeData, lang] = await Promise.all([getHomeData(), getServerLang()]);

  return (
    <>
      <HomeHeroSection lang={lang} initialSuggestions={homeData.suggestions} />
      <HomeClient initialSubjectCounts={homeData.subjectCounts} />
    </>
  );
}
