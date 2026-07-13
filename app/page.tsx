import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import '@/app/bali/bali.css';
import BaliHero from '@/app/bali/components/BaliHero';
import BaliExamStrip from '@/app/bali/components/BaliExamStrip';
import BaliSubjects from '@/app/bali/components/BaliSubjects';
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

const BaliBelowFold = dynamic(() => import('@/app/bali/components/BaliBelowFold'), {
  loading: () => null,
});

export default function HomePage() {
  return (
    <div className="bali-page w-full min-w-0 overflow-x-clip bg-[#FAFAFC] text-[#18181B] antialiased">
      <main>
        <BaliHero />
        <BaliExamStrip />
        {/* Keep #subjects in initial HTML so cross-page scroll can target it */}
        <BaliSubjects />
        <BaliBelowFold />
      </main>
    </div>
  );
}
