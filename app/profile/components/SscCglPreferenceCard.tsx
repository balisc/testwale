'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Pencil, RotateCw, X } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { clearClientCache } from '@/lib/clientRequestCache';
import {
  getSscCglPreferenceHref,
  type SscCglPreference,
  type SscCglPreferenceTier,
  type SscCglTierAvailability,
} from '@/lib/sscCglPreference';

type PreferenceResponse = {
  preference: SscCglPreference | null;
  tiers: SscCglTierAvailability[];
};

export default function SscCglPreferenceCard() {
  const router = useRouter();
  const { language } = useLanguage();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const changeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const copy = useMemo(() => language === 'hi'
    ? {
        heading: 'परीक्षा और टियर', target: 'लक्ष्य परीक्षा', preferredTier: 'पसंदीदा टियर',
        preferredPaper: 'पसंदीदा पेपर', tier1: 'टियर 1', tier2: 'टियर 2', paper1: 'पेपर I', paper2: 'पेपर II', paper3: 'पेपर III',
        change: 'टियर बदलें', modalTitle: 'SSC CGL टियर बदलें',
        modalDescription: 'केवल टियर चुनें। इससे परीक्षा की तारीख नहीं बदलेगी।',
        save: 'टियर सेव करें', saving: 'सेव हो रहा है…', cancel: 'रद्द करें',
        saved: 'टियर सेव हो गया', unavailable: 'अभी सत्यापित प्रश्न उपलब्ध नहीं हैं',
        loadError: 'आपकी SSC CGL पसंद लोड नहीं हो सकी।',
        saveError: 'टियर सेव नहीं हो सका। फिर कोशिश करें।', retry: 'फिर कोशिश करें',
        openHub: 'SSC CGL खोलें', notSelected: 'अभी नहीं चुना',
      }
    : {
        heading: 'Exam and Tier', target: 'Target Exam', preferredTier: 'Preferred Tier',
        preferredPaper: 'Preferred Paper', tier1: 'Tier 1', tier2: 'Tier 2', paper1: 'Paper I', paper2: 'Paper II', paper3: 'Paper III',
        change: 'Change Tier', modalTitle: 'Change SSC CGL Tier',
        modalDescription: 'Choose only your Tier. Your exam date will not be changed.',
        save: 'Save Tier', saving: 'Saving…', cancel: 'Cancel', saved: 'Tier saved',
        unavailable: 'No verified questions available yet',
        loadError: 'We could not load your SSC CGL preference.',
        saveError: 'We could not save your Tier. Please try again.', retry: 'Try again',
        openHub: 'Open SSC CGL', notSelected: 'Not selected yet',
      }, [language]);

  const [preference, setPreference] = useState<SscCglPreference | null>(null);
  const [tiers, setTiers] = useState<SscCglTierAvailability[]>([]);
  const [selectedTier, setSelectedTier] = useState<SscCglPreferenceTier | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadPreference = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await fetch('/api/profile/ssc-cgl-preference', {
        cache: 'no-store', credentials: 'include',
      });
      if (!response.ok) throw new Error('preference_load_failed');
      const body = (await response.json()) as PreferenceResponse;
      setPreference(body.preference);
      setSelectedTier(body.preference?.tierCode ?? null);
      setTiers(Array.isArray(body.tiers) ? body.tiers : []);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPreference(); }, [loadPreference]);
  useEffect(() => {
    if (editing) closeButtonRef.current?.focus();
  }, [editing]);
  useEffect(() => {
    const clearUserState = () => {
      setPreference(null); setSelectedTier(null); setTiers([]); setSaved(false); setEditing(false);
    };
    window.addEventListener('questionwale:clear-user-caches', clearUserState);
    return () => window.removeEventListener('questionwale:clear-user-caches', clearUserState);
  }, []);

  const closeModal = () => {
    if (saving) return;
    setEditing(false);
    setSelectedTier(preference?.tierCode ?? null);
    setSaveError(false);
    window.setTimeout(() => changeButtonRef.current?.focus(), 0);
  };

  const handleModalKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(
      modalRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled])') ?? [],
    );
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  };

  const savePreference = async () => {
    if (!selectedTier || saving) return;
    setSaving(true); setSaveError(false); setSaved(false);
    try {
      const response = await fetch('/api/profile/ssc-cgl-preference', {
        method: 'PUT', cache: 'no-store', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierCode: selectedTier, mode: 'replace' }),
      });
      const body = (await response.json().catch(() => null)) as { preference?: SscCglPreference } | null;
      if (!response.ok || !body?.preference) throw new Error('preference_save_failed');
      setPreference(body.preference);
      setSelectedTier(body.preference.tierCode);
      setSaved(true);
      setEditing(false);
      clearClientCache('learning-dashboard:');
      clearClientCache('profile:');
      router.refresh();
      router.push(getSscCglPreferenceHref(body.preference));
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-6 w-full min-w-0 max-w-full rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6" aria-labelledby="ssc-cgl-preference-heading">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 id="ssc-cgl-preference-heading" className="break-words text-xl font-bold text-[#0F172A]">{copy.heading}</h2>
          <dl className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="min-w-0 rounded-xl bg-slate-50 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{copy.target}</dt>
              <dd className="mt-1 break-words text-sm font-bold text-slate-900">SSC CGL</dd>
            </div>
            <div className="min-w-0 rounded-xl bg-slate-50 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{copy.preferredTier}</dt>
              <dd className="mt-1 break-words text-sm font-bold text-slate-900">
                {preference?.tierCode === 'TIER_I' ? copy.tier1 : preference?.tierCode === 'TIER_II' ? copy.tier2 : copy.notSelected}
              </dd>
            </div>
            {preference?.tierCode === 'TIER_II' ? (
              <div className="min-w-0 rounded-xl bg-slate-50 p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{copy.preferredPaper}</dt>
                <dd className="mt-1 break-words text-sm font-bold text-slate-900">
                  {preference.stageCode === 'TIER_II_PAPER_II' ? copy.paper2 : preference.stageCode === 'TIER_II_PAPER_III' ? copy.paper3 : copy.paper1}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
        <Link href="/ssc-cgl" className="inline-flex min-h-11 max-w-full shrink-0 items-center text-sm font-semibold text-brand hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          {copy.openHub}
        </Link>
      </div>

      {loading ? (
        <div className="mt-5 flex min-h-20 items-center justify-center rounded-xl bg-slate-50" aria-busy="true">
          <Loader2 className="h-6 w-6 animate-spin text-brand" aria-hidden="true" />
        </div>
      ) : loadError ? (
        <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4" role="alert">
          <p className="break-words text-sm font-medium text-red-700">{copy.loadError}</p>
          <button type="button" onClick={() => void loadPreference()} className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-red-700 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700">
            <RotateCw className="h-4 w-4" aria-hidden="true" />{copy.retry}
          </button>
        </div>
      ) : (
        <div className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <button ref={changeButtonRef} type="button" onClick={() => { setEditing(true); setSaved(false); }} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition hover:bg-[#6D28D9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-auto">
            <Pencil className="h-4 w-4" aria-hidden="true" />{copy.change}
          </button>
          {saved ? <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700" role="status"><Check className="h-4 w-4" aria-hidden="true" />{copy.saved}</p> : null}
        </div>
      )}

      {editing ? (
        <div className="fixed inset-0 z-50 flex min-w-0 items-center justify-center bg-slate-950/55 p-3 sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="change-tier-title" aria-describedby="change-tier-description" onKeyDown={handleModalKeyDown} className="max-h-[calc(100vh-1.5rem)] w-full min-w-0 max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
            <div className="flex min-w-0 items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 id="change-tier-title" className="break-words text-xl font-bold text-slate-950">{copy.modalTitle}</h3>
                <p id="change-tier-description" className="mt-2 break-words text-sm leading-6 text-slate-600">{copy.modalDescription}</p>
              </div>
              <button ref={closeButtonRef} type="button" onClick={closeModal} aria-label={copy.cancel} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <fieldset className="mt-6 grid min-w-0 gap-3 sm:grid-cols-2">
              <legend className="sr-only">{copy.modalTitle}</legend>
              {([
                { tier: 'TIER_I', title: copy.tier1 },
                { tier: 'TIER_II', title: copy.tier2 },
              ] as const).map((option) => {
                const selected = selectedTier === option.tier;
                const available = tiers.find((tier) => tier.tierCode === option.tier)?.isAvailable === true;
                return (
                  <button key={option.tier} type="button" role="radio" aria-checked={selected} aria-disabled={!available} disabled={!available} onClick={() => { setSelectedTier(option.tier); setSaveError(false); }} className={`flex min-h-24 w-full min-w-0 items-center gap-3 rounded-xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 ${selected ? 'border-brand bg-[#FAF5FF]' : 'border-[#E2E8F0] bg-white hover:border-[#C4B5FD]'}`}>
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-brand bg-brand text-white' : 'border-slate-300 text-transparent'}`}><Check className="h-4 w-4" aria-hidden="true" /></span>
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-bold text-slate-900">{option.title}</span>
                      {!available ? <span className="mt-1 block break-words text-xs text-slate-500">{copy.unavailable}</span> : null}
                    </span>
                  </button>
                );
              })}
            </fieldset>
            {saveError ? <p className="mt-4 break-words text-sm font-medium text-red-700" role="alert">{copy.saveError}</p> : null}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" disabled={saving} onClick={closeModal} className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50">{copy.cancel}</button>
              <button type="button" disabled={!selectedTier || saving || selectedTier === preference?.tierCode} onClick={() => void savePreference()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:bg-slate-300">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}{saving ? copy.saving : copy.save}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
