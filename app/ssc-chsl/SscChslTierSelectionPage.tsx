'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, FileText, Loader2, Trophy } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import {
  SSC_CHSL_STAGES,
  getSscChslPreferenceHref,
  type SscChslStageAvailability,
  type SscChslStageCode,
} from '@/lib/sscChsl';
import type { SavedExamPreference } from '@/lib/examPreference';
import SscCglPageHeader from '@/app/ssc-cgl/SscCglPageHeader';
import { pickCatalogText } from '@/lib/useCatalogText';

export default function SscChslTierSelectionPage({
  stages: availability,
}: {
  stages: SscChslStageAvailability[];
}) {
  const router = useRouter();
  const { language } = useLanguage();
  const [savingStage, setSavingStage] = useState<SscChslStageCode | null>(null);
  const [saveError, setSaveError] = useState(false);
  const copy = language === 'hi'
    ? {
        description: 'SSC CHSL की तैयारी टियर-वार पाठ्यक्रम और सत्यापित परीक्षा-स्तर के प्रश्नों के साथ करें।',
        choose: 'यह टियर चुनें',
        saving: 'पसंद सहेजी जा रही है…',
        saveError: 'आपकी पसंद सहेजी नहीं जा सकी। दोबारा कोशिश करने के लिए टियर फिर चुनें।',
        unavailable: 'सत्यापित प्रश्न अभी उपलब्ध नहीं हैं',
        home: 'होम',
        exams: 'परीक्षाएँ',
        questions: 'सत्यापित प्रश्न',
      }
    : {
        description: 'Prepare for SSC CHSL through a tier-wise syllabus and verified exam-level questions.',
        choose: 'Choose this tier',
        saving: 'Saving your preference…',
        saveError: 'We could not save your preference. Select the tier again to retry.',
        unavailable: 'Verified questions are not available yet',
        home: 'Home',
        exams: 'Exams',
        questions: 'verified questions',
      };

  const chooseStage = async (stageCode: SscChslStageCode) => {
    if (savingStage) return;
    setSavingStage(stageCode);
    setSaveError(false);
    try {
      const response = await fetch('/api/profile/ssc-chsl-preference', {
        method: 'PUT',
        cache: 'no-store',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageCode }),
      });
      const body = await response.json().catch(() => null) as {
        preference?: SavedExamPreference;
      } | null;
      if (!response.ok || !body?.preference) throw new Error('preference_save_failed');
      router.push(getSscChslPreferenceHref(body.preference));
      router.refresh();
    } catch {
      setSaveError(true);
      setSavingStage(null);
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
            { label: 'SSC CHSL' },
          ]}
        />
        <section className="mt-6 min-w-0" aria-labelledby="ssc-chsl-tier-heading">
          <h1 id="ssc-chsl-tier-heading" className="break-words text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">SSC CHSL</h1>
          <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{copy.description}</p>
          <div className="mt-7 grid min-w-0 gap-5 md:grid-cols-2">
            {SSC_CHSL_STAGES.map((stage, index) => {
              const Icon = index === 0 ? Trophy : FileText;
              const stageAvailability = availability.find((item) => item.stageCode === stage.code);
              const available = stageAvailability?.isAvailable === true;
              const busy = savingStage === stage.code;
              return (
                <button
                  key={stage.code}
                  type="button"
                  disabled={!available || Boolean(savingStage)}
                  onClick={() => void chooseStage(stage.code)}
                  className="group flex min-h-72 w-full min-w-0 flex-col items-start rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition enabled:hover:-translate-y-0.5 enabled:hover:border-violet-400 enabled:hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-65 sm:p-6"
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><Icon className="h-7 w-7" aria-hidden="true" /></span>
                  <span className="mt-5 block break-words text-2xl font-extrabold text-slate-950">{pickCatalogText(stage.label, language)}</span>
                  <span className="mt-2 block break-words text-sm leading-6 text-slate-600">{pickCatalogText(stage.description, language)}</span>
                  {stageAvailability?.verifiedQuestionCount ? (
                    <span className="mt-3 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                      {stageAvailability.verifiedQuestionCount} {copy.questions}
                    </span>
                  ) : null}
                  <span className="mt-auto inline-flex min-h-11 max-w-full items-center gap-2 pt-5 text-sm font-bold text-violet-700">
                    {busy ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" /> : null}
                    <span className="break-words">{busy ? copy.saving : available ? copy.choose : copy.unavailable}</span>
                    {!busy && available ? <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-1" aria-hidden="true" /> : null}
                  </span>
                </button>
              );
            })}
          </div>
          {saveError ? <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700" role="alert">{copy.saveError}</p> : null}
        </section>
      </div>
    </main>
  );
}
