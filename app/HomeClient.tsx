'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { slugifySubject } from '@/lib/slugGenerator';
import SubjectGrid from './components/SubjectGrid';
import { useLanguage } from '../lib/LanguageContext';
import type { HomeStats, HomeSuggestion } from '@/lib/homeData';
import { SUBJECTS } from '@/lib/subjects';

type Language = 'en' | 'hi';

type Suggestion =
  | { type: 'subject'; subjectKey: string; labelEn: string; labelHi: string }
  | { type: 'topic'; subjectKey: string; topicEn: string; topicHi: string };

const pageTranslations = {
  en: {
    heroBadge: 'Limited-time free access',
    heroTitle: 'Practice to dominate.',
    heroLinePart1: 'Test your limits before',
    heroLinePart2: 'the system tests you.',
    heroSubtitle: 'Practice MCQs for all subjects - Mathematics, Science, English, History & more. Perfect for competitive exams, board preparations, and knowledge enhancement.',
    searchPlaceholder: 'Search subjects or topics...',
    searchButton: 'Search',
    landingTitle: 'Choose Your Subject',
    historyName: 'History',
    historyCount: '1500+ questions',
    scienceName: 'Science',
    scienceCount: '1300+ questions',
    polityName: 'Polity',
    polityCount: '1200+ questions',
    economicsName: 'Economics',
    economicsCount: '1100+ questions',
    geographyName: 'Geography',
    geographyCount: '1000+ questions',
    generalKnowledgeName: 'General Knowledge',
    generalKnowledgeCount: '900+ questions',
    exploreSubject: 'Explore Subject',
    footerAbout: 'About Us',
    footerContact: 'Contact',
    footerTerms: 'Terms',
    footerPrivacy: 'Privacy',
    footerTagline: 'Created by student for students',
  },
  hi: {
    heroBadge: 'सीमित समय के लिए मुफ्त पहुँच',
    heroTitle: 'दबदबा बनाने के लिए अभ्यास करो।',
    heroLinePart1: 'अपनी सीमाओं को यहाँ परख लो,',
    heroLinePart2: 'इससे पहले कि सिस्टम तुम्हारा इम्तिहान ले।',
    heroSubtitle: 'सभी विषयों के लिए अभ्यास प्रश्नोत्तरी — गणित, विज्ञान, अंग्रेज़ी, इतिहास और अधिक। प्रतियोगी परीक्षाओं, बोर्ड की तैयारी और आत्मविश्वास के लिए उत्तम।',
    searchPlaceholder: 'विषय या टॉपिक खोजें...',
    searchButton: 'खोजें',
    landingTitle: 'अपना विषय चुनें',
    historyName: 'इतिहास',
    historyCount: '1500+ प्रश्न',
    scienceName: 'विज्ञान',
    scienceCount: '1300+ प्रश्न',
    polityName: 'राजव्यवस्था',
    polityCount: '1200+ प्रश्न',
    economicsName: 'अर्थशास्त्र',
    economicsCount: '1100+ प्रश्न',
    geographyName: 'भूगोल',
    geographyCount: '1000+ प्रश्न',
    generalKnowledgeName: 'सामान्य ज्ञान',
    generalKnowledgeCount: '900+ प्रश्न',
    exploreSubject: 'विषय देखें',
    footerAbout: 'हमारे बारे में',
    footerContact: 'संपर्क करें',
    footerTerms: 'शर्तें',
    footerPrivacy: 'गोपनीयता',
    footerTagline: 'विद्यार्थियों द्वारा विद्यार्थियों के लिए निर्मित',
  },
} as const;

const SUBJECT_LIST = SUBJECTS.map((subject) => ({ id: subject.key, en: subject.label, hi: subject.labelHi }));

type HomeClientProps = {
  initialSiteStats?: HomeStats;
  initialSubjectCounts?: Record<string, number>;
  initialSuggestions?: HomeSuggestion[];
  initialSearchQuery?: string;
};

export default function HomePage({ initialSiteStats, initialSubjectCounts, initialSuggestions, initialSearchQuery }: HomeClientProps) {
  const { language } = useLanguage();
  const isHindi = language === 'hi';
  const heroTextSizeClass = isHindi ? 'text-[clamp(1.3rem,5.2vw,3.2rem)]' : 'text-[clamp(1.35rem,5.8vw,3.9rem)]';
  const heroLineSpacingClass = isHindi ? 'space-y-3 mb-10' : 'space-y-2 mb-8';
  const heroTitleMargin = isHindi ? 'mb-4' : 'mb-2';
  const router = useRouter();
  const [query, setQuery] = useState(initialSearchQuery?.trim() ?? '');
  const [suggestions, setSuggestions] = useState<Suggestion[]>(
    (initialSuggestions ?? []).map((item) => ({
      type: 'topic' as const,
      subjectKey: item.subjectKey,
      topicEn: item.topicEn,
      topicHi: item.topicHi,
    }))
  );
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(!initialSuggestions?.length);
  const [siteStats, setSiteStats] = useState<{ questions: number | null; subjects: number | null; topics: number | null }>({
    questions: initialSiteStats?.questions ?? null,
    subjects: initialSiteStats?.subjects ?? null,
    topics: initialSiteStats?.topics ?? null,
  });
  const [loadingSiteStats, setLoadingSiteStats] = useState(!initialSiteStats);
  const [siteStatsError, setSiteStatsError] = useState<string | null>(null);
  const [animatedSiteStats, setAnimatedSiteStats] = useState({ questions: 0, subjects: 0, topics: 0 });
  const [subjectCounts, setSubjectCounts] = useState<Record<string, number> | null>(initialSubjectCounts ?? null);
  const [loadingSubjectCounts, setLoadingSubjectCounts] = useState(!initialSubjectCounts);
  const [subjectCountsError, setSubjectCountsError] = useState(false);
  const statsDirectionRef = useRef(1);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const normalize = (value: string) => value.trim().toLowerCase();

  useEffect(() => {
    if (initialSuggestions?.length) {
      return;
    }

    async function loadSearchSuggestions() {
      try {
        setLoadingSuggestions(true);
        const response = await fetch('/api/search-suggestions');
        if (!response.ok) {
          throw new Error('Unable to load suggestions');
        }
        const data = await response.json();
        const topicSuggestions = (data.suggestions ?? []).map((item: any) => ({
          type: 'topic' as const,
          subjectKey: item.subjectKey,
          topicEn: item.topicEn,
          topicHi: item.topicHi,
        }));
        setSuggestions(topicSuggestions);
      } catch (error) {
        console.error('Search suggestions load error:', error);
      } finally {
        setLoadingSuggestions(false);
      }
    }

    loadSearchSuggestions();
  }, [initialSuggestions?.length]);

  useEffect(() => {
    if (initialSiteStats) {
      return;
    }

    async function loadSiteStats() {
      try {
        setLoadingSiteStats(true);
        const response = await fetch('/api/site-stats');
        if (!response.ok) {
          throw new Error('Unable to load site statistics');
        }
        const data = await response.json();
        setSiteStats({
          questions: typeof data.questions === 'number' ? data.questions : null,
          subjects: typeof data.subjects === 'number' ? data.subjects : null,
          topics: typeof data.topics === 'number' ? data.topics : null,
        });
      } catch (error) {
        console.error('Site stats load error:', error);
        setSiteStatsError('Unable to load counts from the database.');
      } finally {
        setLoadingSiteStats(false);
      }
    }

    loadSiteStats();
  }, [initialSiteStats]);

  const loadSubjectCounts = useCallback(async () => {
    if (initialSubjectCounts) {
      return;
    }

    try {
      setLoadingSubjectCounts(true);
      setSubjectCountsError(false);
      const response = await fetch('/api/subject-counts');
      if (!response.ok) {
        throw new Error('Unable to load subject counts');
      }
      const data = await response.json();
      setSubjectCounts(data ?? {});
    } catch (error) {
      console.error('Subject counts load error:', error);
      setSubjectCountsError(true);
    } finally {
      setLoadingSubjectCounts(false);
    }
  }, [initialSubjectCounts]);

  useEffect(() => {
    loadSubjectCounts();
  }, [loadSubjectCounts]);

  useEffect(() => {
    if (!subjectCountsError) {
      return;
    }

    const retryTimer = window.setTimeout(() => {
      loadSubjectCounts();
    }, 5000);

    return () => {
      window.clearTimeout(retryTimer);
    };
  }, [subjectCountsError, loadSubjectCounts]);

  useEffect(() => {
    let interval: number | undefined;

    if (loadingSiteStats) {
      statsDirectionRef.current = 1;
      setAnimatedSiteStats({ questions: 0, subjects: 0, topics: 0 });

      interval = window.setInterval(() => {
        setAnimatedSiteStats((prev) => {
          const direction = statsDirectionRef.current;
          const nextQuestions = Math.max(prev.questions + direction * 50, 0);
          const nextSubjects = Math.max(prev.subjects + direction * 20, 0);
          const nextTopics = Math.max(prev.topics + direction * 15, 0);

          return {
            questions: nextQuestions,
            subjects: nextSubjects,
            topics: nextTopics,
          };
        });
      }, 25);
    } else {
      setAnimatedSiteStats({
        questions: siteStats.questions ?? 0,
        subjects: siteStats.subjects ?? 0,
        topics: siteStats.topics ?? 0,
      });
    }

    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [loadingSiteStats, siteStats]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const updateMobileState = () => {
      const matches = mediaQuery.matches;
      setIsMobile(matches);
      if (!matches) {
        setIsSearchActive(false);
      }
    };

    updateMobileState();
    mediaQuery.addEventListener?.('change', updateMobileState);

    return () => {
      mediaQuery.removeEventListener?.('change', updateMobileState);
    };
  }, []);

  useEffect(() => {
    if (isSearchActive && isMobile) {
      document.body.style.overflow = 'hidden';
      inputRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isSearchActive, isMobile]);

  const activateMobileSearch = () => {
    if (!isMobile) return;
    setIsSearchActive(true);
    setShowSuggestions(true);
  };

  const deactivateMobileSearch = () => {
    setIsSearchActive(false);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  useEffect(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) {
      const subjectSuggestions = SUBJECT_LIST.map((subject) => ({
        type: 'subject' as const,
        subjectKey: subject.id,
        labelEn: subject.en,
        labelHi: subject.hi,
      }));
      setFilteredSuggestions([...subjectSuggestions, ...suggestions].slice(0, 8));
      setActiveIndex(0);
      return;
    }

    const subjectSuggestions = SUBJECT_LIST.map((subject) => ({
      type: 'subject' as const,
      subjectKey: subject.id,
      labelEn: subject.en,
      labelHi: subject.hi,
    }));

    const combined = [...subjectSuggestions, ...suggestions];
    const filtered = combined.filter((item) => {
      if (item.type === 'subject') {
        return (
          normalize(item.labelEn).includes(normalizedQuery) ||
          normalize(item.labelHi).includes(normalizedQuery) ||
          item.subjectKey.includes(normalizedQuery)
        );
      }

      return (
        normalize(item.topicEn).includes(normalizedQuery) ||
        normalize(item.topicHi).includes(normalizedQuery)
      );
    });

    setFilteredSuggestions(filtered.slice(0, 8));
    setActiveIndex(0);
  }, [query, suggestions]);

  const navigateToSuggestion = (item: Suggestion) => {
    if (item.type === 'subject') {
      router.push(`/${item.subjectKey}`);
      return;
    }

    const topicSlug = slugifySubject(item.topicEn || item.topicHi);
    router.push(`/${item.subjectKey}/topics/${topicSlug}`);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchError(null);

    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return;

    const matchedSubject = SUBJECT_LIST.find((subject) =>
      normalize(subject.id) === normalizedQuery ||
      normalize(subject.en) === normalizedQuery ||
      normalize(subject.hi) === normalizedQuery
    );

    if (matchedSubject) {
      router.push(`/${matchedSubject.id}`);
      return;
    }

    const matchedTopic = suggestions.find(
      (item): item is Extract<Suggestion, { type: 'topic' }> =>
        item.type === 'topic' &&
        (normalize(item.topicEn) === normalizedQuery || normalize(item.topicHi) === normalizedQuery)
    );

    if (matchedTopic) {
      const topicSlug = slugifySubject(matchedTopic.topicEn || matchedTopic.topicHi);
      router.push(`/${matchedTopic.subjectKey}/topics/${topicSlug}`);
      return;
    }

    if (filteredSuggestions.length > 0) {
      navigateToSuggestion(filteredSuggestions[0]);
      return;
    }

    setSearchError('No matching subject or topic found.');
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % filteredSuggestions.length);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + filteredSuggestions.length) % filteredSuggestions.length);
    }

    if (event.key === 'Enter' && filteredSuggestions[activeIndex]) {
      event.preventDefault();
      navigateToSuggestion(filteredSuggestions[activeIndex]);
    }

    if (event.key === 'Escape') {
      setShowSuggestions(false);
      setIsSearchActive(false);
    }
  };

  const handleSuggestionClick = (item: Suggestion) => {
    setQuery(item.type === 'subject' ? (language === 'hi' ? item.labelHi : item.labelEn) : (language === 'hi' && item.topicHi ? item.topicHi : item.topicEn));
    setShowSuggestions(false);
    navigateToSuggestion(item);
  };

  const activeTranslation = pageTranslations[language];
  const lang = language;

  const sectionTitle = {
    en: 'How it works',
    hi: 'यह कैसे काम करता है',
  } as const;

  const stepsData = [
    {
      id: '1',
      title: { en: 'Choose Subject', hi: 'विषय चुनें' },
      desc: {
        en: 'Select from Math, Reasoning, English, GK and more',
        hi: 'गणित, रीजनिंग, अंग्रेजी, जीके और अन्य विषयों में से चुनें',
      },
    },
    {
      id: '2',
      title: { en: 'Pick a Topic', hi: 'विषय का टॉपिक चुनें' },
      desc: {
        en: 'Focus on specific topics to strengthen weak areas',
        hi: 'कमजोर क्षेत्रों को मजबूत करने के लिए विशिष्ट विषयों पर ध्यान केंद्रित करें',
      },
    },
    {
      id: '3',
      title: { en: 'Practice & Learn', hi: 'अभ्यास करें और सीखें' },
      desc: {
        en: 'Attempt MCQs and review explanations',
        hi: 'बहुविकल्पीय प्रश्नों (MCQs) का प्रयास करें और विस्तृत व्याख्याओं की समीक्षा करें',
      },
    },
  ] as const;

  const formatCount = (value: number | null, fallback: string) => {
    if (value === null) return fallback;
    return value.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <main className="w-full pt-16">
        <div className="max-w-6xl mx-auto px-4">
          <section className="w-full rounded-[2rem] border border-slate-200/70 bg-white shadow-soft px-6 py-10 md:px-12 md:py-14 flex justify-center">
            <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 mb-8 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 shadow-sm">
                <div className="h-2 w-2 rounded-full bg-indigo-600" />
                <span className="text-sm font-semibold text-indigo-700">{activeTranslation.heroBadge}</span>
              </div>
              <h1 className={`mt-2.5 ${heroTitleMargin} text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.2] text-purple-600 text-center break-words whitespace-normal`}>
                {activeTranslation.heroTitle}
              </h1>
              <p className={`mt-3 ${heroLineSpacingClass} text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.2] text-purple-600 text-center break-words whitespace-normal`}>
                <span className="block">{activeTranslation.heroLinePart1}</span>
                <span className="block">{activeTranslation.heroLinePart2}</span>
              </p>
              <p className="text-[15px] sm:text-lg md:text-xl lg:text-2xl font-normal text-slate-500 max-w-3xl mx-auto text-center mt-6 leading-relaxed">
                {activeTranslation.heroSubtitle}
              </p>
              <div className="w-full max-w-2xl mx-auto mb-12">
                <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3">
                  <div className={isSearchActive && isMobile ? 'fixed inset-0 bg-white z-50 flex flex-col p-4 animate-in fade-in duration-200 md:hidden' : 'flex flex-col sm:flex-row gap-3 items-center'}>
                    {isSearchActive && isMobile && (
                      <button
                        type="button"
                        onClick={deactivateMobileSearch}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-900 transition hover:bg-slate-200"
                        aria-label="Back"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                    )}
                    <div className="flex-1 w-full relative">
                      <input
                        ref={inputRef}
                        name="search"
                        type="search"
                        placeholder={activeTranslation.searchPlaceholder}
                        autoComplete="off"
                        inputMode="search"
                        enterKeyHint="search"
                        spellCheck={false}
                        className={
                          isSearchActive && isMobile
                            ? 'w-full rounded-full border border-slate-200 bg-white px-5 py-3.5 text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand focus:ring-2 focus:ring-[#EDE9FE]'
                            : 'w-full rounded-full border border-slate-200 bg-white px-6 py-4 text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand focus:ring-2 focus:ring-[#EDE9FE]'
                        }
                        value={query}
                        onChange={(event) => {
                          setQuery(event.target.value);
                          setShowSuggestions(true);
                          setSearchError(null);
                        }}
                        onKeyDown={handleSearchKeyDown}
                        onFocus={() => {
                          if (isMobile) {
                            activateMobileSearch();
                          } else {
                            setShowSuggestions(true);
                          }
                        }}
                        onClick={() => {
                          if (isMobile) {
                            activateMobileSearch();
                          }
                        }}
                        onBlur={() => {
                          if (!isSearchActive) {
                            window.setTimeout(() => setShowSuggestions(false), 250);
                          }
                        }}
                        aria-label={activeTranslation.searchPlaceholder}
                        role="combobox"
                        aria-expanded={showSuggestions}
                        aria-controls="home-search-suggestions"
                        aria-autocomplete="list"
                      />
                      {showSuggestions && (
                        <div id="home-search-suggestions" role="listbox" className={
                          isSearchActive && isMobile
                            ? 'mt-4 max-h-[55vh] overflow-y-auto rounded-3xl border border-gray-200 bg-white shadow-lg'
                            : 'absolute top-full left-0 right-0 z-50 mt-2 max-h-64 overflow-y-auto rounded-3xl border border-gray-200 bg-white shadow-lg'
                        }>
                          {loadingSuggestions ? (
                            <div className="p-4 text-sm text-slate-500">Loading suggestions...</div>
                          ) : filteredSuggestions.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                              {filteredSuggestions.map((item, index) => {
                                const label =
                                  item.type === 'subject'
                                    ? language === 'hi'
                                      ? item.labelHi
                                      : item.labelEn
                                    : language === 'hi' && item.topicHi
                                    ? item.topicHi
                                    : item.topicEn;
                                const subtitle =
                                  item.type === 'subject'
                                    ? 'Subject'
                                    : `Topic • ${SUBJECT_LIST.find((subject) => subject.id === item.subjectKey)?.[language] ?? item.subjectKey}`;
                                return (
                                  <button
                                    key={`${item.type}-${item.type === 'subject' ? item.subjectKey : item.subjectKey + item.topicEn}-${index}`}
                                    type="button"
                                    role="option"
                                    aria-selected={index === activeIndex}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => handleSuggestionClick(item)}
                                    className={`w-full text-left px-5 py-3 transition hover:bg-slate-50 active:bg-slate-100 ${index === activeIndex ? 'bg-slate-100' : ''}`}
                                  >
                                    <div className="text-sm font-semibold text-slate-900">{label}</div>
                                    <div className="text-xs text-slate-500">{subtitle}</div>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            query && <div className="p-4 text-sm text-slate-500">No matching subject or topic found.</div>
                          )}
                        </div>
                      )}
                    </div>
                    {!isSearchActive && (
                      <button
                        type="submit"
                        className="w-full sm:w-auto rounded-full bg-brand px-10 py-4 text-sm font-semibold text-white shadow-xl transition hover:bg-[#6D28D9] flex items-center justify-center gap-2"
                      >
                        {activeTranslation.searchButton}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {isSearchActive && isMobile && (
                    <button
                      type="submit"
                      className="w-full rounded-full bg-brand px-10 py-4 text-sm font-semibold text-white shadow-xl transition hover:bg-[#6D28D9] flex items-center justify-center gap-2"
                    >
                      {activeTranslation.searchButton}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  {searchError && (
                    <div className="text-sm text-rose-600">{searchError}</div>
                  )}
                </form>
                <div className="mt-6 flex flex-col items-center justify-center gap-4 text-center sm:flex-row sm:justify-center">
                  <a
                    href="/subjects"
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-10 py-4 text-sm font-semibold text-white shadow-xl transition hover:bg-slate-800"
                  >
                    Start Practicing
                  </a>
                  <p className="max-w-xl text-sm text-slate-500">
                    Explore active subjects and take your first quiz in seconds.
                  </p>
                </div>
              </div>
              <div className="mt-10 md:mt-14 mb-8 px-4">
                <div className="mx-auto max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col items-center justify-center text-center">
                    <div className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">
                      {loadingSiteStats ? animatedSiteStats.questions.toLocaleString() : formatCount(siteStats.questions, '0')}
                    </div>
                    <div className="text-xs md:text-sm font-semibold uppercase tracking-[0.28em] text-muted">Questions</div>
                  </div>
                  <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col items-center justify-center text-center">
                    <div className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">
                      {loadingSiteStats ? animatedSiteStats.subjects.toLocaleString() : formatCount(siteStats.subjects, '0')}
                    </div>
                    <div className="text-xs md:text-sm font-semibold uppercase tracking-[0.28em] text-muted">Subjects</div>
                  </div>
                  <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col items-center justify-center text-center">
                    <div className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">
                      {loadingSiteStats ? animatedSiteStats.topics.toLocaleString() : formatCount(siteStats.topics, '0')}
                    </div>
                    <div className="text-xs md:text-sm font-semibold uppercase tracking-[0.28em] text-muted">Topics</div>
                  </div>
                </div>
                {siteStatsError && (
                  <div className="mt-4 text-center text-sm text-rose-600">{siteStatsError}</div>
                )}
              </div>
              <section className="mt-20 rounded-[2rem] bg-works px-4 py-14 md:px-8 md:py-16">
                <div className="max-w-3xl mx-auto text-center mb-12">
                  <p className="text-sm uppercase tracking-[0.35em] text-[#475569] mb-3 font-semibold">How it works</p>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-slate-900 mb-4 tracking-tight leading-tight">
                    {sectionTitle[lang]}
                  </h2>
                  <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto leading-8">
                    {lang === 'en'
                      ? 'Follow these three steps to quickly choose a subject, pick a topic, and practice with confidence.'
                      : 'इन तीन चरणों का पालन करें और जल्दी से विषय चुनें, विषय चयन करें, और आत्मविश्वास के साथ अभ्यास करें।'}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {stepsData.map((step) => (
                    <div key={step.id} className="rounded-[2rem] border border-transparent bg-white p-8 shadow-xl transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-[#DDD6FE]">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#F3E8FF] text-brand font-semibold text-lg mb-5 shadow-sm">
                        {step.id}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-3 tracking-tight leading-snug">
                        {step.title[lang]}
                      </h3>
                      <p className="text-base sm:text-lg text-muted leading-7">
                        {step.desc[lang]}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>
          <section className="w-full px-4 py-20 bg-surface">
            <div className="max-w-6xl mx-auto">
              <div className="mb-10 text-center">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-500 font-semibold">Subjects</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  {activeTranslation.landingTitle}
                </h2>
              </div>
              <SubjectGrid counts={subjectCounts ?? undefined} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

