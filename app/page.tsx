'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Navbar from './components/Navbar';
import SubjectGrid from './components/SubjectGrid';
import Footer from './components/Footer';
import { useLanguage } from '../lib/LanguageContext';

type Language = 'en' | 'hi';

type Suggestion =
  | { type: 'subject'; subjectKey: string; labelEn: string; labelHi: string }
  | { type: 'topic'; subjectKey: string; topicEn: string; topicHi: string };

const pageTranslations = {
  en: {
    heroBadge: 'Limited-time free access',
    heroTitle: 'Practice. Master. Ace.',
    heroLine: 'Your competitive exams.',
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
    heroTitle: 'अभ्यास. महारत. सफलता.',
    heroLine: 'आपकी प्रतियोगी परीक्षाएं।',
    heroSubtitle: 'सभी विषयों के लिए अभ्यास प्रश्नोत्तरी - गणित, विज्ञान, अंग्रेज़ी, इतिहास और अधिक। प्रतियोगी परीक्षाओं, बोर्ड की तैयारी और ज्ञान वृद्धि के लिए उत्तम।',
    searchPlaceholder: 'विषय, परीक्षाएं खोजें...',
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
    footerTagline: 'Created by student for students',
  },
} as const;

const SUBJECT_LIST = [
  { id: 'history', en: 'History', hi: 'इतिहास' },
  { id: 'science', en: 'Science', hi: 'विज्ञान' },
  { id: 'polity', en: 'Polity', hi: 'राजव्यवस्था' },
  { id: 'economics', en: 'Economics', hi: 'अर्थशास्त्र' },
  { id: 'geography', en: 'Geography', hi: 'भूगोल' },
  { id: 'general-knowledge', en: 'General Knowledge', hi: 'सामान्य ज्ञान' },
  { id: 'math', en: 'Math', hi: 'गणित' },
  { id: 'current-affairs', en: 'Current Affairs', hi: 'वर्तमान मामले' },
  { id: 'reasoning', en: 'Reasoning', hi: 'तर्क' },
];

export default function HomePage() {
  const { language } = useLanguage();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [siteStats, setSiteStats] = useState<{ questions: number | null; subjects: number | null; topics: number | null }>({
    questions: null,
    subjects: null,
    topics: null,
  });
  const [loadingSiteStats, setLoadingSiteStats] = useState(true);
  const [siteStatsError, setSiteStatsError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const normalize = (value: string) => value.trim().toLowerCase();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
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
  }, []);

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
    if (!mounted) return;

    if (isSearchActive && isMobile) {
      document.body.style.overflow = 'hidden';
      inputRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isSearchActive, isMobile, mounted]);

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
      router.push(`/subjects/${item.subjectKey}`);
      return;
    }

    const topicLabel = language === 'hi' && item.topicHi ? item.topicHi : item.topicEn;
    router.push(`/subjects/${item.subjectKey}/${encodeURIComponent(topicLabel)}`);
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
      router.push(`/subjects/${matchedSubject.id}`);
      return;
    }

    const matchedTopic = suggestions.find(
      (item): item is Extract<Suggestion, { type: 'topic' }> =>
        item.type === 'topic' &&
        (normalize(item.topicEn) === normalizedQuery || normalize(item.topicHi) === normalizedQuery)
    );

    if (matchedTopic) {
      const topicLabel = language === 'hi' && matchedTopic.topicHi ? matchedTopic.topicHi : matchedTopic.topicEn;
      router.push(`/subjects/${matchedTopic.subjectKey}/${encodeURIComponent(topicLabel)}`);
      return;
    }

    if (filteredSuggestions.length > 0) {
      navigateToSuggestion(filteredSuggestions[0]);
      return;
    }

    setSearchError('No matching subject or topic found.');
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

  if (!mounted) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />

      <main className="w-full pt-16">
        {/* Hero Section */}
        <section className="w-full px-4 py-16 md:py-24 flex flex-col items-center justify-center text-center">
          <div className="max-w-4xl mx-auto">
            {/* Micro-tag */}
            <div className="inline-flex items-center gap-2 mb-8 rounded-full border border-purple-200 bg-purple-50 px-4 py-2">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-sm font-medium text-purple-900">{activeTranslation.heroBadge}</span>
            </div>

            {/* Main Headline with Gradient */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight mb-0 bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {activeTranslation.heroTitle}
            </h1>
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight mb-6 bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {activeTranslation.heroLine}
            </h2>

            {/* Sub-headline */}
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto">
              {activeTranslation.heroSubtitle}
            </p>

            {/* Search Bar */}
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
                          ? 'w-full rounded-full border border-slate-200 bg-white px-5 py-3.5 text-slate-900 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                          : 'w-full rounded-full border border-gray-300 bg-white px-6 py-3.5 text-slate-900 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                      }
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setShowSuggestions(true);
                        setSearchError(null);
                      }}
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
                    />

                    {showSuggestions && (
                      <div className={
                        isSearchActive && isMobile
                          ? 'mt-4 max-h-[55vh] overflow-y-auto rounded-3xl border border-gray-200 bg-white shadow-lg'
                          : 'absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-3xl border border-gray-200 bg-white shadow-lg'
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
                      className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                    >
                      {activeTranslation.searchButton}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isSearchActive && isMobile && (
                  <button
                    type="submit"
                    className="w-full px-8 py-3.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    {activeTranslation.searchButton}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {searchError && (
                  <div className="text-sm text-rose-600">{searchError}</div>
                )}
              </form>

              <div className="mt-6 flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:justify-center">
                <a
                  href="/subjects"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
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
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-1">
                    {loadingSiteStats ? '...' : formatCount(siteStats.questions, '0')}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-slate-400 tracking-wide uppercase">Questions</div>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-1">
                    {loadingSiteStats ? '...' : formatCount(siteStats.subjects, '0')}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-slate-400 tracking-wide uppercase">Subjects</div>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-1">
                    {loadingSiteStats ? '...' : formatCount(siteStats.topics, '0')}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-slate-400 tracking-wide uppercase">Topics</div>
                </div>
              </div>
              {siteStatsError && (
                <div className="mt-4 text-center text-sm text-rose-600">{siteStatsError}</div>
              )}
            </div>

            <section className="border-t border-slate-100 mt-20 pt-20 pb-24 max-w-5xl mx-auto px-4 bg-slate-50/70 backdrop-blur-sm rounded-[2rem] shadow-sm">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-14 tracking-tight text-center">
                {sectionTitle[lang]}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                {stepsData.map((step) => (
                  <div key={step.id} className="space-y-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-mono font-bold text-base md:text-lg mx-auto mb-5">
                      {step.id}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {step.title[lang]}
                    </h3>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                      {step.desc[lang]}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>

        <section className="w-full px-4 py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900">Choose Your Subject</h2>
            </div>

            <SubjectGrid />
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
