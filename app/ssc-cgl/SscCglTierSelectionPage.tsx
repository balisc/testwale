'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, FileText, Loader2, Trophy } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import {
  getSscCglPreferenceHref,
  type SscCglPreference,
  type SscCglPreferenceTier,
  type SscCglTierAvailability,
} from '@/lib/sscCglPreference';
import { SSC_CGL_STAGES } from '@/lib/sscCglSyllabus';
import SscCglPageHeader from './SscCglPageHeader';

export default function SscCglTierSelectionPage({
  persistPreference,
  tiers: availability,
  saveMode = 'create_if_missing',
}: {
  persistPreference: boolean;
  tiers: SscCglTierAvailability[];
  saveMode?: 'create_if_missing' | 'replace';
}) {
  const router = useRouter();
  const { language } = useLanguage();
  const [savingTier, setSavingTier] = useState<SscCglPreferenceTier | null>(null);
  const [saveError, setSaveError] = useState(false);
  const copy = language === 'hi'
    ? {
        title: 'SSC CGL',
        description: 'केंद्रित, टियर-वार पाठ्यक्रम और SSC स्तर के प्रश्न अभ्यास के साथ SSC CGL की तैयारी करें।',
        tier1: 'टियर 1',
        tier1Description: 'प्रथम चरण की वस्तुनिष्ठ परीक्षा, जिसमें रीजनिंग, सामान्य जागरूकता, मात्रात्मक योग्यता और अंग्रेज़ी शामिल हैं।',
        tier2: 'टियर 2',
        tier2Description: 'उन्नत परीक्षा, जिसमें योग्य अभ्यर्थियों के लिए पेपर 1 और लागू पदों के लिए पेपर 2–3 शामिल हैं।',
        choose: 'यह टियर चुनें',
        saving: 'पसंद सहेजी जा रही है…',
        saveError: 'आपकी पसंद सहेजी नहीं जा सकी। फिर कोशिश करने के लिए इसी टियर को दोबारा चुनें।',
        unavailable: 'अभी सत्यापित प्रश्न उपलब्ध नहीं हैं',
        home: 'होम',
        exams: 'परीक्षाएँ',
      }
    : {
        title: 'SSC CGL',
        description: 'Prepare for SSC CGL through a focused, tier-wise syllabus and SSC-level question practice.',
        tier1: 'Tier 1',
        tier1Description: 'The first-stage objective examination covering Reasoning, General Awareness, Quantitative Aptitude and English.',
        tier2: 'Tier 2',
        tier2Description: 'The advanced examination containing Paper 1 for qualified candidates and Papers 2–3 for applicable posts.',
        choose: 'Choose this tier',
        saving: 'Saving your preference…',
        saveError: 'We could not save your preference. Select the tier again to retry.',
        unavailable: 'No verified questions available yet',
        home: 'Home',
        exams: 'Exams',
      };
  const tiers: Array<{
    tierCode: SscCglPreferenceTier;
    href: string;
    title: string;
    description: string;
    icon: typeof Trophy;
  }> = [
    { tierCode: 'TIER_I', href: SSC_CGL_STAGES[0].href, title: copy.tier1, description: copy.tier1Description, icon: Trophy },
    { tierCode: 'TIER_II', href: SSC_CGL_STAGES[1].href, title: copy.tier2, description: copy.tier2Description, icon: FileText },
  ];

  const chooseTier = async (tierCode: SscCglPreferenceTier) => {
    if (savingTier) return;
    setSavingTier(tierCode);
    setSaveError(false);
    try {
      const response = await fetch('/api/profile/ssc-cgl-preference', {
        method: 'PUT',
        cache: 'no-store',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierCode, mode: saveMode }),
      });
      const body = (await response.json().catch(() => null)) as { preference?: SscCglPreference } | null;
      if (!response.ok || !body?.preference) throw new Error('preference_save_failed');
      router.push(getSscCglPreferenceHref(body.preference));
      router.refresh();
    } catch {
      setSaveError(true);
      setSavingTier(null);
    }
  };

  return (
    <main className="min-h-screen w-full min-w-0 bg-[#F8FAFC] px-4 py-6 text-slate-900 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-6xl">
        <SscCglPageHeader
          activeStep={1}
          breadcrumbs={[
            { label: copy.home, href: '/' },
            { label: copy.exams },
            { label: 'SSC CGL' },
          ]}
        />
        <section className="mt-6 min-w-0" aria-labelledby="ssc-cgl-tier-heading">
          <h1 id="ssc-cgl-tier-heading" className="break-words text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">{copy.title}</h1>
          <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{copy.description}</p>
          <div className="mt-7 grid min-w-0 gap-5 md:grid-cols-2">
            {tiers.map(({ tierCode, href, title, description, icon: Icon }) => {
              const busy = savingTier === tierCode;
              const tierAvailability = availability.find((item) => item.tierCode === tierCode);
              const available = tierAvailability?.isAvailable === true;
              const cardContent = (
                <>
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><Icon className="h-7 w-7" aria-hidden="true" /></span>
                  <span className="mt-5 block break-words text-2xl font-extrabold text-slate-950">{title}</span>
                  <span className="mt-2 block break-words text-left text-sm leading-6 text-slate-600">{description}</span>
                  <span className="mt-auto inline-flex min-h-11 max-w-full items-center gap-2 pt-5 text-sm font-bold text-violet-700">
                    {busy ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" /> : null}
                    <span className="break-words">{busy ? copy.saving : available ? copy.choose : copy.unavailable}</span>
                    {!busy && available ? <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-1" aria-hidden="true" /> : null}
                  </span>
                </>
              );

              return persistPreference ? (
                <button
                  key={href}
                  type="button"
                  disabled={savingTier !== null || !available}
                  aria-disabled={!available}
                  onClick={() => void chooseTier(tierCode)}
                  className="group flex min-h-56 w-full min-w-0 max-w-full flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 sm:p-7"
                >
                  {cardContent}
                </button>
              ) : available ? (
                <Link key={href} href={href} className="group flex min-h-56 w-full min-w-0 max-w-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-4 sm:p-7">
                  {cardContent}
                </Link>
              ) : (
                <div key={href} aria-disabled="true" className="group flex min-h-56 w-full min-w-0 max-w-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5 opacity-60 sm:p-7">
                  {cardContent}
                </div>
              );
            })}
          </div>
          {saveError ? <p className="mt-4 break-words rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{copy.saveError}</p> : null}
        </section>
      </div>
    </main>
  );
}
