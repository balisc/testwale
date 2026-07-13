import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import HomeHero from '@/app/home/components/HomeHero';
import HomeExamStrip from '@/app/home/components/HomeExamStrip';
import HomeSubjects from '@/app/home/components/HomeSubjects';
import { canonical } from '@/lib/seo';

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

const HomeBelowFold = dynamic(() => import('@/app/home/components/HomeBelowFold'), {
  loading: () => null,
});

export default function HomePage() {
  return (
    <div className="home-page w-full min-w-0 overflow-x-clip bg-[#FAFAFC] text-[#18181B] antialiased">
      <main>
        <HomeHero />
        <HomeExamStrip />
        {/* Keep #subjects in initial HTML so cross-page scroll can target it */}
        <HomeSubjects />
        <HomeBelowFold />
      </main>
    </div>
  );
}
