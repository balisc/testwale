import { Suspense } from 'react';
import BaliDemo from './BaliDemo';
import BaliFeatures from './BaliFeatures';
import BaliQuality from './BaliQuality';
import BaliProgress from './BaliProgress';
import BaliHowItWorks from './BaliHowItWorks';
import BaliSignIn from './BaliSignIn';
import BaliFinalCta from './BaliFinalCta';
import BaliPracticePath from './BaliPracticePath';
import { getBaliPolityPracticePaths } from '../lib/polityPracticePaths';
import { getGoogleClientId } from '@/lib/googleAuth';

function PracticePathFallback() {
  return (
    <section className="border-y border-[#E4E7EC] bg-[#FAFAFC] py-16" aria-hidden>
      <div className="bali-container w-full">
        <div className="h-8 w-64 animate-pulse rounded bg-[#E4E7EC]" />
        <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-[#F2F4F7]" />
        <div className="mt-8 h-64 animate-pulse rounded-2xl border border-[#E4E7EC] bg-white" />
      </div>
    </section>
  );
}

async function BaliPracticePathSection() {
  const tabs = await getBaliPolityPracticePaths();
  return <BaliPracticePath tabs={tabs} />;
}

/** Deferred below-fold homepage sections (subjects stays on the main page). */
export default function BaliBelowFold() {
  return (
    <>
      <BaliDemo />
      <BaliFeatures />
      <BaliQuality />
      <Suspense fallback={<PracticePathFallback />}>
        <BaliPracticePathSection />
      </Suspense>
      <BaliProgress />
      <BaliHowItWorks />
      <BaliSignIn googleClientId={getGoogleClientId()} />
      <BaliFinalCta />
    </>
  );
}

