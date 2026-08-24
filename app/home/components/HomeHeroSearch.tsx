'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, FolderOpen, Layers, Search, X } from 'lucide-react';
import type { HomeSearchItem } from '../lib/catalogSearch';

const TYPE_META: Record<
  HomeSearchItem['type'],
  { label: string; Icon: typeof BookOpen }
> = {
  subject: { label: 'Subject', Icon: BookOpen },
  topic: { label: 'Topic', Icon: FolderOpen },
  subtopic: { label: 'Subtopic', Icon: Layers },
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export default function HomeHeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<HomeSearchItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const overlayInputRef = useRef<HTMLInputElement>(null);
  const fetchStarted = useRef(false);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) {
      const subjects = items.filter((item) => item.type === 'subject').slice(0, 8);
      const topics = items.filter((item) => item.type === 'topic').slice(0, 6);
      return [...subjects, ...topics];
    }
    return items
      .filter((item) => {
        return (
          normalize(item.label).includes(q) ||
          normalize(item.labelHi).includes(q) ||
          normalize(item.path).includes(q)
        );
      })
      .slice(0, 40);
  }, [items, query]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!expanded || fetchStarted.current) return;
    fetchStarted.current = true;
    setLoadingItems(true);
    fetch('/api/home/search')
      .then((r) => r.json())
      .then((data) => {
        setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => {
        setItems([]);
      })
      .finally(() => setLoadingItems(false));
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => overlayInputRef.current?.focus(), 50);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [expanded]);

  const openSearch = () => setExpanded(true);
  const closeSearch = () => setExpanded(false);

  const clearQuery = () => {
    setQuery('');
    overlayInputRef.current?.focus();
  };

  const goTo = (item: HomeSearchItem) => {
    setExpanded(false);
    router.push(item.href);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!normalize(query)) return;
    if (filtered[0]) goTo(filtered[0]);
  };

  const hasQuery = Boolean(normalize(query));

  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        className="flex h-12 w-full max-w-xl min-w-0 items-center gap-3 rounded-full border border-[#E4E7EC] bg-white px-4 text-left shadow-sm transition hover:border-[#DDD6FE] hover:shadow-md max-[479px]:h-11 max-[479px]:gap-2 max-[479px]:px-3"
        aria-label="Open search"
      >
        <Search className="h-4 w-4 shrink-0 text-[#98A2B3]" aria-hidden />
        <span className="min-w-0 truncate text-[15px] text-[#98A2B3] max-[479px]:text-xs">
          Search subject, topic, or subtopic…
        </span>
      </button>

      {mounted &&
        expanded &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex flex-col bg-[#FAFAFC]"
            role="dialog"
            aria-modal="true"
            aria-label="Search"
          >
            <div className="sticky top-0 z-10 border-b border-[#E4E7EC] bg-white px-1.5 pb-2.5 pt-[max(0.5rem,env(safe-area-inset-top))] min-[360px]:px-3 min-[360px]:pb-3 sm:px-4">
              <form
                onSubmit={onSubmit}
                className="mx-auto flex h-11 max-w-3xl min-w-0 items-center gap-0.5 rounded-full bg-[#F4F4F5] pl-1 pr-1.5 shadow-sm ring-1 ring-[#E4E7EC] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#DDD6FE] min-[360px]:h-12 min-[360px]:gap-1 min-[360px]:pl-1.5 min-[360px]:pr-2"
              >
                <button
                  type="button"
                  onClick={closeSearch}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#344054] transition hover:bg-[#E4E7EC]/40 min-[360px]:h-9 min-[360px]:w-9"
                  aria-label="Close search"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <input
                  ref={overlayInputRef}
                  id="home-hero-search-overlay"
                  type="search"
                  value={query}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Search…"
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-[#18181B] outline-none placeholder:text-[#98A2B3]"
                />
                {hasQuery ? (
                  <button
                    type="button"
                    onClick={clearQuery}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#667085] transition hover:bg-[#E4E7EC]/60"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <Search className="mr-1 h-4 w-4 shrink-0 text-[#98A2B3]" aria-hidden />
                )}
              </form>
            </div>

            <div className="min-w-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="mx-auto w-full max-w-3xl px-1.5 py-3 min-[360px]:px-2 sm:px-4 sm:py-4">
                {loadingItems && items.length === 0 ? (
                  <div className="rounded-2xl border border-[#E4E7EC] bg-white px-4 py-10 text-center text-sm text-[#667085]">
                    Loading suggestions…
                  </div>
                ) : (
                  <>
                    {!hasQuery && (
                      <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wide text-[#98A2B3] min-[360px]:px-3 min-[360px]:text-xs">
                        Suggested
                      </p>
                    )}
                    {hasQuery && (
                      <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wide text-[#98A2B3] min-[360px]:px-3 min-[360px]:text-xs">
                        {filtered.length} result{filtered.length === 1 ? '' : 's'}
                      </p>
                    )}

                    {filtered.length > 0 ? (
                      <ul className="divide-y divide-[#F2F4F7] overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white">
                        {filtered.map((item) => {
                          const { label, Icon } = TYPE_META[item.type];
                          return (
                            <li key={item.id}>
                              <Link
                                href={item.href}
                                onClick={() => setExpanded(false)}
                                className="flex w-full min-w-0 items-center gap-2 px-2.5 py-3 text-left transition hover:bg-[#F5F3FF] active:bg-[#EDE9FE] min-[360px]:gap-3 min-[360px]:px-3.5 min-[360px]:py-3.5 sm:px-4"
                              >
                                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5F3FF] text-[#6D28D9] min-[360px]:h-10 min-[360px]:w-10">
                                  <Icon className="h-4 w-4 min-[360px]:h-[18px] min-[360px]:w-[18px]" aria-hidden />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-medium text-[#18181B] min-[360px]:text-[15px]">
                                    {item.label}
                                  </span>
                                  <span className="mt-0.5 block truncate text-[10px] text-[#98A2B3] min-[360px]:text-xs">
                                    {label}
                                    {item.path && item.type !== 'subject' ? ` · ${item.path}` : ''}
                                  </span>
                                </span>
                                <Search className="hidden h-4 w-4 shrink-0 text-[#D0D5DD] min-[360px]:block" aria-hidden />
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="rounded-2xl border border-[#E4E7EC] bg-white px-4 py-10 text-center min-[360px]:px-6 min-[360px]:py-16">
                        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F4F5] text-[#98A2B3]">
                          <Search className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium text-[#18181B] min-[360px]:text-[15px]">No results found</p>
                        <p className="mt-1 text-xs text-[#667085] min-[360px]:text-sm">
                          Try another subject, topic, or subtopic name
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
