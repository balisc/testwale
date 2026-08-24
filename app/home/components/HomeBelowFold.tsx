import { Suspense } from 'react';
import HomeDemo from './HomeDemo';
import HomeFeatures from './HomeFeatures';
import HomeQuality from './HomeQuality';
import HomeProgress from './HomeProgress';
import HomeHowItWorks from './HomeHowItWorks';
import HomeSignIn from './HomeSignIn';
import HomeFinalCta from './HomeFinalCta';
import HomePracticePath from './HomePracticePath';
import { getHomePolityPracticePaths } from '../lib/polityPracticePaths';
import { getGoogleClientId } from '@/lib/googleAuth';

function PracticePathFallback() {
  return (
    <section className="border-y border-[#E4E7EC] bg-[#FAFAFC] py-16" aria-hidden>
      <div className="home-container w-full">
        <div className="h-8 w-64 animate-pulse rounded bg-[#E4E7EC]" />
        <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-[#F2F4F7]" />
        <div className="mt-8 h-64 animate-pulse rounded-2xl border border-[#E4E7EC] bg-white" />
      </div>
    </section>
  );
}

async function HomePracticePathSection() {
  const tabs = await getHomePolityPracticePaths();
  return <HomePracticePath tabs={tabs} />;
}

/** Deferred supporting sections below the primary exam selector. */
export default function HomeBelowFold() {
  return (
    <>
      <HomeDemo />
      <HomeFeatures />
      <HomeQuality />
      <Suspense fallback={<PracticePathFallback />}>
        <HomePracticePathSection />
      </Suspense>
      <HomeProgress />
      <HomeHowItWorks />
      <HomeSignIn googleClientId={getGoogleClientId()} />
      <HomeFinalCta />
    </>
  );
}

