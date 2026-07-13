'use client';

import Link from 'next/link';
import { AlertTriangle, Layers, Scale, Shield, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  sourcesRevisionContent,
  type BiString,
  type RevisionSourceCard,
} from '@/content/revision/indian-polity/sources-of-indian-constitution.v1';
import { useLanguage } from '@/lib/LanguageContext';
import { trackRevisionEvent } from '@/lib/revision/trackRevisionEvent';
import { BiText, pick, type LangMode } from './lib/bilingual';
import { Reveal } from './lib/Reveal';
import { CAPSULE_TO_KEY, SOURCE_VISUAL, type SourceKey } from './lib/revisionVisualTokens';
import { FourStreamTiles, HeroStreamsSketch } from './visuals/HeroAndStreams';
import { PassportCardArt } from './visuals/PassportCards';
import { CoverRecallStrip } from './visuals/MnemonicStudio';
import { TimelineJourney } from './visuals/TimelineJourney';
import { ConfusionClinic } from './visuals/ConfusionClinic';
import { SourceBookshelf } from './visuals/SourceBookshelf';
import { InteractiveMindmap } from './InteractiveMindmap';

type BreadcrumbInfo = {
  subjectSlug: string;
  subjectTitle: BiString;
  topicSlug: string;
  topicTitle: BiString;
  subtopicTitle: BiString;
};

type Props = {
  practiceHref: string;
  breadcrumb: BreadcrumbInfo;
};

const SECTIONS = [
  { id: 'rescue', en: 'Rescue', hi: 'Rescue' },
  { id: 'source-map', en: 'Atlas', hi: 'Atlas' },
  { id: 'mnemonics', en: 'Mnemonics', hi: 'Mnemonics' },
  { id: 'indian', en: 'Journey', hi: 'यात्रा' },
  { id: 'mindmap', en: 'Mindmap', hi: 'Mindmap' },
  { id: 'confusion', en: 'Clinic', hi: 'Clinic' },
  { id: 'exam-rules', en: 'Rules', hi: 'Rules' },
  { id: 'sources', en: 'Shelf', hi: 'Shelf' },
] as const;

const LANG_OPTIONS: { id: LangMode; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिंदी' },
  { id: 'both', label: 'Both' },
];

const EXAM_ICONS = [Scale, AlertTriangle, Layers, Shield, Sparkles];

function dedupeSources(cards: readonly RevisionSourceCard[]): RevisionSourceCard[] {
  const seen = new Set<string>();
  const out: RevisionSourceCard[] = [];
  for (const card of cards) {
    const key = card.url.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(card);
  }
  return out;
}

function PracticeCta({
  href,
  mode,
  placement,
  onClick,
  sticky = false,
}: {
  href: string;
  mode: LangMode;
  placement: 'primary' | 'final';
  onClick: () => void;
  sticky?: boolean;
}) {
  const cta = sourcesRevisionContent.cta;
  const shell = sticky
    ? 'fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur min-[360px]:px-4 min-[360px]:pt-3 md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none'
    : '';

  return (
    <div className={shell}>
      <div
        className={`min-w-0 rounded-2xl border border-brand/20 bg-[#F5F3FF] p-3 min-[360px]:p-4 sm:p-5 ${
          sticky ? 'mx-auto max-w-4xl md:mx-0' : ''
        }`}
      >
        <BiText text={cta.support} mode={mode} className="text-xs text-slate-600 min-[360px]:text-sm" />
        <Link
          href={href}
          onClick={onClick}
          className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-brand px-3 py-2.5 text-center text-xs font-semibold leading-snug text-white shadow-sm transition hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 min-[360px]:px-4 min-[360px]:py-3 min-[360px]:text-sm"
          data-revision-cta={placement}
        >
          {pick(cta.label, mode)}
        </Link>
      </div>
    </div>
  );
}

export default function SourcesRevisionClient({ practiceHref, breadcrumb }: Props) {
  const { language, setLanguage } = useLanguage();
  const [mode, setMode] = useState<LangMode>(language);
  const [viewed, setViewed] = useState<Set<string>>(() => new Set());
  const [activeSection, setActiveSection] = useState<(typeof SECTIONS)[number]['id']>(SECTIONS[0].id);
  const [activeSource, setActiveSource] = useState<SourceKey | null>(null);
  const [openCapsule, setOpenCapsule] = useState<string | null>(null);
  const openedRef = useRef(false);
  const mindmapTracked = useRef(false);
  const sectionNavRef = useRef<HTMLElement>(null);
  const sectionChipRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const content = sourcesRevisionContent;
  const sourceCards = useMemo(() => dedupeSources(content.sources), [content.sources]);

  useEffect(() => {
    setMode((prev) => (prev === 'both' ? 'both' : language));
  }, [language]);

  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    trackRevisionEvent('revision_opened', { version: content.version });
  }, [content.version]);

  useEffect(() => {
    const nodes = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (!nodes.length) return;

    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (!id) continue;
          ratios.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);

          if (entry.isIntersecting) {
            setViewed((prev) => {
              if (prev.has(id)) return prev;
              const next = new Set(prev);
              next.add(id);
              return next;
            });
            if (id === 'mindmap' && !mindmapTracked.current) {
              mindmapTracked.current = true;
              trackRevisionEvent('revision_mindmap_viewed', { version: content.version });
            }
          }
        }

        let bestId: (typeof SECTIONS)[number]['id'] = SECTIONS[0].id;
        let bestRatio = -1;
        for (const section of SECTIONS) {
          const r = ratios.get(section.id) ?? 0;
          if (r > bestRatio) {
            bestRatio = r;
            bestId = section.id;
          }
        }
        if (bestRatio > 0) {
          setActiveSection(bestId);
        }
      },
      { rootMargin: '-18% 0px -55% 0px', threshold: [0, 0.15, 0.35, 0.55, 0.75] },
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [content.version]);

  // Keep the active section chip visible in the one-line nav
  useEffect(() => {
    const chip = sectionChipRefs.current[activeSection];
    const nav = sectionNavRef.current;
    if (!chip || !nav) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const chipLeft = chip.offsetLeft;
    const chipWidth = chip.offsetWidth;
    const target = chipLeft - (nav.clientWidth - chipWidth) / 2;
    nav.scrollTo({
      left: Math.max(0, target),
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, [activeSection]);

  const completionPct = Math.round((viewed.size / SECTIONS.length) * 100);

  useEffect(() => {
    if (completionPct < 100) return;
    trackRevisionEvent('revision_marked_complete', { version: content.version });
  }, [completionPct, content.version]);

  const setModePreservingScroll = (next: LangMode) => {
    const y = window.scrollY;
    setMode(next);
    if (next === 'en' || next === 'hi') setLanguage(next);
    requestAnimationFrame(() => window.scrollTo(0, y));
  };

  const onCta = (placement: 'primary' | 'final') => {
    trackRevisionEvent('revision_cta_clicked', { version: content.version, cta: placement });
  };

  const onSourceClick = (url: string) => {
    let host = '';
    try {
      host = new URL(url).hostname;
    } catch {
      host = 'unknown';
    }
    trackRevisionEvent('revision_source_clicked', { version: content.version, host });
  };

  const selectPassport = (key: SourceKey, capsuleId: string) => {
    setActiveSource(key);
    setOpenCapsule(capsuleId);
    const el = document.getElementById(`capsule-${capsuleId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const onMindmapSelect = (key: SourceKey | null) => {
    setActiveSource(key);
    if (!key) return;
    const capsuleId = Object.entries(CAPSULE_TO_KEY).find(([, v]) => v === key)?.[0];
    if (capsuleId) setOpenCapsule(capsuleId);
  };

  const topicHref = `/subjects/${breadcrumb.subjectSlug}/${breadcrumb.topicSlug}`;

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-clip bg-[#F8FAFC] pb-32 md:pb-14">
      <div className="mx-auto w-full min-w-0 max-w-4xl px-2 pt-4 min-[360px]:px-4 min-[360px]:pt-6 sm:px-6">
        <nav className="mb-3 text-[11px] text-slate-500 min-[360px]:mb-4 min-[360px]:text-sm" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 break-words min-[360px]:gap-1.5">
            <li className="min-w-0">
              <Link href={`/subjects/${breadcrumb.subjectSlug}`} className="hover:text-brand">
                {pick(breadcrumb.subjectTitle, mode === 'both' ? 'en' : mode)}
              </Link>
            </li>
            <li aria-hidden className="text-slate-300">
              /
            </li>
            <li>
              <Link href={topicHref} className="hover:text-brand">
                {mode === 'hi' ? 'विषय 2' : 'Topic 2'}
              </Link>
            </li>
            <li aria-hidden className="text-slate-300">
              /
            </li>
            <li className="min-w-0 font-medium text-slate-700">
              {pick(breadcrumb.subtopicTitle, mode === 'both' ? 'en' : mode)}
            </li>
          </ol>
        </nav>

        {/* Hero split */}
        <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm min-[360px]:rounded-3xl">
          <div className="grid min-w-0 items-center gap-3 p-3 min-[360px]:gap-4 min-[360px]:p-5 sm:p-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-brand min-[360px]:text-xs">
                Revision
              </p>
              <h1 className="mt-1 break-words text-xl font-bold tracking-tight text-slate-900 min-[360px]:text-2xl sm:text-3xl">
                {pick(content.header.title, mode === 'both' ? 'en' : mode)}
              </h1>
              {mode === 'both' ? (
                <p className="mt-1 break-words text-sm text-slate-500 min-[360px]:text-base">{content.header.title.hi}</p>
              ) : null}
              <BiText text={content.header.subtitle} mode={mode} className="mt-2 text-xs text-slate-600 min-[360px]:text-sm" />
              <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-slate-600 min-[360px]:mt-4 min-[360px]:gap-2 min-[360px]:text-xs">
                <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 min-[360px]:px-2.5">
                  {mode === 'hi'
                    ? `~${content.estimatedMinutes} मिनट`
                    : `~${content.estimatedMinutes} min read`}
                </span>
                <span className="max-w-full break-words rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-amber-900 min-[360px]:px-2.5">
                  {pick(content.header.reason, mode === 'both' ? 'en' : mode)}
                </span>
                <span className="rounded-lg border border-slate-200 bg-white px-2 py-1 min-[360px]:px-2.5" aria-live="polite">
                  {mode === 'hi' ? `देखा ${completionPct}%` : `Viewed ${completionPct}%`}
                </span>
              </div>
              <div
                className="mt-3 flex w-full max-w-full flex-wrap rounded-xl border border-slate-200 bg-zinc-50 p-0.5 text-[10px] font-semibold min-[360px]:mt-4 min-[360px]:inline-flex min-[360px]:w-auto min-[360px]:rounded-full min-[360px]:text-xs"
                role="group"
                aria-label="Language"
              >
                {LANG_OPTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setModePreservingScroll(item.id)}
                    className={`min-w-0 flex-1 rounded-lg px-2 py-1.5 transition min-[360px]:flex-none min-[360px]:rounded-full min-[360px]:px-3 ${
                      mode === item.id ? 'bg-white text-brand shadow-sm' : 'text-slate-500'
                    }`}
                    aria-pressed={mode === item.id}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mx-auto aspect-[420/320] w-full max-w-full min-w-0">
              <HeroStreamsSketch className="h-auto max-h-[220px] w-full min-[360px]:max-h-none" />
            </div>
          </div>
        </header>

        {/* Section nav — one line, swipe/scrollable, auto-follows active section */}
        <nav
          ref={sectionNavRef}
          className="sticky top-[72px] z-30 mt-3 max-[359px]:top-14 min-w-0 overflow-x-auto overscroll-x-contain border-y border-slate-200 bg-[#F8FAFC]/95 py-2 backdrop-blur [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[360px]:mt-4 sm:rounded-xl sm:border sm:px-2"
          aria-label={mode === 'hi' ? 'अनुभाग नेविगेशन' : 'Section navigation'}
        >
          <ul className="flex w-max min-w-full flex-nowrap gap-1 px-0.5 min-[360px]:gap-1.5">
            {SECTIONS.map((section) => {
              const seen = viewed.has(section.id);
              const active = activeSection === section.id;
              return (
                <li key={section.id} className="shrink-0">
                  <a
                    ref={(el) => {
                      sectionChipRefs.current[section.id] = el;
                    }}
                    href={`#${section.id}`}
                    aria-current={active ? 'true' : undefined}
                    onClick={() => setActiveSection(section.id)}
                    className={`inline-flex whitespace-nowrap rounded-lg px-2 py-1.5 text-[10px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 min-[360px]:px-2.5 min-[360px]:text-xs ${
                      active
                        ? 'bg-brand text-white shadow-sm'
                        : seen
                          ? 'bg-brand/10 text-brand'
                          : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {mode === 'hi' ? section.hi : section.en}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Rescue zone */}
        <Reveal>
          <section id="rescue" className="mt-6 scroll-mt-36">
            <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 min-[360px]:rounded-3xl min-[360px]:p-5 sm:p-6">
              <BiText text={content.rescue.title} mode={mode} as="h2" className="text-base font-semibold text-slate-900 min-[360px]:text-lg" />
              <FourStreamTiles className="mt-4" />
              <BiText
                text={content.rescue.hiLead}
                mode={mode}
                className="mt-4 text-xs leading-relaxed text-slate-700 min-[360px]:text-sm"
              />
              <ol className="mt-3 grid gap-2 sm:grid-cols-2">
                {content.rescue.streams.map((stream, i) => {
                  const colors = ['#7C3AED', '#0F766E', '#1D4ED8', '#6D28D9'];
                  return (
                    <li
                      key={i}
                      className="min-w-0 rounded-xl border px-2.5 py-2 text-xs leading-snug text-slate-700 min-[360px]:px-3 min-[360px]:py-2.5 min-[360px]:text-sm"
                      style={{ borderColor: `${colors[i]}33`, background: `${colors[i]}0D` }}
                    >
                      <span className="mr-1.5 font-bold" style={{ color: colors[i] }}>
                        {i + 1}.
                      </span>
                      <BiText text={stream} mode={mode} as="span" />
                    </li>
                  );
                })}
              </ol>
              <div className="mt-4 rounded-xl border border-brand/15 bg-[#F5F3FF] px-3 py-3 min-[360px]:px-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-brand min-[360px]:text-xs">
                  Golden Rule
                </p>
                <BiText text={content.rescue.goldenRule} mode={mode} className="mt-1 text-xs font-medium text-slate-800 min-[360px]:text-sm" />
              </div>
            </div>
            <div className="mt-4">
              <PracticeCta href={practiceHref} mode={mode} placement="primary" onClick={() => onCta('primary')} />
            </div>
          </section>
        </Reveal>

        {/* Source atlas */}
        <Reveal>
          <section id="source-map" className="mt-8 scroll-mt-36">
            <h2 className="text-lg font-semibold text-slate-900">
              {pick(content.sourceMap.title, mode === 'both' ? 'en' : mode)}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'hi'
                ? 'पासपोर्ट कार्ड चुनें — नीचे विवरण खुलता है।'
                : 'Tap a passport card to open its detail capsule below.'}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-3">
              {content.capsules.map((capsule) => {
                const key = CAPSULE_TO_KEY[capsule.id] ?? 'britain';
                return (
                  <PassportCardArt
                    key={capsule.id}
                    source={key}
                    title={pick(capsule.title, mode === 'both' ? 'en' : mode)}
                    memory={pick(capsule.memory, mode)}
                    selected={activeSource === key || openCapsule === capsule.id}
                    onSelect={() => selectPassport(key, capsule.id)}
                  />
                );
              })}
            </div>

            {/* Narrow: stacked source cards */}
            <div className="mt-4 space-y-2 md:hidden">
              {content.sourceMap.rows.map((row) => (
                <article
                  key={row.source.en}
                  className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {mode === 'hi' ? 'स्रोत' : 'Source'}
                  </p>
                  <BiText text={row.source} mode={mode} className="text-sm font-semibold text-slate-900" />
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {mode === 'hi' ? 'सत्यापित प्रभाव' : 'Verified influence'}
                  </p>
                  <BiText text={row.influence} mode={mode} className="text-xs text-slate-700" />
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Memory</p>
                  <BiText text={row.memory} mode={mode} className="text-xs text-slate-600" />
                </article>
              ))}
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2.5 text-xs text-amber-950 min-[360px]:px-3 min-[360px]:text-sm" role="note">
                <span className="font-semibold">{mode === 'hi' ? 'सावधानी: ' : 'Caution: '}</span>
                <BiText text={content.sourceMap.caution} mode={mode} as="span" />
              </div>
            </div>

            {/* md+: table */}
            <div className="mt-4 hidden min-w-0 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 md:block sm:p-4">
              <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-3 font-semibold">{mode === 'hi' ? 'स्रोत' : 'Source'}</th>
                    <th className="py-2 pr-3 font-semibold">
                      {mode === 'hi' ? 'सत्यापित प्रभाव' : 'Verified influence'}
                    </th>
                    <th className="py-2 font-semibold">Memory</th>
                  </tr>
                </thead>
                <tbody>
                  {content.sourceMap.rows.map((row) => (
                    <tr key={row.source.en} className="border-b border-slate-100 align-top">
                      <td className="py-3 pr-3 font-semibold text-slate-900">
                        <BiText text={row.source} mode={mode} as="span" className="block" />
                      </td>
                      <td className="py-3 pr-3 text-slate-700">
                        <BiText text={row.influence} mode={mode} as="span" className="block" />
                      </td>
                      <td className="py-3 text-slate-600">
                        <BiText text={row.memory} mode={mode} as="span" className="block" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950" role="note">
                <span className="font-semibold">{mode === 'hi' ? 'सावधानी: ' : 'Caution: '}</span>
                <BiText text={content.sourceMap.caution} mode={mode} as="span" />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">
                {mode === 'hi' ? 'स्रोत विवरण' : 'Source detail capsules'}
              </h3>
              {content.capsules.map((capsule) => {
                const key = CAPSULE_TO_KEY[capsule.id] ?? 'britain';
                const v = SOURCE_VISUAL[key];
                const open = openCapsule === capsule.id;
                return (
                  <details
                    key={capsule.id}
                    id={`capsule-${capsule.id}`}
                    open={open}
                    onToggle={(e) => {
                      if (e.currentTarget.open) {
                        setOpenCapsule(capsule.id);
                        setActiveSource(key);
                      } else if (openCapsule === capsule.id) {
                        setOpenCapsule(null);
                      }
                    }}
                    className="scroll-mt-40 rounded-2xl border bg-white open:shadow-sm"
                    style={{ borderColor: open ? v.hex : v.border }}
                  >
                    <summary className="cursor-pointer list-none px-2.5 py-2.5 marker:content-none min-[360px]:px-4 min-[360px]:py-3 [&::-webkit-details-marker]:hidden">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                          style={{ background: v.hex }}
                        >
                          {v.motif}
                        </span>
                        <BiText
                          text={capsule.title}
                          mode={mode}
                          as="span"
                          className="min-w-0 font-semibold text-slate-900"
                        />
                      </span>
                    </summary>
                    <div className="space-y-3 border-t border-slate-100 px-2.5 py-3 text-sm min-[360px]:px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {capsule.influences.map((item, i) => (
                          <span
                            key={i}
                            className="rounded-full border px-2.5 py-1 text-[11px] font-medium text-slate-700"
                            style={{ borderColor: v.border, background: v.soft }}
                          >
                            {pick(item, mode === 'both' ? 'en' : mode)}
                          </span>
                        ))}
                      </div>
                      <div className="rounded-xl px-3 py-2" style={{ background: v.soft }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Memory</p>
                        <BiText text={capsule.memory} mode={mode} className="mt-0.5 font-medium text-slate-800" />
                      </div>
                      <details className="rounded-xl border border-rose-100 bg-rose-50/50 px-3 py-2">
                        <summary className="cursor-pointer text-xs font-semibold text-rose-900">
                          {mode === 'hi' ? 'Confusion alerts' : 'Confusion alerts'}
                        </summary>
                        <ul className="mt-2 space-y-1.5 text-xs text-rose-950">
                          {capsule.alerts.map((alert, i) => (
                            <li key={i}>
                              <BiText text={alert} mode={mode} as="span" />
                            </li>
                          ))}
                        </ul>
                      </details>
                      <details className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <summary className="cursor-pointer text-xs font-semibold text-slate-700">
                          {mode === 'hi' ? 'भारतीय anchors' : 'Current Indian anchors'}
                        </summary>
                        <BiText text={capsule.anchors} mode={mode} className="mt-1.5 text-xs text-slate-600" />
                      </details>
                    </div>
                  </details>
                );
              })}
            </div>
          </section>
        </Reveal>

        {/* Mnemonic studio */}
        <Reveal>
          <section id="mnemonics" className="mt-8 scroll-mt-36">
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === 'hi' ? 'Mnemonic Studio' : 'Mnemonic Studio'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'hi'
                ? 'प्रत्येक memory sentence अपने component chips से जुड़ा है।'
                : 'Each memory sentence links visually to its component chips.'}
            </p>
            <div className="mt-4">
              <CoverRecallStrip mode={mode} highlight={activeSource} />
            </div>
          </section>
        </Reveal>

        {/* Indian journey */}
        <Reveal>
          <section id="indian" className="mt-8 scroll-mt-36 min-w-0 rounded-2xl border border-slate-200 bg-white p-3 min-[360px]:rounded-3xl min-[360px]:p-5 sm:p-6">
            <BiText
              text={content.indianSources.title}
              mode={mode}
              as="h2"
              className="text-base font-semibold text-slate-900 min-[360px]:text-lg"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {content.indianSources.blocks.map((block) => (
                <article
                  key={block.title.en}
                  className="min-w-0 rounded-xl border border-violet-100 bg-[#F5F3FF]/60 p-2.5 min-[360px]:p-3"
                >
                  <BiText text={block.title} mode={mode} as="h3" className="text-sm font-semibold text-slate-900" />
                  <BiText text={block.body} mode={mode} className="mt-1 text-xs leading-relaxed text-slate-700" />
                </article>
              ))}
            </div>
            <h3 className="mt-6 text-sm font-semibold text-slate-900">
              {pick(content.indianSources.timeline.title, mode === 'both' ? 'en' : mode)}
            </h3>
            <div className="mt-3">
              <TimelineJourney mode={mode} />
            </div>
          </section>
        </Reveal>

        <Reveal>
          <div id="mindmap" className="mt-8 scroll-mt-36">
            <InteractiveMindmap mode={mode} selected={activeSource} onSelectSource={onMindmapSelect} />
          </div>
        </Reveal>

        <Reveal>
          <section id="confusion" className="mt-8 scroll-mt-36">
            <BiText
              text={content.confusion.title}
              mode={mode}
              as="h2"
              className="text-lg font-semibold text-slate-900"
            />
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'hi'
                ? 'आम भ्रमित जोड़े — side by side।'
                : 'Commonly confused pairs — side by side.'}
            </p>
            <div className="mt-4">
              <ConfusionClinic mode={mode} />
            </div>
            <details className="mt-4 min-w-0 rounded-2xl border border-slate-200 bg-white p-3 min-[360px]:p-4">
              <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                {mode === 'hi' ? 'पूर्ण confusion table' : 'Full confusion table'}
              </summary>
              {/* Mobile cards */}
              <ul className="mt-3 space-y-2 md:hidden">
                {content.confusion.rows.map((row) => (
                  <li key={row.signal.en} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs">
                    <p className="font-semibold text-slate-800">
                      <BiText text={row.signal} mode={mode} as="span" />
                    </p>
                    <p className="mt-1 text-emerald-800">
                      ✓ <BiText text={row.correct} mode={mode} as="span" />
                    </p>
                    <p className="mt-0.5 text-rose-800">
                      ✗ <BiText text={row.trap} mode={mode} as="span" />
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-3 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                      <th className="py-2 pr-3">Signal</th>
                      <th className="py-2 pr-3">Correct</th>
                      <th className="py-2">Trap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.confusion.rows.map((row) => (
                      <tr key={row.signal.en} className="border-b border-slate-100 align-top">
                        <td className="py-2 pr-3">
                          <BiText text={row.signal} mode={mode} as="span" />
                        </td>
                        <td className="py-2 pr-3 font-medium text-emerald-800">
                          <BiText text={row.correct} mode={mode} as="span" />
                        </td>
                        <td className="py-2 text-rose-800">
                          <BiText text={row.trap} mode={mode} as="span" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>
        </Reveal>

        <Reveal>
          <section id="exam-rules" className="mt-8 scroll-mt-36">
            <BiText
              text={content.examRules.title}
              mode={mode}
              as="h2"
              className="text-lg font-semibold text-slate-900"
            />
            <ol className="mt-4 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-3">
              {content.examRules.rules.map((rule, i) => {
                const Icon = EXAM_ICONS[i] ?? Sparkles;
                return (
                  <li
                    key={i}
                    className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm min-[360px]:p-4"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F3FF] text-brand">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-400">Rule {i + 1}</p>
                    <BiText text={rule} mode={mode} className="mt-1 text-sm leading-snug text-slate-800" />
                  </li>
                );
              })}
            </ol>
          </section>
        </Reveal>

        <Reveal>
          <section id="sources" className="mt-8 scroll-mt-36">
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === 'hi' ? 'Verified Source Shelf' : 'Verified Source Shelf'}
            </h2>
            <div className="mt-4">
              <SourceBookshelf cards={sourceCards} mode={mode} onOpen={onSourceClick} />
            </div>
          </section>
        </Reveal>

        <Reveal>
          <div className="mt-8 hidden rounded-3xl border border-slate-200 bg-white p-5 md:block">
            <p className="text-sm font-medium text-slate-700">
              {mode === 'hi'
                ? 'Revision देखा — अब Subtopic 2 के प्रश्नों पर लागू करें। Completion गारंटी नहीं है।'
                : 'Revision viewed — apply concepts on Subtopic 2 questions. Viewing does not guarantee zero mistakes.'}
            </p>
            <div className="mt-4">
              <PracticeCta href={practiceHref} mode={mode} placement="final" onClick={() => onCta('final')} />
            </div>
          </div>
        </Reveal>
      </div>

      <div className="md:hidden">
        <PracticeCta href={practiceHref} mode={mode} placement="final" onClick={() => onCta('final')} sticky />
      </div>
    </div>
  );
}
