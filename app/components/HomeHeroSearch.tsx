'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search, ShieldCheck, Star } from 'lucide-react';
import type { HomeLang } from '@/lib/homeCopy';
import { HOME_COPY } from '@/lib/homeCopy';
import type { HomeSuggestion } from '@/lib/homeData';
import { slugifySubject } from '@/lib/slugGenerator';
import { SUBJECTS } from '@/lib/subjects';

type Suggestion =
  | { type: 'subject'; subjectKey: string; labelEn: string; labelHi: string }
  | { type: 'topic'; subjectKey: string; topicEn: string; topicHi: string };

type HomeHeroSearchProps = {
  lang: HomeLang;
  initialSuggestions?: HomeSuggestion[];
};

export default function HomeHeroSearch({ lang, initialSuggestions = [] }: HomeHeroSearchProps) {
  const c = HOME_COPY[lang];
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>(
    initialSuggestions.map((item) => ({
      type: 'topic' as const,
      subjectKey: item.subjectKey,
      topicEn: item.topicEn,
      topicHi: item.topicHi,
    })),
  );
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalize = (value: string) => value.trim().toLowerCase();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initial = params.get('search')?.trim();
    if (initial) setQuery(initial);
  }, []);

  useEffect(() => {
    if (initialSuggestions.length) return;
    fetch('/api/search-suggestions')
      .then((r) => r.json())
      .then((data) => {
        setSuggestions(
          (data.suggestions ?? []).map((item: HomeSuggestion) => ({
            type: 'topic' as const,
            subjectKey: item.subjectKey,
            topicEn: item.topicEn,
            topicHi: item.topicHi,
          })),
        );
      })
      .catch(() => undefined);
  }, [initialSuggestions.length]);

  useEffect(() => {
    const q = normalize(query);
    const subjectSuggestions = SUBJECTS.map((s) => ({
      type: 'subject' as const,
      subjectKey: s.key,
      labelEn: s.label,
      labelHi: s.labelHi,
    }));
    if (!q) {
      setFilteredSuggestions([...subjectSuggestions, ...suggestions].slice(0, 8));
      return;
    }
    setFilteredSuggestions(
      [...subjectSuggestions, ...suggestions]
        .filter((item) => {
          if (item.type === 'subject') {
            return (
              normalize(item.labelEn).includes(q) ||
              normalize(item.labelHi).includes(q) ||
              item.subjectKey.includes(q)
            );
          }
          return normalize(item.topicEn).includes(q) || normalize(item.topicHi).includes(q);
        })
        .slice(0, 8),
    );
  }, [query, suggestions]);

  const navigateToSuggestion = (item: Suggestion) => {
    if (item.type === 'subject') {
      router.push(`/${item.subjectKey}`);
      return;
    }
    router.push(`/${item.subjectKey}/topics/${slugifySubject(item.topicEn || item.topicHi)}`);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSearchError(null);
    const q = normalize(query);
    if (!q) return;

    const matchedSubject = SUBJECTS.find(
      (s) => normalize(s.key) === q || normalize(s.label) === q || normalize(s.labelHi) === q,
    );
    if (matchedSubject) {
      router.push(`/${matchedSubject.key}`);
      return;
    }
    if (filteredSuggestions[0]) {
      navigateToSuggestion(filteredSuggestions[0]);
      return;
    }
    setSearchError(c.searchError);
  };

  return (
    <>
      <form onSubmit={handleSearchSubmit} className="relative mt-4 min-[360px]:mt-8">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 min-[360px]:left-4 min-[360px]:h-4 min-[360px]:w-4" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            setSearchError(null);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => window.setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={c.searchPh}
          className="w-full min-w-0 rounded-full border border-slate-200 bg-white py-3 pl-9 pr-3 text-xs shadow-sm outline-none transition focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-[#EDE9FE] min-[360px]:py-3.5 min-[360px]:pl-11 min-[360px]:pr-4 min-[360px]:text-sm sm:py-4 sm:text-base"
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1 shadow-xl min-[360px]:py-2">
            {filteredSuggestions.map((item, index) => (
              <li key={`${item.type}-${index}`}>
                <button
                  type="button"
                  className="w-full break-words px-3 py-2 text-left text-xs hover:bg-slate-50 min-[360px]:px-4 min-[360px]:py-2.5 min-[360px]:text-sm"
                  onMouseDown={() => navigateToSuggestion(item)}
                >
                  {item.type === 'subject'
                    ? lang === 'hi'
                      ? item.labelHi
                      : item.labelEn
                    : lang === 'hi' && item.topicHi
                      ? item.topicHi
                      : item.topicEn}
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>
      {searchError && <p className="mt-2 break-words text-xs text-red-600 min-[360px]:text-sm">{searchError}</p>}

      <div className="mt-4 flex flex-col gap-2.5 min-[360px]:mt-6 min-[360px]:gap-3 sm:flex-row">
        <Link
          href="/subjects"
          className="inline-flex min-h-[44px] w-full min-w-0 items-center justify-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-xs font-semibold text-white shadow-[0_8px_24px_rgba(124,58,237,0.28)] transition hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 sm:w-auto min-[360px]:gap-2 min-[360px]:px-6 min-[360px]:py-3.5 min-[360px]:text-sm"
        >
          {c.startPractice}
          <ArrowRight className="h-3.5 w-3.5 shrink-0 min-[360px]:h-4 min-[360px]:w-4" aria-hidden="true" />
        </Link>
        <Link
          href="/subjects"
          className="inline-flex min-h-[44px] w-full min-w-0 items-center justify-center rounded-full border-2 border-brand/30 bg-white px-4 py-2.5 text-xs font-semibold text-brand transition hover:border-brand hover:bg-[#FAF5FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 sm:w-auto min-[360px]:px-6 min-[360px]:py-3.5 min-[360px]:text-sm"
        >
          {c.exploreSubjects}
        </Link>
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-snug text-slate-500 min-[360px]:mt-4 min-[360px]:gap-2 min-[360px]:text-xs sm:text-sm">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand min-[360px]:h-4 min-[360px]:w-4" />
        <span className="break-words">{c.noLogin}</span>
      </p>
    </>
  );
}
