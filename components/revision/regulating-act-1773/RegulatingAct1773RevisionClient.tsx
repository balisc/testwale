'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  BookOpen,
  Brain,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Columns,
  ExternalLink,
  FileText,
  GitCompare,
  HelpCircle,
  Languages,
  MessageCircle,
  Network,
  Scale,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Reveal } from '@/app/demo/lib/Reveal';
import { BiText, pick, type LangMode } from '@/app/demo/lib/bilingual';
import { regulatingActRevisionContent } from '@/content/revision/indian-polity/regulating-act-1773.v1';
import { getSource } from '@/content/revision/indian-polity/regulating-act-1773.sources';
import { useLanguage } from '@/lib/LanguageContext';
import { trackRevisionEvent } from '@/lib/revision/trackRevisionEvent';
import { RegulatingActMindMap } from './RegulatingActMindMap';
import {
  ExamTip,
  ExamWarning,
  RevisionCard,
  SectionHeading,
  SourceBadge,
  estimateReadingMinutes,
} from './shared';
import './revision-ui.css';
import {
  CouncilDiagramIllustration,
  LedgerIllustration,
  ParliamentIllustration,
  StatuteIllustration,
  StudentCtaIllustration,
  TradeShipIllustration,
} from './visuals';

const ICON_MAP: Record<string, LucideIcon> = {
  Zap, BookOpen, HelpCircle, FileText, Scale, GitCompare, Columns, Star,
  AlertTriangle, Brain, MessageCircle, ExternalLink, Network,
};

const STORY_VISUALS = {
  ship: TradeShipIllustration,
  ledger: LedgerIllustration,
  parliament: ParliamentIllustration,
  statute: StatuteIllustration,
} as const;

const SNAP_TINT: Record<string, string> = {
  violet: 'ra-snap--violet',
  indigo: 'ra-snap--indigo',
  purple: 'ra-snap--amber',
  blue: 'ra-snap--green',
  teal: 'ra-snap--rose',
  green: 'ra-snap--sky',
};

const SNAP_EMOJI: Record<string, string> = {
  Calendar: '📅',
  ScrollText: '📜',
  Crown: '👑',
  Users: '🏛️',
  Scale: '⚖️',
  Landmark: '🌐',
};

const WHY_EMOJI: Record<string, string> = {
  Building2: '🏛️',
  Coins: '💰',
  Network: '📋',
  Gavel: '⚖️',
};

const TIMELINE_EMOJI: Record<string, string> = {
  statute: '📜',
  court: '🏛️',
  conflict: '⚡',
  correction: '✅',
};

import type { RichRevisionClientProps } from '@/lib/revision/richRevisionClients';
import { useCatalogText } from '@/lib/useCatalogText';
import { uiLabel } from '@/components/revision/company-rule-and-early-acts/uiLabel';

type Props = RichRevisionClientProps;

function withExam(path: string, examQuery?: string | null) {
  if (!examQuery?.trim()) return path;
  return `${path}?exam=${encodeURIComponent(examQuery.trim())}`;
}

export default function RegulatingAct1773RevisionClient({ practiceHref, breadcrumb, examQuery }: Props) {
  const { language } = useLanguage();
  const subjectLabel = useCatalogText(breadcrumb.subjectTitle);
  const topicLabel = useCatalogText(breadcrumb.topicTitle);
  const subtopicLabel = useCatalogText(breadcrumb.subtopicTitle);
  const [mode, setMode] = useState<LangMode>(language);
  const [activeSection, setActiveSection] = useState<string>('snapshot');
  const [tocOpen, setTocOpen] = useState(false);
  const [provisionTab, setProvisionTab] = useState('administrative');
  const [factFilter, setFactFilter] = useState<string>('all');
  const [recallTab, setRecallTab] = useState<'recall' | 'tf' | 'chrono'>('recall');
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
  const [knownItems, setKnownItems] = useState<Set<number>>(new Set());
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showAllFacts, setShowAllFacts] = useState(false);
  const openedRef = useRef(false);
  const content = regulatingActRevisionContent;
  const resolvedPractice = withExam(practiceHref, examQuery);

  useEffect(() => setMode(language), [language]);

  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    trackRevisionEvent('revision_opened', { version: content.version });
  }, [content.version]);

  const readingMinutes = useMemo(() => {
    const blob = JSON.stringify(content);
    return estimateReadingMinutes(blob);
  }, [content]);

  const readingRange = `${content.estimatedMinutes.min}–${Math.max(content.estimatedMinutes.max, readingMinutes)}`;

  useEffect(() => {
    const sections = content.toc.map((t) => t.id);
    const observers: IntersectionObserver[] = [];
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const io = new IntersectionObserver(
        ([entry]) => { if (entry?.isIntersecting) setActiveSection(id); },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
      );
      io.observe(el);
      observers.push(io);
    });
    return () => observers.forEach((io) => io.disconnect());
  }, [content.toc]);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTocOpen(false);
  }, []);

  const filteredFacts =
    factFilter === 'all' ? content.facts.items : content.facts.items.filter((f) => f.level === factFilter);
  const visibleFacts = showAllFacts ? filteredFacts : filteredFacts.slice(0, 4);
  const recallQuestions = content.recall.questions[recallTab];

  return (
    <>
      <a
        href="#revision-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-20 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to revision content
      </a>

      <div className="ra-revision mx-auto max-w-[1400px] px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <nav className="mb-6 print:hidden" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm">
            <li><Link href="/" className="text-slate-500 hover:text-brand">{uiLabel(language, 'Home', 'होम')}</Link></li>
            <li aria-hidden className="text-slate-300">›</li>
            <li><Link href={breadcrumb.subjectHref} className="text-slate-500 hover:text-brand">{subjectLabel}</Link></li>
            <li aria-hidden className="text-slate-300">›</li>
            <li><Link href={breadcrumb.topicHref} className="text-slate-500 hover:text-brand">{topicLabel}</Link></li>
            <li aria-hidden className="text-slate-300">›</li>
            <li><span className="text-slate-600">{subtopicLabel}</span></li>
            <li aria-hidden className="text-slate-300">›</li>
            <li className="font-semibold text-brand" aria-current="page">{uiLabel(language, 'Revision', 'रिवीजन')}</li>
          </ol>
        </nav>

        <div className="mb-4 lg:hidden print:hidden">
          <button
            type="button"
            onClick={() => setTocOpen((v) => !v)}
            className="ra-toc flex min-h-[48px] w-full items-center justify-between px-4 py-3"
            aria-expanded={tocOpen}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <BookOpen className="h-4 w-4 text-brand" aria-hidden />
              On this page
            </span>
            <ChevronDown className={`h-4 w-4 text-slate-500 transition ${tocOpen ? 'rotate-180' : ''}`} />
          </button>
          {tocOpen ? (
            <ul className="ra-toc mt-2 p-2">
              {content.toc.map((item) => {
                const Icon = ICON_MAP[item.icon] ?? FileText;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => scrollTo(item.id)}
                      className={`ra-toc-link min-h-[44px] w-full ${activeSection === item.id ? 'ra-toc-link--active' : ''}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      {pick({ en: item.en, hi: item.hi }, mode)}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <div className="flex gap-6 lg:gap-8">
          <aside className="hidden w-[240px] shrink-0 lg:block print:hidden">
            <nav aria-label="On this page" className="ra-toc sticky top-[88px] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">On this page</p>
              <ul className="mt-3 space-y-0.5">
                {content.toc.map((item) => {
                  const Icon = ICON_MAP[item.icon] ?? FileText;
                  return (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        onClick={(e) => { e.preventDefault(); scrollTo(item.id); }}
                        className={`ra-toc-link ${activeSection === item.id ? 'ra-toc-link--active' : ''}`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                        <span className="leading-snug">{pick({ en: item.en, hi: item.hi }, mode)}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          <main id="revision-main" className="min-w-0 flex-1 space-y-8">
            {/* Hero */}
            <header className="ra-hero-card p-6 sm:p-8">
              <div className="flex flex-wrap gap-2">
                <span className="ra-tag ra-tag--purple"><BiText text={content.badges.subject} mode={mode} as="span" /></span>
                <span className="ra-tag ra-tag--lavender"><BiText text={content.badges.topic} mode={mode} as="span" /></span>
                <span className="ra-tag ra-tag--violet"><BiText text={content.badges.subtopic} mode={mode} as="span" /></span>
                <span className="ra-tag ra-tag--amber"><BiText text={content.metadata.difficulty} mode={mode} as="span" /></span>
                <span className="ra-tag ra-tag--green"><BiText text={content.metadata.verified} mode={mode} as="span" /></span>
                <span className="ra-tag ra-tag--blue"><BiText text={content.metadata.languages} mode={mode} as="span" /></span>
              </div>

              <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {pick(content.title, 'en')}
              </h1>
              <p className="ra-hero-title-hi">{pick(content.title, 'hi')}</p>

              <BiText text={content.intro} mode={mode} className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-[0.9375rem]" />

              <div className="mt-5 flex flex-wrap gap-4">
                <span className="ra-meta-link">
                  <Clock className="h-4 w-4" aria-hidden />
                  ~{readingRange} min read
                </span>
                <span className="ra-meta-link">
                  <FileText className="h-4 w-4" aria-hidden />
                  30 MCQs available
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 print:hidden">
                <a
                  href="#snapshot"
                  onClick={(e) => { e.preventDefault(); scrollTo('snapshot'); }}
                  className="ra-btn-primary"
                >
                  <Target className="h-4 w-4" aria-hidden />
                  {pick(content.cta.startRevision, mode)}
                </a>
                <Link
                  href={resolvedPractice}
                  onClick={() => trackRevisionEvent('revision_cta_clicked', { version: content.version, cta: 'primary' })}
                  className="ra-btn-secondary"
                >
                  {pick(content.cta.startMcqs, mode)}
                </Link>
              </div>
            </header>

            {/* Snapshot */}
            <section id="snapshot" className="ra-section ra-section-block">
              <SectionHeading id="snapshot-heading" title={content.snapshot.title} mode={mode} />
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {content.snapshot.cards.map((card) => (
                  <Reveal key={card.id}>
                    <article
                      className={`ra-snap ${SNAP_TINT[card.tint] ?? 'ra-snap--violet'}`}
                      title={pick(card.tooltip, mode)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="ra-snap-emoji" aria-hidden>{SNAP_EMOJI[card.icon] ?? '📌'}</span>
                        <SourceBadge sourceId={card.sourceId} />
                      </div>
                      <p className="ra-snap-label mt-3"><BiText text={card.label} mode="en" as="span" /></p>
                      <p className="ra-snap-value"><BiText text={card.value} mode={mode} as="span" /></p>
                      <p className="ra-snap-hi"><BiText text={card.label} mode="hi" as="span" /></p>
                      {card.id === 'significance' ? (
                        <p className="ra-snap-extra">{pick(card.tooltip, mode)}</p>
                      ) : null}
                    </article>
                  </Reveal>
                ))}
              </div>
            </section>

            {/* Historical Story */}
            <section id="story" className="ra-section ra-section-block">
              <SectionHeading id="story-heading" title={content.story.title} mode={mode} />
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {content.story.steps.map((step) => {
                  const Visual = STORY_VISUALS[step.visual as keyof typeof STORY_VISUALS] ?? StatuteIllustration;
                  return (
                    <Reveal key={step.id}>
                      <article className="ra-story-card">
                        <span className="ra-story-num">{step.number}</span>
                        <div className="ra-story-icon-wrap">
                          <Visual aria-hidden className="h-16 w-16" />
                        </div>
                        <h3 className="mt-2 text-sm font-bold text-slate-900">{pick(step.heading, 'en')}</h3>
                        <p className="mt-0.5 text-xs text-slate-500">{pick(step.heading, 'hi')}</p>
                        <BiText text={step.body} mode={mode} className="mt-3 flex-1 text-xs leading-relaxed text-slate-600" />
                        <SourceBadge sourceId={step.sourceId} className="mt-4" />
                      </article>
                    </Reveal>
                  );
                })}
              </div>
            </section>

            {/* Why Passed */}
            <section id="why-passed" className="ra-section ra-section-block">
              <SectionHeading id="why-passed-heading" title={content.whyPassed.title} mode={mode} />
              <ul className="mt-5 space-y-3">
                {content.whyPassed.rows.map((row) => (
                  <li key={row.cause.en} className="ra-why-row">
                    <span className="ra-why-icon bg-slate-50" aria-hidden>
                      {WHY_EMOJI[row.icon] ?? '📌'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{pick(row.cause, 'en')}</p>
                      <BiText text={row.effect} mode={mode} className="mt-0.5 text-xs leading-relaxed text-slate-500" />
                    </div>
                    <SourceBadge sourceId={row.sourceId} className="shrink-0 self-center" />
                  </li>
                ))}
              </ul>
            </section>

            {/* Provisions */}
            <section id="provisions" className="ra-section ra-section-block">
              <SectionHeading id="provisions-heading" title={content.provisions.title} mode={mode} />
              <div role="tablist" aria-label="Provision categories" className="ra-tabs mt-5 print:hidden">
                {content.provisions.tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={provisionTab === tab.id}
                    onClick={() => setProvisionTab(tab.id)}
                    className={`ra-tab ${provisionTab === tab.id ? 'ra-tab--active' : ''}`}
                  >
                    {pick(tab.label, mode)}
                  </button>
                ))}
              </div>
              {content.provisions.tabs.map((tab) => (
                <div key={tab.id} role="tabpanel" hidden={provisionTab !== tab.id} className="mt-4 space-y-3 print:block">
                  {tab.items.map((item) => (
                    <div key={item.provision.en} className="ra-provision-row">
                      <div className="flex gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900">{pick(item.provision, 'en')}</p>
                          <p className="ra-hi-line">{pick(item.provision, 'hi')}</p>
                          <ExamTip text={item.exam} mode={mode} />
                          <SourceBadge sourceId={item.sourceId} className="mt-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </section>

            {/* Council */}
            <section id="council" className="ra-section ra-section-block">
              <SectionHeading id="council-heading" title={content.councilDiagram.title} mode={mode} />
              <div className="mx-auto mt-6 max-w-md">
                <CouncilDiagramIllustration className="h-auto w-full" />
              </div>
              <BiText text={content.councilDiagram.note} mode={mode} className="mx-auto mt-5 max-w-2xl text-center text-sm leading-relaxed text-slate-600" />
              <div className="mx-auto mt-5 max-w-2xl">
                <ExamWarning
                  text={
                    <>
                      <strong>Governor-General of Bengal</strong> was not the later{' '}
                      <strong>Governor-General of India</strong>.
                    </>
                  }
                  hiSummary="बंगाल का गवर्नर-जनरल ≠ भारत का गवर्नर-जनरल"
                  sourceId={content.councilDiagram.sourceId}
                />
              </div>
            </section>

            {/* Supreme Court Timeline */}
            <section id="supreme-court" className="ra-section ra-section-block">
              <SectionHeading id="supreme-court-heading" title={content.courtTimeline.title} mode={mode} />
              <div className="ra-timeline mt-6">
                {content.courtTimeline.stages.map((stage) => (
                  <div key={stage.year} className="ra-timeline-step">
                    <div className="ra-timeline-icon" aria-hidden>
                      {TIMELINE_EMOJI[stage.icon ?? 'statute'] ?? '📜'}
                    </div>
                    <p className="ra-timeline-year">{stage.year}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-900">{pick(stage.label, 'en')}</p>
                    <BiText text={stage.description} mode={mode} className="mt-1 text-[11px] leading-snug text-slate-500" />
                    <SourceBadge sourceId={stage.sourceId} className="mt-2" />
                  </div>
                ))}
              </div>
            </section>

            {/* Significance vs Limitations */}
            <section id="significance" className="ra-section ra-section-block">
              <SectionHeading
                id="significance-heading"
                title={{ en: 'Significance vs Limitations', hi: 'महत्त्व बनाम सीमाएँ' }}
                mode={mode}
              />
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="ra-sig-card ra-sig-card--pos">
                  <h3 className="flex items-center gap-2 text-base font-bold text-green-800">
                    <Check className="h-5 w-5" aria-hidden />
                    Significance <span className="font-normal text-green-700">महत्त्व</span>
                  </h3>
                  <ul className="mt-4 space-y-2.5">
                    {content.significanceLimitations.significance.items.map((item) => (
                      <li key={item.text.en} className="flex gap-2 text-sm text-green-900">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden />
                        <div>
                          <BiText text={item.text} mode={mode} as="span" />
                          <SourceBadge sourceId={item.sourceId} className="mt-1" />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="ra-sig-card ra-sig-card--neg">
                  <h3 className="flex items-center gap-2 text-base font-bold text-red-800">
                    <X className="h-5 w-5" aria-hidden />
                    Limitations <span className="font-normal text-red-700">सीमाएँ</span>
                  </h3>
                  <ul className="mt-4 space-y-2.5">
                    {content.significanceLimitations.limitations.items.map((item) => (
                      <li key={item.text.en} className="flex gap-2 text-sm text-red-900">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
                        <div>
                          <BiText text={item.text} mode={mode} as="span" />
                          <SourceBadge sourceId={item.sourceId} className="mt-1" />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Comparison */}
            <section id="comparison" className="ra-section ra-section-block">
              <SectionHeading id="comparison-heading" title={content.comparison.title} mode={mode} />
              <div className="ra-table-wrap hidden md:block">
                <table className="ra-table">
                  <thead>
                    <tr>
                      <th scope="col">Aspect</th>
                      <th scope="col">Regulating Act, 1773</th>
                      <th scope="col">Act of Settlement, 1781</th>
                    </tr>
                  </thead>
                  <tbody>
                    {content.comparison.rows.map((row) => (
                      <tr key={row.aspect.en}>
                        <th scope="row"><BiText text={row.aspect} mode={mode} as="span" /></th>
                        <td><BiText text={row.act1773} mode={mode} as="span" /></td>
                        <td><BiText text={row.act1781} mode={mode} as="span" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 space-y-3 md:hidden">
                {content.comparison.rows.map((row) => (
                  <article key={row.aspect.en} className="rounded-xl border border-slate-200 p-3">
                    <BiText text={row.aspect} mode={mode} className="font-semibold text-slate-900" />
                    <div className="mt-2 rounded-lg bg-[#FAF5FF] p-2">
                      <p className="text-[10px] font-bold uppercase text-brand">1773</p>
                      <BiText text={row.act1773} mode={mode} className="text-sm text-slate-700" />
                    </div>
                    <div className="mt-2 rounded-lg bg-slate-50 p-2">
                      <p className="text-[10px] font-bold uppercase text-slate-500">1781</p>
                      <BiText text={row.act1781} mode={mode} className="text-sm text-slate-700" />
                    </div>
                    <SourceBadge sourceId={row.sourceId} className="mt-2" />
                  </article>
                ))}
              </div>
            </section>

            {/* High-Yield Facts */}
            <section id="facts" className="ra-section ra-section-block">
              <SectionHeading id="facts-heading" title={content.facts.title} mode={mode} />
              <div className="ra-tabs mt-5 print:hidden">
                {['all', ...content.facts.filters.map((f) => f.id)].map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFactFilter(id)}
                    className={`ra-tab ${factFilter === id ? 'ra-tab--active' : ''}`}
                  >
                    {id === 'all' ? 'All' : pick(content.facts.filters.find((f) => f.id === id)!.label, mode)}
                  </button>
                ))}
              </div>
              <ul className="mt-5 space-y-3">
                {visibleFacts.map((item) => (
                  <li key={item.fact.en} className="ra-fact-card">
                    <SourceBadge sourceId={item.sourceId} className="absolute right-3 top-3" />
                    <div className="flex gap-3 pr-12">
                      <span className="ra-fact-dot" aria-hidden />
                      <div>
                        <BiText text={item.fact} mode={mode} className="text-sm font-medium text-slate-800" />
                        <p className="ra-hi-line">{pick(item.fact, 'hi')}</p>
                        <p className="ra-exam-tip mt-2">
                          <span aria-hidden>📌</span>
                          <BiText text={item.exam} mode={mode} as="span" />
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {!showAllFacts && filteredFacts.length > 4 ? (
                <button type="button" onClick={() => setShowAllFacts(true)} className="mt-4 text-sm font-semibold text-brand hover:underline print:hidden">
                  Show all ({filteredFacts.length})
                </button>
              ) : null}
            </section>

            {/* Exam Traps */}
            <section id="traps" className="ra-section ra-section-block">
              <SectionHeading id="traps-heading" title={content.traps.title} mode={mode} />
              <div className="mt-5 space-y-4">
                {content.traps.rows.map((row) => (
                  <Reveal key={row.incorrect.en}>
                    <div className="ra-trap-row">
                      <div className="ra-trap-cell bg-red-50">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">Incorrect</p>
                        <BiText text={row.incorrect} mode={mode} className="mt-2 text-sm text-slate-800" />
                      </div>
                      <div className="ra-trap-cell bg-green-50">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-green-700">Correct</p>
                        <BiText text={row.correct} mode={mode} className="mt-2 text-sm text-slate-800" />
                        <SourceBadge sourceId={row.sourceId} className="mt-3" />
                      </div>
                      <div className="ra-trap-cell bg-amber-50">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Confusion</p>
                        <BiText text={row.confusion} mode={mode} className="mt-2 text-sm text-slate-700" />
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </section>

            {/* Active Recall */}
            <section id="recall" className="ra-section ra-section-block print:hidden">
              <SectionHeading id="recall-heading" title={content.recall.title} mode={mode} />
              <div role="tablist" className="ra-tabs mt-5">
                {content.recall.tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={recallTab === tab.id}
                    onClick={() => setRecallTab(tab.id as typeof recallTab)}
                    className={`ra-tab ${recallTab === tab.id ? 'ra-tab--active' : ''}`}
                  >
                    {pick(tab.label, mode)}
                  </button>
                ))}
              </div>
              <ul className="mt-5 space-y-3">
                {recallQuestions.map((q, i) => (
                  <li key={q.q.en} className="ra-provision-row">
                    <p className="inline-flex rounded-md bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">Q{i + 1}</p>
                    <BiText text={q.q} mode={mode} className="mt-2 text-sm font-semibold text-slate-900" />
                    {revealedAnswers.has(i) ? (
                      <BiText text={q.a} mode={mode} className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-700" />
                    ) : (
                      <button type="button" onClick={() => setRevealedAnswers((s) => new Set(s).add(i))} className="mt-3 text-sm font-semibold text-brand hover:underline">
                        Reveal Answer
                      </button>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setKnownItems((s) => new Set(s).add(i))}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${knownItems.has(i) ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        Mark as known
                      </button>
                      <Link href={resolvedPractice} className="rounded-full bg-[#F3E8FF] px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white">
                        Related MCQ →
                      </Link>
                    </div>
                    <SourceBadge sourceId={q.sourceId} className="mt-3" />
                  </li>
                ))}
              </ul>
            </section>

            {/* FAQ + Sources */}
            <div className="grid gap-6 lg:grid-cols-2">
              <section id="faq" className="ra-section ra-section-block">
                <SectionHeading id="faq-heading" title={{ en: 'FAQs', hi: 'अक्सर पूछे जाने वाले प्रश्न' }} mode={mode} />
                <div className="mt-5 space-y-2">
                  {content.faqs.map((faq, i) => (
                    <div key={faq.q.en} className="ra-faq-item">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        aria-expanded={openFaq === i}
                        className="flex min-h-[48px] w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-semibold text-slate-900"
                      >
                        <BiText text={faq.q} mode={mode} as="span" />
                        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${openFaq === i ? 'rotate-180' : ''}`} />
                      </button>
                      {openFaq === i ? (
                        <div className="border-t border-slate-100 px-4 pb-4 print:!block">
                          <BiText text={faq.a} mode={mode} className="pt-3 text-sm leading-relaxed text-slate-600" />
                          <SourceBadge sourceId={faq.sourceId} className="mt-3" />
                        </div>
                      ) : null}
                      <div className="hidden border-t border-slate-100 px-4 pb-4 print:block">
                        <BiText text={faq.a} mode={mode} className="pt-3 text-sm text-slate-600" />
                        <SourceBadge sourceId={faq.sourceId} className="mt-3" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section id="sources" className="ra-section ra-section-block">
                <SectionHeading id="sources-heading" title={{ en: 'Sources and Evidence', hi: 'स्रोत और प्रमाण' }} mode={mode} />
                <ul className="mt-5 space-y-3">
                  {content.sourceTiles.map(({ sourceId }) => {
                    const src = getSource(sourceId);
                    return (
                      <li key={sourceId}>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:border-brand/30 hover:bg-white"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F3E8FF] text-brand group-hover:bg-brand group-hover:text-white">
                            <ExternalLink className="h-4 w-4" aria-hidden />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{src.title}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{src.institution}</p>
                            <p className="mt-1 text-xs font-medium text-brand">{src.locator}</p>
                          </div>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>

            <RegulatingActMindMap mode={mode} />

            <section className="ra-final-cta print:hidden">
              <div className="flex flex-col items-center gap-5 md:flex-row">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <StudentCtaIllustration aria-hidden className="h-12 w-12" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                    <BiText text={content.cta.finalHeading} mode={mode} as="span" />
                  </h2>
                  <BiText text={content.cta.finalSupport} mode={mode} className="mt-1 text-sm text-slate-600" />
                </div>
                <Link
                  href={resolvedPractice}
                  onClick={() => trackRevisionEvent('revision_cta_clicked', { version: content.version, cta: 'final' })}
                  className="ra-btn-primary shrink-0"
                >
                  {pick(content.cta.finalMcqs, mode)}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
