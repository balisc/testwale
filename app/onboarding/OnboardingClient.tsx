'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  Loader2,
  LogOut,
  Search,
  Target,
} from 'lucide-react';
import QuestionWaleLogoMark from '@/components/QuestionWaleLogoMark';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import {
  canSaveExamOnboarding,
  minFutureExamDateInput,
} from '@/lib/examOnboarding';
import {
  ALL_EXAM_FAMILIES,
  examOptionFamily,
  filterExamSelectorOptions,
  friendlyAvailabilityMessage,
  isExamOptionSelectable,
  examOptionDisplayTitle,
  listExamFamilies,
  type ExamSelectorOption,
} from '@/lib/examSelector';
import { getSafeRedirectPath } from '@/lib/safeRedirect';
import { clearClientCache } from '@/lib/clientRequestCache';
import {
  SSC_CGL_EXAM_CODE,
  type SscCglPreferenceTier,
} from '@/lib/sscCglPreference';
import {
  getExamPreferenceHref,
  isTrackSelectable,
  type ExamPreparationTrack,
  type PreparationMode,
  type SavedExamPreference,
} from '@/lib/examPreference';

type Payload = {
  state: {
    targetExamProfileId: string | null;
    targetExamDate: string | null;
    targetExamProfile: ExamSelectorOption | null;
  };
  options: ExamSelectorOption[];
  savedPreference: SavedExamPreference | null;
  preferenceStatus: 'ready' | 'missing' | 'invalid' | 'error';
  preferenceError: string | null;
};

const COPY = {
  en: {
    brandSub: 'Your smarter exam-prep companion',
    step: (value: number, total: number) => `Step ${value} of ${total}`,
    examTitle: 'Choose your target exam',
    examTitleAlt: 'अपनी लक्ष्य परीक्षा चुनें',
    examSubtitle: 'Search the live exam catalogue and choose the exam you are preparing for.',
    examSubtitleAlt: 'लाइव परीक्षा सूची में खोजें और अपनी तैयारी की परीक्षा चुनें।',
    search: 'Search by exam code, English or Hindi name…',
    all: 'All exams',
    available: 'Available',
    availableAlt: 'उपलब्ध',
    comingSoon: 'Coming soon',
    comingSoonAlt: 'जल्द उपलब्ध',
    noMatch: 'No exams match this search.',
    activationTitle: 'Exam preparation options are being activated',
    activationBody:
      'You can explore the complete catalogue now. Selection will automatically become available as each exam is activated.',
    activationAlt: 'परीक्षा तैयारी विकल्प सक्रिय किए जा रहे हैं। सक्रिय होते ही चयन अपने-आप उपलब्ध हो जाएगा।',
    continue: 'Continue',
    continueAlt: 'आगे बढ़ें',
    dateTitle: 'Choose your target date',
    dateTitleAlt: 'अपनी लक्ष्य तिथि चुनें',
    dateSubtitle: 'Set a future exam date for your selected exam.',
    dateSubtitleAlt: 'चुनी हुई परीक्षा के लिए भविष्य की तारीख निर्धारित करें।',
    dateLabel: 'Target exam date / लक्ष्य परीक्षा तिथि',
    dateHint: 'Choose a valid date after today. / आज के बाद की मान्य तारीख चुनें।',
    back: 'Back / वापस',
    complete: 'Complete setup',
    completeAlt: 'सेटअप पूरा करें',
    saving: 'Saving… / सहेजा जा रहा है…',
    success: 'Exam goal saved. / परीक्षा लक्ष्य सहेजा गया।',
    loadError: 'We could not load the exam catalogue. / परीक्षा सूची लोड नहीं हो सकी।',
    retry: 'Try again / फिर प्रयास करें',
    logout: 'Log out / लॉग आउट',
    invalidExam: 'Choose an available exam to continue. / आगे बढ़ने के लिए उपलब्ध परीक्षा चुनें।',
    invalidDate: 'Choose a valid future date. / भविष्य की मान्य तारीख चुनें।',
    disabledExam: 'This exam is not available yet. / यह परीक्षा अभी उपलब्ध नहीं है।',
    saveError: 'We could not save your exam goal. Please try again. / लक्ष्य सहेजा नहीं जा सका।',
    family: 'Content family',
    current: 'Current exam / वर्तमान परीक्षा',
    tierTitle: 'Choose your SSC CGL Tier',
    tierSubtitle: 'This preference will be saved to your profile and can be changed later.',
    tier1: 'Tier 1',
    tier1Hint: 'First-stage objective exam',
    tier2: 'Tier 2',
    tier2Hint: 'Advanced stage, starting with Paper 1',
    invalidTier: 'Choose Tier 1 or Tier 2 to continue.',
    unavailableTier: 'No verified questions are available for this Tier yet.',
    trackTitle: 'Choose your preparation scope',
    trackSubtitle: 'Only stages with exact active and verified questions are available.',
    trackLoadError: 'We could not load preparation stages. Please retry.',
    retryTracks: 'Retry stages',
    noTracks: 'No verified preparation stage is available for this exam.',
    paperTitle: 'Choose a Tier II paper',
    objectiveMode: 'MCQ / Objective',
    writtenMode: 'Written / Descriptive',
    writtenSoon: 'Coming soon — the current question model supports MCQs only.',
    preferenceWarning: 'Your saved preference could not be checked. You can still choose an exam and retry its stages.',
    subjects: 'Subjects', topics: 'Topics', subtopics: 'Subtopics', questions: 'Verified questions',
    conductedBy: 'Conducted by',
  },
  hi: {
    brandSub: 'आपकी बेहतर परीक्षा तैयारी का साथी',
    step: (value: number, total: number) => `चरण ${value} / ${total}`,
    examTitle: 'अपनी लक्ष्य परीक्षा चुनें',
    examTitleAlt: 'Choose your target exam',
    examSubtitle: 'लाइव परीक्षा सूची में खोजें और अपनी तैयारी की परीक्षा चुनें।',
    examSubtitleAlt: 'Search the live exam catalogue and choose the exam you are preparing for.',
    search: 'परीक्षा कोड, अंग्रेज़ी या हिंदी नाम से खोजें…',
    all: 'सभी परीक्षाएँ',
    available: 'उपलब्ध',
    availableAlt: 'Available',
    comingSoon: 'जल्द उपलब्ध',
    comingSoonAlt: 'Coming soon',
    noMatch: 'इस खोज से कोई परीक्षा नहीं मिली।',
    activationTitle: 'परीक्षा तैयारी विकल्प सक्रिय किए जा रहे हैं',
    activationBody:
      'आप अभी पूरी सूची देख सकते हैं। हर परीक्षा सक्रिय होते ही उसका चयन अपने-आप उपलब्ध हो जाएगा।',
    activationAlt: 'Exam selection will become available automatically as preparation options are activated.',
    continue: 'आगे बढ़ें',
    continueAlt: 'Continue',
    dateTitle: 'अपनी लक्ष्य तिथि चुनें',
    dateTitleAlt: 'Choose your target date',
    dateSubtitle: 'चुनी हुई परीक्षा के लिए भविष्य की तारीख निर्धारित करें।',
    dateSubtitleAlt: 'Set a future exam date for your selected exam.',
    dateLabel: 'लक्ष्य परीक्षा तिथि / Target exam date',
    dateHint: 'आज के बाद की मान्य तारीख चुनें। / Choose a valid date after today.',
    back: 'वापस / Back',
    complete: 'सेटअप पूरा करें',
    completeAlt: 'Complete setup',
    saving: 'सहेजा जा रहा है… / Saving…',
    success: 'परीक्षा लक्ष्य सहेजा गया। / Exam goal saved.',
    loadError: 'परीक्षा सूची लोड नहीं हो सकी। / We could not load the exam catalogue.',
    retry: 'फिर प्रयास करें / Try again',
    logout: 'लॉग आउट / Log out',
    invalidExam: 'आगे बढ़ने के लिए उपलब्ध परीक्षा चुनें। / Choose an available exam.',
    invalidDate: 'भविष्य की मान्य तारीख चुनें। / Choose a valid future date.',
    disabledExam: 'यह परीक्षा अभी उपलब्ध नहीं है। / This exam is not available yet.',
    saveError: 'लक्ष्य सहेजा नहीं जा सका। फिर प्रयास करें। / Could not save your goal.',
    family: 'सामग्री समूह',
    current: 'वर्तमान परीक्षा / Current exam',
    tierTitle: 'अपना SSC CGL Tier चुनें',
    tierSubtitle: 'यह पसंद आपकी प्रोफ़ाइल में सेव होगी और बाद में बदली जा सकती है।',
    tier1: 'Tier 1',
    tier1Hint: 'प्रथम चरण की वस्तुनिष्ठ परीक्षा',
    tier2: 'Tier 2',
    tier2Hint: 'Paper 1 से शुरू होने वाला उन्नत चरण',
    invalidTier: 'आगे बढ़ने के लिए Tier 1 या Tier 2 चुनें।',
    unavailableTier: 'इस Tier के सत्यापित प्रश्न अभी उपलब्ध नहीं हैं।',
    trackTitle: 'अपना तैयारी चरण चुनें',
    trackSubtitle: 'केवल सत्यापित प्रश्नों वाले चरण उपलब्ध हैं।',
    trackLoadError: 'तैयारी चरण लोड नहीं हो सके। फिर प्रयास करें।',
    retryTracks: 'चरण फिर लोड करें',
    noTracks: 'इस परीक्षा का कोई सत्यापित तैयारी चरण उपलब्ध नहीं है।',
    paperTitle: 'Tier II पेपर चुनें',
    objectiveMode: 'MCQ / वस्तुनिष्ठ',
    writtenMode: 'लिखित / वर्णनात्मक',
    writtenSoon: 'जल्द उपलब्ध — अभी केवल MCQ मॉडल उपलब्ध है।',
    preferenceWarning: 'सेव पसंद की जाँच नहीं हो सकी। परीक्षा चुनकर चरण फिर लोड करें।',
    subjects: 'विषय', topics: 'टॉपिक', subtopics: 'उप-विषय', questions: 'सत्यापित प्रश्न',
    conductedBy: 'आयोजक',
  },
} as const;

function familyLabel(value: string): string {
  if (value === 'OTHER') return 'Other / अन्य';
  return value.replaceAll('_', ' ');
}

function OnboardingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8F7FF] px-4 py-8" aria-busy="true" aria-label="Loading exams">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="h-12 w-56 rounded-2xl bg-purple-100" />
        <div className="mt-10 rounded-3xl border border-purple-100 bg-white p-6 sm:p-10">
          <div className="mx-auto h-8 max-w-lg rounded-xl bg-slate-100" />
          <div className="mx-auto mt-4 h-5 max-w-2xl rounded-lg bg-slate-100" />
          <div className="mt-8 h-12 rounded-2xl bg-slate-100" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-44 rounded-2xl bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingClient() {
  const { language, toggleLanguage } = useLanguage();
  const { logout } = useAuth();
  const c = COPY[language];
  const router = useRouter();
  const searchParams = useSearchParams();
  const editMode = searchParams.get('edit') === '1';
  const requestedReturnTo = searchParams.get('returnTo') ?? searchParams.get('redirect');

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [options, setOptions] = useState<ExamSelectorOption[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<SscCglPreferenceTier | null>(null);
  const [selectedStageCode, setSelectedStageCode] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<PreparationMode>('MCQ');
  const [tracks, setTracks] = useState<ExamPreparationTrack[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [tracksFailed, setTracksFailed] = useState(false);
  const [preferenceWarning, setPreferenceWarning] = useState(false);
  const [initialProfileId, setInitialProfileId] = useState<string | null>(null);
  const [examDate, setExamDate] = useState('');
  const [query, setQuery] = useState('');
  const [family, setFamily] = useState(ALL_EXAM_FAMILIES);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const response = await fetch('/api/onboarding/exam', {
        cache: 'no-store',
        credentials: 'include',
      });
      if (response.status === 401) {
        const destination = `/onboarding${window.location.search}`;
        router.replace(`/login?redirect=${encodeURIComponent(destination)}`);
        return;
      }
      if (!response.ok) throw new Error('load_failed');
      const payload = (await response.json()) as Payload;
      const nextOptions = Array.isArray(payload.options)
        ? payload.options.filter(isExamOptionSelectable)
        : [];
      setOptions(nextOptions);
      setSelectedProfileId(payload.state.targetExamProfileId);
      setInitialProfileId(payload.state.targetExamProfileId);
      setExamDate(payload.state.targetExamDate ?? '');
      setSelectedTier(payload.savedPreference?.tierCode ?? null);
      setSelectedStageCode(payload.savedPreference?.stageCode ?? null);
      setSelectedMode(payload.savedPreference?.preparationMode ?? 'MCQ');
      setPreferenceWarning(payload.preferenceStatus === 'error');
      if (payload.savedPreference && !editMode) {
        router.replace(getExamPreferenceHref(payload.savedPreference));
        return;
      }
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [editMode, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const families = useMemo(() => listExamFamilies(options), [options]);
  const filteredOptions = useMemo(
    () => filterExamSelectorOptions(options, query, family),
    [family, options, query],
  );
  const selectedOption =
    options.find((option) => option.exam_profile_id === selectedProfileId) ?? null;
  const selectableCount = options.filter(isExamOptionSelectable).length;
  const requiresCglTier = selectedOption?.exam_code === SSC_CGL_EXAM_CODE;
  const canContinue = selectedOption ? isExamOptionSelectable(selectedOption) : false;
  const totalSteps = 3;
  const displayStep = step;
  const availableTracks = tracks.filter(isTrackSelectable);
  const selectedTrack = availableTracks.find((track) => (
    track.stageCode === selectedStageCode
      && track.tierCode === selectedTier
      && track.preparationMode === selectedMode
  )) ?? null;
  const changesExistingExamOnly = editMode
    && Boolean(initialProfileId)
    && selectedOption?.exam_profile_id === initialProfileId;

  const chooseExam = (option: ExamSelectorOption) => {
    if (!isExamOptionSelectable(option)) {
      setError(c.disabledExam);
      return;
    }
    setSelectedProfileId(option.exam_profile_id);
    if (option.exam_profile_id !== initialProfileId) {
      setExamDate('');
      setSelectedTier(null);
      setSelectedStageCode(null);
      setSelectedMode('MCQ');
    }
    setTracks([]);
    setTracksFailed(false);
    setError(null);
  };

  const loadTracks = async (examProfileId: string): Promise<ExamPreparationTrack[] | null> => {
    setTracksLoading(true);
    setTracksFailed(false);
    try {
      const response = await fetch(
        `/api/onboarding/tracks?examProfileId=${encodeURIComponent(examProfileId)}`,
        { cache: 'no-store', credentials: 'include' },
      );
      if (!response.ok) throw new Error('track_load_failed');
      const body = await response.json() as { tracks?: ExamPreparationTrack[] };
      const nextTracks = Array.isArray(body.tracks) ? body.tracks.filter(isTrackSelectable) : [];
      setTracks(nextTracks);
      return nextTracks;
    } catch {
      setTracks([]);
      setTracksFailed(true);
      return null;
    } finally {
      setTracksLoading(false);
    }
  };

  const goForwardFromExam = async () => {
    if (!selectedOption || !isExamOptionSelectable(selectedOption)) {
      setError(c.invalidExam);
      return;
    }
    setError(null);
    setStep(2);
    const loaded = await loadTracks(selectedOption.exam_profile_id);
    if (!loaded) return;
    const savedStillAvailable = loaded.find((track) => (
      track.stageCode === selectedStageCode
        && track.tierCode === selectedTier
        && track.preparationMode === selectedMode
    ));
    if (!savedStillAvailable) {
      setSelectedTier(null);
      setSelectedStageCode(null);
      setSelectedMode('MCQ');
    }
  };

  const chooseTier = (tier: SscCglPreferenceTier) => {
    const tierTracks = availableTracks.filter((item) => item.tierCode === tier);
    if (tierTracks.length === 0) {
      setError(c.unavailableTier);
      return;
    }
    setSelectedTier(tier);
    const preferred = tier === 'TIER_I'
      ? tierTracks.find((track) => track.stageCode === 'TIER_I')
      : tierTracks.find((track) => track.stageCode === 'TIER_II_PAPER_I') ?? tierTracks[0];
    setSelectedStageCode(preferred?.stageCode ?? null);
    setSelectedMode('MCQ');
    setError(null);
  };

  const save = async () => {
    if (saving || saved || !selectedOption) return;
    setError(null);
    if (!isExamOptionSelectable(selectedOption)) {
      setError(c.disabledExam);
      return;
    }
    if (!changesExistingExamOnly && !canSaveExamOnboarding(selectedOption.exam_profile_id, examDate)) {
      setError(c.invalidDate);
      return;
    }
    if (!selectedTrack) {
      setError(requiresCglTier ? c.invalidTier : c.noTracks);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        changesExistingExamOnly ? '/api/profile/exam-preference' : '/api/onboarding/exam',
        {
        method: changesExistingExamOnly ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examProfileId: selectedOption.exam_profile_id,
          ...(changesExistingExamOnly ? {} : { examDate }),
          tierCode: selectedTrack.tierCode,
          stageCode: selectedTrack.stageCode,
          preparationMode: selectedTrack.preparationMode,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        preference?: SavedExamPreference;
      };
      if (response.status === 401) {
        router.replace(`/login?redirect=${encodeURIComponent(`/onboarding${window.location.search}`)}`);
        return;
      }
      if (!response.ok) {
        if (payload.error === 'invalid_date') setError(c.invalidDate);
        else if (payload.error === 'invalid_tier' || payload.error === 'invalid_tier_stage') setError(c.invalidTier);
        else if (payload.error === 'tier_unavailable' || payload.error === 'preparation_track_unavailable') setError(c.unavailableTier);
        else if (
          payload.error === 'disabled_exam' ||
          payload.error === 'unknown_exam' ||
          payload.error === 'content_unmapped'
        ) {
          setError(c.disabledExam);
        } else setError(c.saveError);
        return;
      }
      setSaved(true);
      const defaultDestination = payload.preference
        ? getExamPreferenceHref(payload.preference)
        : `/exams/${selectedOption.exam_slug}?stage=${encodeURIComponent(selectedTrack.stageCode)}`;
      const destination = requestedReturnTo
        ? getSafeRedirectPath(requestedReturnTo, defaultDestination)
        : editMode
          ? '/profile'
          : defaultDestination;
      clearClientCache();
      router.replace(destination);
      router.refresh();
    } catch {
      setError(c.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) return <OnboardingSkeleton />;

  return (
    <div className="relative min-h-screen w-full min-w-0 bg-[#F8F7FF] px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-purple-200/50 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <QuestionWaleLogoMark size={44} />
            <div>
              <p className="text-lg font-extrabold tracking-tight text-slate-900">QuestionWale</p>
              <p className="hidden text-xs text-slate-500 sm:block">{c.brandSub}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLanguage}
              className="min-h-11 rounded-xl border border-purple-200 bg-white px-4 text-sm font-semibold text-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2"
            >
              {language === 'en' ? 'हिंदी' : 'English'}
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 sm:px-4"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{c.logout}</span>
              <span className="sr-only sm:hidden">{c.logout}</span>
            </button>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center py-6 sm:py-8">
          <section className="w-full rounded-3xl border border-purple-100 bg-white p-4 shadow-[0_24px_80px_rgba(76,29,149,0.12)] sm:p-7 lg:p-9">
            <div className="mb-7">
              <div className="flex items-center justify-between gap-4 text-sm font-semibold text-[#7C3AED]">
                <span>{c.step(displayStep, totalSteps)}</span>
                <span aria-hidden>{Math.round((displayStep / totalSteps) * 100)}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-purple-100" aria-label={c.step(displayStep, totalSteps)}>
                <div className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] transition-all" style={{ width: `${(displayStep / totalSteps) * 100}%` }} />
              </div>
            </div>

            {loadFailed ? (
              <div className="py-16 text-center" role="alert">
                <p className="font-medium text-red-700">{c.loadError}</p>
                <button type="button" onClick={() => void load()} className="mt-5 min-h-11 rounded-xl bg-[#7C3AED] px-6 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2">
                  {c.retry}
                </button>
              </div>
            ) : step === 1 ? (
              <div>
                <div className="mx-auto max-w-3xl text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-[#7C3AED]">
                    <Target className="h-7 w-7" aria-hidden />
                  </span>
                  <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{c.examTitle}</h1>
                  <p className="mt-1 font-semibold text-[#7C3AED]">{c.examTitleAlt}</p>
                  <p className="mt-3 text-sm text-slate-600 sm:text-base">{c.examSubtitle}</p>
                  <p className="mt-1 text-sm text-slate-500">{c.examSubtitleAlt}</p>
                </div>

                {preferenceWarning ? (
                  <p className="mx-auto mt-5 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-sm font-medium text-amber-900" role="status">
                    {c.preferenceWarning}
                  </p>
                ) : null}

                {selectableCount === 0 ? (
                  <div className="mx-auto mt-6 max-w-4xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 sm:flex sm:items-start sm:gap-3" role="status">
                    <Clock3 className="h-5 w-5 shrink-0 text-amber-700" aria-hidden />
                    <div className="mt-2 sm:mt-0">
                      <p className="font-bold">{c.activationTitle}</p>
                      <p className="mt-1 text-sm leading-6">{c.activationBody}</p>
                      <p className="text-sm leading-6">{c.activationAlt}</p>
                    </div>
                  </div>
                ) : null}

                <div className="mx-auto mt-6 max-w-3xl">
                  <label className="relative block">
                    <span className="sr-only">{c.search}</span>
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden />
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={c.search}
                      className="min-h-12 w-full rounded-2xl border border-slate-200 pl-12 pr-4 outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-200"
                    />
                  </label>
                </div>

                <div className="mt-5 flex gap-2 overflow-x-auto pb-2" aria-label="Exam family filters">
                  {[ALL_EXAM_FAMILIES, ...families].map((value) => {
                    const active = family === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setFamily(value)}
                        className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 ${active ? 'border-[#7C3AED] bg-[#7C3AED] text-white' : 'border-purple-200 bg-white text-[#6D28D9] hover:bg-purple-50'}`}
                      >
                        {value === ALL_EXAM_FAMILIES ? c.all : familyLabel(value)}
                      </button>
                    );
                  })}
                </div>

                <fieldset className="mt-4">
                  <legend className="sr-only">{c.examTitle}</legend>
                  <div className="grid max-h-[min(52vh,590px)] gap-3 overflow-y-auto p-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredOptions.map((option) => {
                      const selectable = isExamOptionSelectable(option);
                      const checked = selectedProfileId === option.exam_profile_id;
                      const englishName = examOptionDisplayTitle(option, 'en');
                      const hindiName = examOptionDisplayTitle(option, 'hi');
                      const descriptionId = `exam-${option.exam_profile_id}-status`;
                      return (
                        <label
                          key={option.exam_profile_id}
                          className={`relative flex min-h-[250px] min-w-0 flex-col rounded-2xl border p-4 text-left transition focus-within:ring-2 focus-within:ring-[#7C3AED] focus-within:ring-offset-2 ${selectable ? 'cursor-pointer hover:border-purple-300 hover:bg-purple-50/50' : 'cursor-not-allowed border-slate-200 bg-slate-50/80'} ${checked ? 'border-[#7C3AED] bg-purple-50 shadow-sm' : ''}`}
                        >
                          <input
                            type="radio"
                            name="target-exam-profile"
                            value={option.exam_profile_id}
                            checked={checked}
                            disabled={!selectable}
                            aria-describedby={descriptionId}
                            onChange={() => chooseExam(option)}
                            className="sr-only"
                          />
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#7C3AED]">{option.short_name ?? option.exam_code}</p>
                              {checked && initialProfileId === option.exam_profile_id ? <p className="mt-1 text-[11px] font-semibold text-emerald-700">{c.current}</p> : null}
                            </div>
                            {selectable ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                                {checked ? <Check className="h-3 w-3" aria-hidden /> : null}{c.available} / {c.availableAlt}
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-900">{c.comingSoon} / {c.comingSoonAlt}</span>
                            )}
                          </div>
                          <p className="mt-3 text-sm font-bold leading-5 text-slate-900">{englishName}</p>
                          <p className="mt-1 text-sm leading-5 text-slate-600" lang="hi">{hindiName}</p>
                          {option.conducting_body ? (
                            <p className="mt-2 break-words text-xs text-slate-500"><span className="font-semibold">{c.conductedBy}:</span> {option.conducting_body}</p>
                          ) : null}
                          <p className="mt-2 text-xs leading-5 text-slate-500">
                            {language === 'hi'
                              ? 'प्रकाशित पाठ्यक्रम और सत्यापित अभ्यास प्रश्न उपलब्ध हैं।'
                              : 'Published syllabus with verified practice questions.'}
                          </p>
                          <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                            {([
                              [c.subjects, option.active_subject_count],
                              [c.topics, option.active_topic_count],
                              [c.subtopics, option.active_subtopic_count],
                              [c.questions, option.verified_question_count],
                            ] as const).map(([label, value]) => (
                              <div key={label} className="min-w-0 rounded-lg bg-white/80 px-2 py-1.5">
                                <dt className="truncate text-slate-500">{label}</dt>
                                <dd className="font-bold text-slate-900">{value.toLocaleString('en-IN')}</dd>
                              </div>
                            ))}
                          </dl>
                          {option.content_family_code ? (
                            <p className="mt-auto pt-3 text-xs font-semibold text-slate-500">{c.family}: {familyLabel(option.content_family_code)}</p>
                          ) : null}
                          {!selectable ? (
                            <p id={descriptionId} className="mt-2 text-xs leading-5 text-slate-500">{friendlyAvailabilityMessage(option.availability_reason, language)}</p>
                          ) : <span id={descriptionId} className="sr-only">{c.available}</span>}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                {filteredOptions.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">{c.noMatch}</p> : null}
                {error ? <p id="exam-selection-error" className="mt-5 text-center text-sm font-medium text-red-600" role="alert">{error}</p> : null}
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    disabled={!canContinue || tracksLoading}
                    aria-describedby={error ? 'exam-selection-error' : undefined}
                    onClick={() => void goForwardFromExam()}
                    className="min-h-12 w-full rounded-xl bg-[#7C3AED] px-8 font-bold text-white transition hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                  >
                    {tracksLoading ? c.saving : `${c.continue} / ${c.continueAlt}`}
                  </button>
                </div>
              </div>
            ) : step === 2 ? (
              <div className="mx-auto w-full min-w-0 max-w-4xl">
                <div className="text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-[#7C3AED]">
                    <Target className="h-7 w-7" aria-hidden />
                  </span>
                  <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{requiresCglTier ? c.tierTitle : c.trackTitle}</h1>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{c.trackSubtitle}</p>
                </div>

                {tracksFailed ? (
                  <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-5 text-center" role="alert">
                    <p className="font-medium text-red-700">{c.trackLoadError}</p>
                    <button type="button" onClick={() => selectedOption && void loadTracks(selectedOption.exam_profile_id)} className="mt-4 min-h-11 rounded-xl bg-red-700 px-5 font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">{c.retryTracks}</button>
                  </div>
                ) : availableTracks.length === 0 ? (
                  <p className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center font-medium text-amber-900" role="status">{c.noTracks}</p>
                ) : requiresCglTier ? (
                  <>
                    <fieldset className="mt-7 grid min-w-0 gap-4 sm:grid-cols-2">
                      <legend className="sr-only">{c.tierTitle}</legend>
                      {([
                        { tier: 'TIER_I', title: c.tier1, hint: c.tier1Hint },
                        { tier: 'TIER_II', title: c.tier2, hint: c.tier2Hint },
                      ] as const).map((tierOption) => {
                        const checked = selectedTier === tierOption.tier;
                        const available = availableTracks.some((item) => item.tierCode === tierOption.tier);
                        return (
                          <button key={tierOption.tier} type="button" role="radio" aria-checked={checked} aria-disabled={!available} disabled={!available} onClick={() => chooseTier(tierOption.tier)} className={`flex min-h-32 w-full min-w-0 max-w-full items-center gap-3 rounded-2xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 ${checked ? 'border-[#7C3AED] bg-purple-50 shadow-sm' : 'border-purple-200 bg-white hover:border-purple-400'}`}>
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${checked ? 'border-[#7C3AED] bg-[#7C3AED] text-white' : 'border-slate-300 text-transparent'}`}><Check className="h-4 w-4" aria-hidden /></span>
                            <span className="min-w-0"><span className="block break-words text-base font-bold text-slate-900">{tierOption.title}</span><span className="mt-1 block break-words text-sm leading-5 text-slate-500">{available ? tierOption.hint : c.unavailableTier}</span></span>
                          </button>
                        );
                      })}
                    </fieldset>
                    {selectedTier === 'TIER_II' ? (
                      <fieldset className="mt-6 grid min-w-0 gap-3 sm:grid-cols-3">
                        <legend className="mb-3 text-base font-bold text-slate-900">{c.paperTitle}</legend>
                        {availableTracks.filter((track) => track.tierCode === 'TIER_II').map((track) => {
                          const checked = selectedStageCode === track.stageCode;
                          const label = track.paperOrSection[language] ?? track.paperOrSection.en ?? track.stageCode;
                          return (
                            <button key={track.stageCode} type="button" role="radio" aria-checked={checked} onClick={() => { setSelectedStageCode(track.stageCode); setSelectedMode('MCQ'); setError(null); }} className={`min-w-0 rounded-xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 ${checked ? 'border-[#7C3AED] bg-purple-50' : 'border-slate-200 bg-white'}`}>
                              <span className="block break-words text-sm font-bold text-slate-900">{label}</span>
                              <span className="mt-2 block text-xs font-semibold text-violet-700">{track.verifiedQuestionCount.toLocaleString('en-IN')} {c.questions}</span>
                            </button>
                          );
                        })}
                      </fieldset>
                    ) : null}
                  </>
                ) : (
                  <fieldset className="mt-7 grid min-w-0 gap-4 sm:grid-cols-2">
                    <legend className="sr-only">{c.trackTitle}</legend>
                    {availableTracks.map((track) => {
                      const checked = selectedStageCode === track.stageCode;
                      const stageName = track.stageTitle[language] ?? track.stageTitle.en ?? track.stageCode;
                      const sectionName = track.paperOrSection[language] ?? track.paperOrSection.en;
                      return (
                        <button key={track.stageCode} type="button" role="radio" aria-checked={checked} onClick={() => { setSelectedTier(null); setSelectedStageCode(track.stageCode); setSelectedMode('MCQ'); setError(null); }} className={`min-h-28 min-w-0 rounded-2xl border p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 ${checked ? 'border-[#7C3AED] bg-purple-50' : 'border-slate-200 bg-white hover:border-purple-300'}`}>
                          <span className="block break-words font-bold text-slate-900">{stageName}</span>
                          {sectionName ? <span className="mt-1 block break-words text-sm text-slate-600">{sectionName}</span> : null}
                          <span className="mt-2 block text-xs font-semibold text-violet-700">{track.verifiedQuestionCount.toLocaleString('en-IN')} {c.questions}</span>
                        </button>
                      );
                    })}
                  </fieldset>
                )}

                <fieldset className="mt-6 grid min-w-0 gap-3 sm:grid-cols-2">
                  <legend className="mb-3 text-base font-bold text-slate-900">Preparation mode</legend>
                  <button type="button" role="radio" aria-checked={selectedMode === 'MCQ'} disabled={!selectedTrack} className="min-h-20 min-w-0 rounded-xl border border-[#7C3AED] bg-purple-50 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 disabled:opacity-50">
                    <span className="font-bold text-slate-900">{c.objectiveMode}</span>
                    {selectedTrack ? <span className="mt-1 block text-xs text-violet-700">{selectedTrack.verifiedQuestionCount.toLocaleString('en-IN')} {c.questions}</span> : null}
                  </button>
                  <button type="button" role="radio" aria-checked="false" aria-disabled="true" disabled className="min-h-20 min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left opacity-70">
                    <span className="font-bold text-slate-700">{c.writtenMode}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{c.writtenSoon}</span>
                  </button>
                </fieldset>
                {selectedTrack && selectedTrack.qualifyingSkillTestCount > 0 ? (
                  <p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">DEST/qualifying skill test is tracked separately and is not shown as an MCQ subtopic.</p>
                ) : null}
                {error ? <p className="mt-5 text-center text-sm font-medium text-red-600" role="alert">{error}</p> : null}
                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <button type="button" onClick={() => { setStep(1); setError(null); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-purple-200 px-6 font-bold text-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2"><ArrowLeft className="h-4 w-4" aria-hidden />{c.back}</button>
                  <button type="button" disabled={!selectedTrack || tracksLoading} onClick={() => { setError(null); setStep(3); }} className="min-h-12 rounded-xl bg-[#7C3AED] px-7 font-bold text-white hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40">{c.continue} / {c.continueAlt}</button>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-xl">
                <div className="text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-[#7C3AED]">
                    <CalendarDays className="h-7 w-7" aria-hidden />
                  </span>
                  <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{c.dateTitle}</h1>
                  <p className="mt-1 font-semibold text-[#7C3AED]">{c.dateTitleAlt}</p>
                  <p className="mt-3 text-sm text-slate-600">{c.dateSubtitle}</p>
                  <p className="mt-1 text-sm text-slate-500">{c.dateSubtitleAlt}</p>
                  <div className="mt-5 rounded-2xl bg-purple-50 p-4">
                    <p className="font-extrabold text-[#6D28D9]">{selectedOption?.short_name ?? selectedOption?.exam_code}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{selectedOption?.official_title.en}</p>
                    <p className="mt-1 text-sm text-slate-600" lang="hi">{selectedOption?.official_title.hi}</p>
                  </div>
                </div>
                <label htmlFor="target-exam-date" className="mt-8 block text-sm font-semibold text-slate-800">{c.dateLabel}</label>
                <input
                  id="target-exam-date"
                  type="date"
                  min={minFutureExamDateInput()}
                  value={examDate}
                  onChange={(event) => { setExamDate(event.target.value); setError(null); }}
                  aria-describedby="exam-date-hint exam-date-error"
                  className="mt-2 min-h-14 w-full rounded-2xl border border-slate-200 px-4 text-base outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-200"
                />
                <p id="exam-date-hint" className="mt-2 text-sm text-slate-500">{c.dateHint}</p>
                {error ? <p id="exam-date-error" className="mt-4 text-sm font-medium text-red-600" role="alert">{error}</p> : null}
                {saved ? <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-700" role="status"><Check className="h-5 w-5" />{c.success}</p> : null}
                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <button type="button" onClick={() => { setStep(2); setError(null); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-purple-200 px-6 font-bold text-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2">
                    <ArrowLeft className="h-4 w-4" aria-hidden />{c.back}
                  </button>
                  <button type="button" disabled={saving || saved || !selectedOption || !selectedTrack || (!changesExistingExamOnly && !canSaveExamOnboarding(selectedOption.exam_profile_id, examDate))} onClick={() => void save()} className="min-h-12 rounded-xl bg-[#7C3AED] px-7 font-bold text-white hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40">
                    {saving ? c.saving : `${c.complete} / ${c.completeAlt}`}
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
