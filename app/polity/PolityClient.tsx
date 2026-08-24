'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Compass,
  FileText,
  Globe,
  LayoutList,
  Rocket,
  Search,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import type { TopicItem } from '@/lib/questionTopics';
import {
  POLITY_EXAM_FILTERS,
  POLITY_TOPIC_META,
  matchPolityMeta,
  type PolityExamFilterId,
} from '@/lib/polity/polityPageData';
import { slugifySubject } from '@/lib/slugGenerator';

type PolityClientProps = {
  topics: TopicItem[];
};

type DisplayTopic = {
  key: string;
  title: string;
  description: string;
  examTag: string;
  count: number;
  href: string;
  icon: (typeof POLITY_TOPIC_META)[number]['icon'];
  examFilterIds: PolityExamFilterId[];
};

const COPY = {
  en: {
    breadcrumbHome: 'Home',
    breadcrumbSubjects: 'Subjects',
    breadcrumbPolity: 'Indian Polity',
    badge: 'POLITY PRACTICE',
    title: 'Indian Polity',
    subtitle: 'Complete topic-wise practice for UPSC, SSC, Railway and State PCS.',
    startMixed: 'Start Mixed Practice',
    topics: 'Topics',
    questions: 'Questions',
    bilingual: 'English + हिंदी Bilingual Content',
    progress: 'Your Progress',
    viewProgress: 'View Progress',
    chooseTopic: 'Choose a Topic',
    chooseTopicSub: 'Select a topic to start practicing',
    searchPh: 'Search polity topics...',
    recommended: 'Recommended',
    ctaTitle: 'Not sure where to begin?',
    ctaSub: "Get a recommended topic order based on the exam you're preparing for.",
    selectExam: 'Select Exam',
    buildPath: 'Build Practice Path',
    noTopics: 'No topics match your search.',
  },
  hi: {
    breadcrumbHome: 'होम',
    breadcrumbSubjects: 'विषय',
    breadcrumbPolity: 'भारतीय राजव्यवस्था',
    badge: 'POLITY PRACTICE',
    title: 'भारतीय राजव्यवस्था',
    subtitle: 'UPSC, SSC, Railway और State PCS के लिए विषयवार अभ्यास।',
    startMixed: 'मिश्रित अभ्यास शुरू करें',
    topics: 'विषय',
    questions: 'प्रश्न',
    bilingual: 'English + हिंदी द्विभाषी सामग्री',
    progress: 'आपकी प्रगति',
    viewProgress: 'प्रगति देखें',
    chooseTopic: 'एक विषय चुनें',
    chooseTopicSub: 'अभ्यास शुरू करने के लिए विषय चुनें',
    searchPh: 'polity विषय खोजें...',
    recommended: 'अनुशंसित',
    ctaTitle: 'कहाँ से शुरू करें, पता नहीं?',
    ctaSub: 'जिस परीक्षा की तैयारी कर रहे हैं, उसके अनुसार अनुशंसित क्रम पाएँ।',
    selectExam: 'परीक्षा चुनें',
    buildPath: 'अभ्यास पथ बनाएँ',
    noTopics: 'आपकी खोज से कोई विषय नहीं मिला।',
  },
};

function examFilterIdsFromTag(tag: string): PolityExamFilterId[] {
  const t = tag.toLowerCase();
  if (t.includes('state module')) return ['state-pcs'];
  if (t.includes('upsc')) return ['upsc', 'ssc', 'state-pcs'];
  return ['all', 'upsc', 'ssc', 'railway', 'state-pcs'];
}

function buildDisplayTopics(topics: TopicItem[], lang: 'en' | 'hi'): DisplayTopic[] {
  const fromDb: DisplayTopic[] = topics.map((topic) => {
    const title = lang === 'hi' ? topic.hi || topic.en : topic.en || topic.hi;
    const meta = matchPolityMeta(topic.en, topic.hi);
    const description =
      lang === 'hi'
        ? meta?.descriptionHi ?? 'इस विषय के MCQ अभ्यास के साथ अपनी तैयारी मजबूत करें।'
        : meta?.descriptionEn ?? 'Strengthen your preparation with MCQs from this topic.';
    const examTag = lang === 'hi' ? meta?.examTagHi ?? 'All Exams' : meta?.examTagEn ?? 'All Exams';
    const Icon = meta?.icon;
    return {
      key: `${topic.en}||${topic.hi}`,
      title,
      description,
      examTag,
      count: topic.count ?? 0,
      href: `/polity/topics/${slugifySubject(title)}`,
      icon: Icon ?? FileText,
      examFilterIds: examFilterIdsFromTag(examTag),
    };
  });

  if (fromDb.length > 0) return fromDb;

  return POLITY_TOPIC_META.map((meta) => ({
    key: meta.id,
    title: lang === 'hi' ? meta.titleHi : meta.titleEn,
    description: lang === 'hi' ? meta.descriptionHi : meta.descriptionEn,
    examTag: lang === 'hi' ? meta.examTagHi : meta.examTagEn,
    count: 0,
    href: `/polity/topics/${slugifySubject(lang === 'hi' ? meta.titleHi : meta.titleEn)}`,
    icon: meta.icon,
    examFilterIds: examFilterIdsFromTag(meta.examTagEn),
  }));
}

export default function PolityClient({ topics }: PolityClientProps) {
  const { language } = useLanguage();
  const lang = language === 'hi' ? 'hi' : 'en';
  const c = COPY[lang];

  const [examFilter, setExamFilter] = useState<PolityExamFilterId>('all');
  const [search, setSearch] = useState('');
  const [ctaExam, setCtaExam] = useState<PolityExamFilterId>('upsc');

  const allTopics = useMemo(() => buildDisplayTopics(topics, lang), [topics, lang]);
  const totalQuestions = useMemo(
    () => topics.reduce((sum, t) => sum + (t.count ?? 0), 0) || 946,
    [topics],
  );
  const topicCount = topics.length || POLITY_TOPIC_META.length;

  const filteredTopics = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allTopics.filter((topic) => {
      const matchesExam =
        examFilter === 'all' ||
        topic.examFilterIds.includes('all') ||
        topic.examFilterIds.includes(examFilter);
      const matchesSearch =
        !q ||
        topic.title.toLowerCase().includes(q) ||
        topic.description.toLowerCase().includes(q);
      return matchesExam && matchesSearch;
    });
  }, [allTopics, examFilter, search]);

  const mixedPracticeHref = filteredTopics[0]?.href ?? allTopics[0]?.href ?? '/polity/topics';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <div className="mx-auto max-w-[1240px] px-4 pb-14 pt-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-5 text-sm text-slate-500" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="transition hover:text-brand">
                {c.breadcrumbHome}
              </Link>
            </li>
            <li aria-hidden className="text-slate-300">
              /
            </li>
            <li>
              <Link href="/subjects" className="transition hover:text-brand">
                {c.breadcrumbSubjects}
              </Link>
            </li>
            <li aria-hidden className="text-slate-300">
              /
            </li>
            <li className="font-medium text-slate-700">{c.breadcrumbPolity}</li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-[#EDE9FE] bg-gradient-to-br from-[#FAF5FF] via-[#F5F3FF] to-[#EDE9FE]/80 px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="pointer-events-none absolute -right-8 top-0 h-56 w-56 rounded-full bg-[#7C3AED]/10 blur-3xl" />
          <div className="grid items-stretch gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="relative z-10 flex min-w-0 flex-col items-start justify-center">
              <span className="inline-flex w-fit shrink-0 rounded-full bg-[#7C3AED] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white sm:text-[11px]">
                {c.badge}
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl lg:text-[2.65rem]">
                {c.title}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                {c.subtitle}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {POLITY_EXAM_FILTERS.map((filter) => {
                  const active = examFilter === filter.id;
                  const label = lang === 'hi' ? filter.hi : filter.en;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setExamFilter(filter.id)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                        active
                          ? 'bg-brand text-white shadow-[0_4px_14px_rgba(124,58,237,0.35)]'
                          : 'border border-slate-200 bg-white text-slate-600 hover:border-[#DDD6FE] hover:text-brand'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <Link
                href={mixedPracticeHref}
                className="mt-6 inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(124,58,237,0.28)] transition hover:bg-[#6D28D9]"
              >
                <Rocket className="h-4 w-4" aria-hidden />
                {c.startMixed}
              </Link>
            </div>

            <div className="relative flex min-h-[clamp(11rem,36vw,24rem)] w-full items-center justify-center self-stretch sm:min-h-[clamp(13rem,34vw,26rem)] lg:min-h-[clamp(16rem,100%,28rem)]">
              <Image
                src="/polity/indian-polity.png?v=3"
                alt="Indian Parliament and Constitution of India illustration"
                width={800}
                height={607}
                preload
                fetchPriority="high"
                className="h-full w-full max-h-[clamp(11rem,36vw,28rem)] object-contain object-center"
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 480px"
              />
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="relative z-10 -mt-5 mx-auto max-w-[1100px] rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:px-6 sm:py-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            <div className="flex items-center gap-3 min-[360px]:gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-brand">
                <LayoutList className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-bold text-slate-900 sm:text-xl">{topicCount}</p>
                <p className="text-xs text-slate-500 sm:text-sm">{c.topics}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 min-[360px]:gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-brand">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-bold text-slate-900 sm:text-xl">{totalQuestions.toLocaleString()}</p>
                <p className="text-xs text-slate-500 sm:text-sm">{c.questions}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 min-[360px]:gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-brand">
                <Globe className="h-5 w-5" />
              </span>
              <p className="text-xs font-medium leading-snug text-slate-700 sm:text-sm">{c.bilingual}</p>
            </div>
            <div className="col-span-2 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 lg:col-span-1 lg:border-t-0 lg:pt-0">
              <div className="flex items-center gap-3">
                <div
                  className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[3px] border-brand/20"
                  aria-hidden
                >
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(#7C3AED 0% 32%, #EDE9FE 32% 100%)`,
                    }}
                  />
                  <span className="relative z-10 text-[10px] font-bold text-brand">32%</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">32% {c.progress}</p>
                  <Link href="/login" className="text-xs font-medium text-brand hover:underline">
                    {c.viewProgress}
                  </Link>
                </div>
              </div>
              <ArrowRight className="hidden h-4 w-4 text-brand lg:block" aria-hidden />
            </div>
          </div>
        </section>

        {/* Topics */}
        <section className="mt-10 sm:mt-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{c.chooseTopic}</h2>
              <p className="mt-1 text-sm text-slate-500">{c.chooseTopicSub}</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <label className="relative w-full sm:w-[240px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={c.searchPh}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-[#EDE9FE]"
                />
              </label>
              <div className="relative w-full sm:w-[160px]">
                <select
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-[#EDE9FE]"
                  defaultValue="recommended"
                  aria-label={c.recommended}
                >
                  <option value="recommended">{c.recommended}</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            {filteredTopics.map((topic, index) => {
              const Icon = topic.icon;
              return (
                <Link
                  key={topic.key}
                  href={topic.href}
                  className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md sm:gap-4 sm:p-5"
                >
                  <div className="flex shrink-0 flex-col items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3E8FF] text-brand sm:h-11 sm:w-11">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <span className="text-xs font-bold text-slate-400">{index + 1}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-base font-bold leading-snug text-slate-900 group-hover:text-brand sm:text-[17px]">
                        {topic.title}
                      </h3>
                      <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 sm:text-[11px]">
                        {topic.examTag}
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
                      {topic.description}
                    </p>
                    {topic.count > 0 && (
                      <p className="mt-2 text-xs font-medium text-brand">{topic.count.toLocaleString()} MCQs</p>
                    )}
                  </div>

                  <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3E8FF] text-brand transition group-hover:bg-brand group-hover:text-white">
                    <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                  </span>
                </Link>
              );
            })}
          </div>

          {filteredTopics.length === 0 && (
            <p className="mt-8 text-center text-sm text-slate-500">{c.noTopics}</p>
          )}
        </section>

        {/* Bottom CTA */}
        <section className="mt-10 overflow-hidden rounded-3xl border border-[#EDE9FE] bg-gradient-to-r from-[#FAF5FF] to-[#F5F3FF] px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
            <div className="flex min-w-0 items-start gap-4 sm:items-center lg:flex-1">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm sm:h-16 sm:w-16 lg:h-[72px] lg:w-[72px]">
                <Compass className="h-7 w-7 text-brand sm:h-8 sm:w-8 lg:h-9 lg:w-9" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-slate-900 sm:text-lg lg:text-xl">{c.ctaTitle}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{c.ctaSub}</p>
              </div>
            </div>

            <div className="flex w-full min-w-0 flex-col gap-3 min-[480px]:flex-row min-[480px]:items-stretch lg:w-auto lg:max-w-[min(100%,28rem)] lg:shrink-0">
              <div className="relative min-w-0 flex-1">
                <select
                  value={ctaExam}
                  onChange={(e) => setCtaExam(e.target.value as PolityExamFilterId)}
                  className="h-11 w-full min-w-0 appearance-none truncate rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-brand focus:ring-2 focus:ring-[#EDE9FE] sm:h-12 sm:text-[15px]"
                  aria-label={c.selectExam}
                >
                  {POLITY_EXAM_FILTERS.filter((f) => f.id !== 'all').map((f) => (
                    <option key={f.id} value={f.id}>
                      {lang === 'hi' ? f.hi : f.en}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              <button
                type="button"
                onClick={() => setExamFilter(ctaExam)}
                className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 min-[480px]:h-12 min-[480px]:w-auto min-[480px]:px-5 sm:whitespace-nowrap"
              >
                {c.buildPath}
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
