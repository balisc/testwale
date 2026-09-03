'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, ChevronRight, CloudOff, Loader2, Save, Send } from 'lucide-react';
import { getOptionsForLang, getQuestionLocalizedText } from '@/lib/practice';
import { getTimingState, type TimingRules } from '@/lib/mockTests/core';
import { getMockBlueprint } from '@/lib/mockTests/blueprints';
import type { MockMode, MockSectionKey } from '@/lib/mockTests/blueprintTypes';
import type { MockShellItem, MockTestShell } from '@/lib/mockTests/types';

type DraftResponse = {
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  visited: boolean;
  markedForReview: boolean;
  eventVersion: number;
  activeTimeSeconds: number;
};

type SaveState = 'idle' | 'saving' | 'saved' | 'offline' | 'error';
const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;

function draftKey(testId: string, itemId: string) {
  return `qw_mock_draft:${testId}:${itemId}`;
}

function lastItemKey(testId: string, sectionKey: MockSectionKey) {
  return `qw_mock_last_item:${testId}:${sectionKey}`;
}

function countdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function numberRule(rules: Record<string, unknown>, snake: string, camel: string, fallback: number) {
  const value = rules[snake] ?? rules[camel];
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function frozenTimingRules(test: MockTestShell): TimingRules {
  const config = getMockBlueprint(test.examKey);
  const strategy = test.rules.timing_strategy ?? test.rules.timingStrategy;
  return {
    timingStrategy: strategy === 'global' ? 'global' : 'sectional',
    standardTotalSeconds: numberRule(test.rules, 'standard_total_seconds', 'standardTotalSeconds', config.rules.standardTotalSeconds),
    scribeTotalSeconds: numberRule(test.rules, 'scribe_total_seconds', 'scribeTotalSeconds', config.rules.scribeTotalSeconds),
    standardSectionSeconds: numberRule(test.rules, 'standard_section_seconds', 'standardSectionSeconds', config.rules.standardSectionSeconds ?? config.rules.standardTotalSeconds),
    scribeSectionSeconds: numberRule(test.rules, 'scribe_section_seconds', 'scribeSectionSeconds', config.rules.scribeSectionSeconds ?? config.rules.scribeTotalSeconds),
  };
}

function paletteState(item: MockShellItem, response: DraftResponse | undefined, current: boolean) {
  if (current) return 'Current';
  if (response?.selectedOption && response.markedForReview) return 'Answered and marked';
  if (response?.markedForReview) return 'Marked for review';
  if (response?.selectedOption) return 'Answered';
  if (response?.visited) return 'Visited, unanswered';
  return 'Not visited';
}

export default function MockTestWorkspace({ testId }: { testId: string }) {
  const router = useRouter();
  const [test, setTest] = useState<MockTestShell | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<MockMode>('standard');
  const [confirmed, setConfirmed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [responses, setResponses] = useState<Record<string, DraftResponse>>({});
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [selectedSectionKey, setSelectedSectionKey] = useState<MockSectionKey | null>(null);
  const [language, setLanguage] = useState<'en' | 'hi' | 'both'>('en');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [now, setNow] = useState(Date.now());
  const [serverOffset, setServerOffset] = useState(0);
  const [timerAnnouncement, setTimerAnnouncement] = useState('');
  const warningMarker = useRef<string | null>(null);
  const viewedItems = useRef(new Set<string>());
  const activeSince = useRef(Date.now());
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const finalizing = useRef(false);

  const load = useCallback(async () => {
    const response = await fetch(`/api/mock-tests/${testId}`, { cache: 'no-store', credentials: 'include' });
    const body = await response.json() as { test?: MockTestShell; message?: string };
    if (!response.ok || !body.test) throw new Error(body.message ?? 'Could not load this mock test.');
    const next = body.test;
    if (next.status === 'submitted' || next.status === 'auto_submitted') {
      router.replace(`/mock-tests/${testId}/result`);
      return;
    }
    const config = getMockBlueprint(next.examKey);
    setServerOffset(Date.parse(next.serverNow) - Date.now());
    setTest(next);
    const restored: Record<string, DraftResponse> = {};
    for (const item of next.items) {
      const server = item.response ?? { selectedOption: null, visited: false, markedForReview: false, eventVersion: 0, activeTimeSeconds: 0 };
      let local: DraftResponse | null = null;
      try {
        const raw = localStorage.getItem(draftKey(testId, item.id));
        if (raw) local = JSON.parse(raw) as DraftResponse;
      } catch { /* ignore corrupt device-only drafts */ }
      restored[item.id] = local && local.eventVersion > server.eventVersion ? local : server;
    }
    setResponses(restored);
    setSelectedSectionKey((current) => current ?? config.sections[0]!.key);
    setCurrentItemId((current) => current ?? next.items[0]?.id ?? null);
  }, [router, testId]);

  useEffect(() => {
    setLoading(true);
    void load().catch((caught) => setError(caught instanceof Error ? caught.message : 'Could not load this mock test.')).finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (test?.status !== 'in_progress') return;
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [test?.status]);

  useEffect(() => {
    if (test?.status !== 'in_progress') return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [test?.status]);

  const config = test ? getMockBlueprint(test.examKey) : null;
  const rules = test ? frozenTimingRules(test) : null;
  const timing = test?.startedAt && test.timingMode && rules
    ? getTimingState(Date.parse(test.startedAt), test.timingMode, now + serverOffset, rules)
    : null;
  const forcedSectionIndex = timing?.timingStrategy === 'sectional' ? timing.activeSectionIndex : null;
  const selectedIndex = config?.sections.findIndex((section) => section.key === selectedSectionKey) ?? 0;
  const visibleSectionIndex = forcedSectionIndex ?? Math.max(0, selectedIndex);
  const visibleSection = config?.sections[visibleSectionIndex] ?? null;
  // Frozen item snapshots never mutate; this small derivation is intentionally cheap.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const visibleItems = test?.items.filter((item) => item.sectionKey === visibleSection?.key) ?? [];
  const currentItem = test?.items.find((item) => item.id === currentItemId) ?? visibleItems[0] ?? null;

  useEffect(() => {
    if (test?.status !== 'in_progress' || !visibleSection || visibleItems.length === 0) return;
    if (!currentItem || currentItem.sectionKey !== visibleSection.key) {
      let remembered: string | null = null;
      try { remembered = localStorage.getItem(lastItemKey(testId, visibleSection.key)); } catch { /* best effort */ }
      const target = visibleItems.find((item) => item.id === remembered) ?? visibleItems[0]!;
      setCurrentItemId(target.id);
      activeSince.current = Date.now();
    }
  }, [currentItem, test?.status, testId, visibleItems, visibleSection]);

  useEffect(() => {
    if (!timing || test?.status !== 'in_progress') return;
    if (timing.expired && !finalizing.current) {
      finalizing.current = true;
      void saveQueue.current.then(() => fetch(`/api/mock-tests/${testId}/submit`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}',
      })).finally(() => router.replace(`/mock-tests/${testId}/result`));
      return;
    }
    const remaining = timing.timingStrategy === 'global' ? timing.remainingTotalSeconds : timing.remainingSectionSeconds;
    const threshold = remaining <= 60 ? 'one' : remaining <= 300 ? 'five' : timing.timingStrategy === 'global' && remaining <= 600 ? 'ten' : null;
    const marker = threshold ? `${timing.timingStrategy}:${forcedSectionIndex ?? 'all'}:${threshold}` : null;
    if (marker && marker !== warningMarker.current) {
      warningMarker.current = marker;
      const scope = timing.timingStrategy === 'global' ? 'in the test' : 'in this section';
      setTimerAnnouncement(`${threshold === 'one' ? 'One' : threshold === 'five' ? 'Five' : 'Ten'} minute${threshold === 'one' ? '' : 's'} remain ${scope}.`);
    }
  }, [forcedSectionIndex, router, test?.status, testId, timing]);

  const save = useCallback((item: MockShellItem, next: DraftResponse): Promise<boolean> => {
    setResponses((current) => ({ ...current, [item.id]: next }));
    try { localStorage.setItem(draftKey(testId, item.id), JSON.stringify(next)); } catch { /* best effort */ }
    const run = async () => {
      if (!navigator.onLine) { setSaveState('offline'); return false; }
      setSaveState('saving');
      try {
        const response = await fetch(`/api/mock-tests/${testId}/responses`, {
          method: 'PUT', credentials: 'include', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId: item.id, selectedOption: next.selectedOption, visited: next.visited,
            markedForReview: next.markedForReview, eventVersion: next.eventVersion,
            activeTimeDeltaSeconds: Math.max(0, Math.min(60, Math.round((Date.now() - activeSince.current) / 1000))),
          }),
        });
        const body = await response.json() as { code?: string; message?: string };
        if (!response.ok) {
          if (body.code === 'TEST_EXPIRED') router.replace(`/mock-tests/${testId}/result`);
          throw new Error(body.message ?? 'Save failed.');
        }
        try { localStorage.removeItem(draftKey(testId, item.id)); } catch { /* best effort */ }
        setSaveState('saved');
        activeSince.current = Date.now();
        return true;
      } catch {
        setSaveState(navigator.onLine ? 'error' : 'offline');
        return false;
      }
    };
    const pending = saveQueue.current.then(run, run);
    saveQueue.current = pending.then(() => undefined, () => undefined);
    return pending;
  }, [router, testId]);

  useEffect(() => {
    if (!currentItem || test?.status !== 'in_progress' || viewedItems.current.has(currentItem.id)) return;
    viewedItems.current.add(currentItem.id);
    const current = responses[currentItem.id] ?? { selectedOption: null, visited: false, markedForReview: false, eventVersion: 0, activeTimeSeconds: 0 };
    if (!current.visited) void save(currentItem, { ...current, visited: true, eventVersion: current.eventVersion + 1 });
  }, [currentItem, responses, save, test?.status]);

  useEffect(() => {
    if (!test || test.status !== 'in_progress') return;
    const retry = () => {
      for (const item of test.items) {
        try {
          const raw = localStorage.getItem(draftKey(testId, item.id));
          if (!raw) continue;
          const draft = JSON.parse(raw) as DraftResponse;
          const serverVersion = item.response?.eventVersion ?? 0;
          if (draft.eventVersion <= serverVersion) localStorage.removeItem(draftKey(testId, item.id));
          else void save(item, draft);
        } catch { /* ignore corrupt device-only drafts */ }
      }
    };
    window.addEventListener('online', retry);
    if (navigator.onLine) retry();
    return () => window.removeEventListener('online', retry);
  }, [save, test, testId]);

  const changeAnswer = (selectedOption: DraftResponse['selectedOption']) => {
    if (!currentItem) return;
    const current = responses[currentItem.id] ?? { selectedOption: null, visited: true, markedForReview: false, eventVersion: 0, activeTimeSeconds: 0 };
    void save(currentItem, { ...current, selectedOption, visited: true, eventVersion: current.eventVersion + 1 });
  };

  const move = async (delta: number, mark?: boolean) => {
    if (!currentItem) return;
    const current = responses[currentItem.id] ?? { selectedOption: null, visited: true, markedForReview: false, eventVersion: 0, activeTimeSeconds: 0 };
    if (mark !== undefined) await save(currentItem, { ...current, markedForReview: mark, eventVersion: current.eventVersion + 1 });
    const index = visibleItems.findIndex((item) => item.id === currentItem.id);
    const target = visibleItems[Math.max(0, Math.min(visibleItems.length - 1, index + delta))];
    if (target) {
      setCurrentItemId(target.id);
      try { localStorage.setItem(lastItemKey(testId, target.sectionKey), target.id); } catch { /* best effort */ }
      activeSince.current = Date.now();
    }
  };

  useEffect(() => {
    if (test?.status !== 'in_progress' || !currentItem) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const optionIndex = ['a', 'b', 'c', 'd', '1', '2', '3', '4'].indexOf(event.key.toLowerCase());
      if (optionIndex >= 0) { event.preventDefault(); changeAnswer(OPTION_KEYS[optionIndex % 4]!); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); void move(1); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); void move(-1); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const start = async () => {
    if (!confirmed || starting) return;
    setStarting(true); setError(null);
    try {
      const response = await fetch(`/api/mock-tests/${testId}/start`, {
        method: 'POST', credentials: 'include', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timingMode: mode }),
      });
      const body = await response.json() as { message?: string };
      if (!response.ok) throw new Error(body.message ?? 'Could not start the test.');
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not start the test.'); }
    finally { setStarting(false); }
  };

  const chooseSection = (sectionKey: MockSectionKey) => {
    if (timing?.timingStrategy === 'sectional') return;
    setSelectedSectionKey(sectionKey);
    const sectionItems = test?.items.filter((item) => item.sectionKey === sectionKey) ?? [];
    let remembered: string | null = null;
    try { remembered = localStorage.getItem(lastItemKey(testId, sectionKey)); } catch { /* best effort */ }
    const target = sectionItems.find((item) => item.id === remembered) ?? sectionItems[0];
    if (target) setCurrentItemId(target.id);
    activeSince.current = Date.now();
  };

  const submit = async () => {
    if (!test || !config || finalizing.current) return;
    const summary = config.sections.map((section) => {
      const counts = test.items.filter((item) => item.sectionKey === section.key).reduce((result, item) => {
        if (responses[item.id]?.selectedOption) result.answered += 1; else result.unanswered += 1;
        if (responses[item.id]?.markedForReview) result.marked += 1;
        return result;
      }, { answered: 0, unanswered: 0, marked: 0 });
      return `${section.label}: ${counts.answered} answered, ${counts.unanswered} unanswered, ${counts.marked} marked`;
    }).join('\n');
    if (!window.confirm(`Submit this test?\n\n${summary}\n\nThis cannot be undone.`)) return;
    finalizing.current = true;
    setSaveState('saving');
    await saveQueue.current;
    const response = await fetch(`/api/mock-tests/${testId}/submit`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}',
    });
    if (response.ok) router.replace(`/mock-tests/${testId}/result`);
    else { finalizing.current = false; setSaveState('error'); }
  };

  if (loading && !test) return <main className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-700" aria-label="Loading mock test" /></main>;
  if (error && !test) return <main className="mx-auto max-w-xl px-4 py-20 text-center"><p className="text-red-700" role="alert">{error}</p><Link href="/profile#mock-tests" className="mt-5 inline-flex font-bold text-violet-700">Back to mock tests</Link></main>;
  if (!test || !config || !rules) return null;

  if (test.status === 'not_started') {
    const global = rules.timingStrategy === 'global';
    return (
      <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <p className="text-sm font-bold uppercase tracking-wide text-violet-700">Not started · Pattern {config.rules.patternYear} · {test.blueprintCode}</p>
          <h1 className="mt-3 text-3xl font-extrabold">{test.title}</h1>
          <p className="mt-3 text-slate-600">Generated and saved at {new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(test.createdAt))}. Generation did not start the clock.</p>
          <dl className="mt-6 grid gap-3 sm:grid-cols-4">{[['Questions', '100'], ['Maximum marks', '200'], ['Correct', '+2.00'], ['Wrong', '−0.50']].map(([label, value]) => <div key={label} className="rounded-2xl bg-slate-50 p-4"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 text-xl font-extrabold">{value}</dd></div>)}</dl>
          <section className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5" aria-labelledby="strict-rules-heading">
            <h2 id="strict-rules-heading" className="font-extrabold text-amber-950">Strict no-pause instructions</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-amber-950">
              <li>{global ? 'All four sections remain open and you may switch freely until the global deadline.' : 'The four sections run in official order. A completed section locks permanently.'}</li>
              <li>Closing the tab, going offline or signing out does not stop server time.</li>
              <li>The English section is English-only; other sections support English and Hindi in QuestionWale&apos;s current inventory.</li>
              <li>No calculator is provided. Answers autosave, but late offline drafts are rejected.</li>
            </ul>
          </section>
          <fieldset className="mt-7">
            <legend className="text-lg font-extrabold">Choose timing before start</legend>
            <label className="mt-3 flex cursor-pointer gap-3 rounded-2xl border border-slate-200 p-4"><input type="radio" name="mode" checked={mode === 'standard'} onChange={() => setMode('standard')} /><span><strong>Standard · 60 minutes</strong><span className="mt-1 block text-sm text-slate-600">{global ? 'One global timer with free section navigation.' : '15 minutes per section. Comparable standard mode.'}</span></span></label>
            <label className="mt-3 flex cursor-pointer gap-3 rounded-2xl border border-slate-200 p-4"><input type="radio" name="mode" checked={mode === 'scribe_simulation'} onChange={() => setMode('scribe_simulation')} /><span><strong>Eligible-scribe accessibility simulation · 80 minutes</strong><span className="mt-1 block text-sm text-slate-600">{global ? 'One global 80-minute timer.' : '20 minutes per section.'} Excluded from standard comparisons.</span></span></label>
          </fieldset>
          <label className="mt-6 flex items-start gap-3 text-sm font-semibold"><input className="mt-1 h-4 w-4" type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>I have read the instructions and understand that the clock cannot be paused.</span></label>
          {error ? <p className="mt-4 text-sm text-red-700" role="alert">{error}</p> : null}
          <div className="mt-7 flex flex-wrap gap-3"><button type="button" disabled={!confirmed || starting} onClick={() => void start()} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-violet-700 px-6 font-bold text-white disabled:bg-slate-300">{starting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Start Test</button><Link href="/profile#mock-tests" className="inline-flex min-h-12 items-center px-4 font-bold text-violet-700">Start later from profile</Link></div>
        </div>
      </main>
    );
  }

  const englishOptions = getOptionsForLang(currentItem?.options as never, 'en');
  const hindiOptions = getOptionsForLang(currentItem?.options as never, 'hi');
  const hindiQuestion = currentItem ? getQuestionLocalizedText(currentItem.question, 'hi') : '';
  const englishQuestion = currentItem ? getQuestionLocalizedText(currentItem.question, 'en') : '';
  const currentResponse = currentItem ? responses[currentItem.id] : undefined;
  const activeIndex = visibleItems.findIndex((item) => item.id === currentItem?.id);
  const saveCopy = saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : saveState === 'offline' ? 'Offline — will retry' : saveState === 'error' ? 'Save failed' : 'Ready';
  const displayedRemaining = timing?.timingStrategy === 'global' ? timing.remainingTotalSeconds : timing?.remainingSectionSeconds ?? 0;

  return (
    <main className="min-h-screen bg-[#F3F4F6] text-slate-950">
      <p className="sr-only" aria-live="polite">{timerAnnouncement}</p>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-5">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm font-black text-violet-700">QuestionWale</p><p className="text-xs font-semibold text-slate-600">{config.title} · {visibleSection?.label}</p></div>
          <div className="flex items-center gap-4"><span className="text-sm font-semibold">Question {activeIndex + 1}/25</span><span aria-label={`${displayedRemaining} seconds remaining`} className={`rounded-lg px-3 py-2 font-mono text-lg font-black ${displayedRemaining <= 60 ? 'bg-red-100 text-red-800' : 'bg-slate-900 text-white'}`}>{countdown(displayedRemaining)}</span><span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">{saveState === 'offline' ? <CloudOff className="h-4 w-4" /> : saveState === 'saved' ? <Check className="h-4 w-4 text-emerald-600" /> : saveState === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saveCopy}</span></div>
        </div>
      </header>
      <div className="mx-auto max-w-[1500px] px-3 pt-3 sm:px-5 sm:pt-5">
        <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-label="Test sections">
          {config.sections.map((section, index) => {
            const locked = timing?.timingStrategy === 'sectional' && index !== forcedSectionIndex;
            const selected = section.key === visibleSection?.key;
            const answered = test.items.filter((item) => item.sectionKey === section.key && responses[item.id]?.selectedOption).length;
            return <button key={section.key} type="button" disabled={locked} aria-current={selected ? 'page' : undefined} onClick={() => chooseSection(section.key)} className={`min-h-12 rounded-xl border px-3 text-left text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 ${selected ? 'border-violet-700 bg-violet-700 text-white' : locked ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : 'border-slate-200 bg-white text-slate-700 hover:border-violet-300'}`}><span className="block truncate">{section.label}</span><span className="mt-0.5 block font-medium opacity-80">{answered}/25 answered{locked ? ' · locked' : ''}</span></button>;
          })}
        </nav>
      </div>
      <div className="mx-auto grid max-w-[1500px] gap-4 p-3 sm:p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7" aria-labelledby="mock-question-heading">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <h1 id="mock-question-heading" className="font-extrabold">Question {currentItem?.sectionOrder}</h1>
            {currentItem?.sectionKey !== 'english' ? <div className="flex rounded-lg border border-slate-200 p-1" role="group" aria-label="Question language">{(['en', 'hi', 'both'] as const).map((value) => <button key={value} type="button" onClick={() => setLanguage(value)} className={`min-h-9 rounded-md px-3 text-xs font-bold ${language === value ? 'bg-violet-700 text-white' : 'text-slate-600'}`}>{value === 'en' ? 'English' : value === 'hi' ? 'हिन्दी' : 'Both'}</button>)}</div> : <span className="text-xs font-bold text-slate-500">English-only section</span>}
          </div>
          {currentItem?.passage ? <div className="mt-5 space-y-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm leading-7">{language !== 'hi' ? <p>{getQuestionLocalizedText(currentItem.passage, 'en')}</p> : null}{language !== 'en' && currentItem.sectionKey !== 'english' ? <p lang="hi" className={language === 'both' ? 'border-t border-indigo-100 pt-3' : ''}>{getQuestionLocalizedText(currentItem.passage, 'hi')}</p> : null}</div> : null}
          <div className="mt-6 space-y-3 text-base leading-7 sm:text-lg">{language !== 'hi' ? <p>{englishQuestion}</p> : null}{language !== 'en' && currentItem?.sectionKey !== 'english' ? <p lang="hi" className={language === 'both' ? 'border-t border-slate-100 pt-3' : ''}>{hindiQuestion}</p> : null}</div>
          <div className="mt-7 grid gap-3">{OPTION_KEYS.map((displayKey, index) => {
            const originalKey = currentItem?.optionOrder[index] ?? displayKey;
            const selected = currentResponse?.selectedOption === displayKey;
            return <button key={displayKey} type="button" onClick={() => changeAnswer(displayKey)} aria-pressed={selected} className={`flex min-h-14 items-start gap-3 rounded-xl border p-4 text-left text-sm leading-6 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 ${selected ? 'border-violet-600 bg-violet-50' : 'border-slate-200 hover:border-violet-300'}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-black ${selected ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-300'}`}>{displayKey}</span><span className="space-y-1">{language !== 'hi' ? <span className="block">{englishOptions[originalKey]}</span> : null}{language !== 'en' && currentItem?.sectionKey !== 'english' ? <span lang="hi" className={`block ${language === 'both' ? 'border-t border-slate-100 pt-1 text-slate-700' : ''}`}>{hindiOptions[originalKey]}</span> : null}</span></button>;
          })}</div>
          <div className="mt-7 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
            <button type="button" disabled={activeIndex <= 0} onClick={() => void move(-1)} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-300 px-4 font-bold disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Previous</button>
            <button type="button" onClick={() => changeAnswer(null)} className="min-h-11 rounded-xl border border-slate-300 px-4 font-bold">Clear Response</button>
            <button type="button" onClick={() => void move(1, !currentResponse?.markedForReview)} className="min-h-11 rounded-xl border border-amber-300 bg-amber-50 px-4 font-bold text-amber-900">Mark for Review &amp; Next</button>
            <button type="button" disabled={activeIndex >= visibleItems.length - 1} onClick={() => void move(1)} className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-xl bg-violet-700 px-5 font-bold text-white disabled:opacity-40">Save &amp; Next <ChevronRight className="h-4 w-4" /></button>
          </div>
        </section>
        <aside className="hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:block" aria-label="Question palette"><Palette items={visibleItems} currentItemId={currentItem?.id ?? null} responses={responses} onSelect={setCurrentItemId} /><button type="button" onClick={() => void submit()} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 font-bold text-red-700"><Send className="h-4 w-4" /> Submit Test</button></aside>
        <details className="rounded-2xl border border-slate-200 bg-white p-4 lg:hidden"><summary className="cursor-pointer font-extrabold">Open question palette</summary><div className="mt-4"><Palette items={visibleItems} currentItemId={currentItem?.id ?? null} responses={responses} onSelect={setCurrentItemId} /><button type="button" onClick={() => void submit()} className="mt-5 min-h-12 w-full rounded-xl border border-red-200 bg-red-50 font-bold text-red-700">Submit Test</button></div></details>
      </div>
    </main>
  );
}

function Palette({ items, currentItemId, responses, onSelect }: { items: MockShellItem[]; currentItemId: string | null; responses: Record<string, DraftResponse>; onSelect: (id: string) => void }) {
  return <><h2 className="font-extrabold">Question palette</h2><div className="mt-4 grid grid-cols-5 gap-2">{items.map((item) => {
    const state = paletteState(item, responses[item.id], item.id === currentItemId);
    const style = state === 'Current' ? 'bg-slate-900 text-white ring-2 ring-violet-300' : state === 'Answered and marked' ? 'bg-violet-700 text-white' : state === 'Marked for review' ? 'bg-amber-100 text-amber-900 border-amber-300' : state === 'Answered' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : state === 'Visited, unanswered' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-white text-slate-700 border-slate-300';
    return <button key={item.id} type="button" title={state} aria-label={`Question ${item.sectionOrder}: ${state}`} onClick={() => onSelect(item.id)} className={`aspect-square min-h-11 rounded-lg border text-sm font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 ${style}`}>{item.sectionOrder}</button>;
  })}</div><ul className="mt-5 grid gap-2 text-xs text-slate-600"><li>Green: answered</li><li>Amber: marked</li><li>Violet: answered and marked</li><li>Red outline: visited, unanswered</li></ul></>;
}
