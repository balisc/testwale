'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';

type BilingualText = {
  en: string;
  hi: string;
};

export default function HistoryPage() {
  const { language } = useLanguage();
  const [topics, setTopics] = useState<BilingualText[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadTopics() {
      try {
        const response = await fetch('/api/history/topics');
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || 'Unable to load topics.');
        }

        setTopics((payload.topics || []) as BilingualText[]);
      } catch (error) {
        setTopics([]);
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load topics.');
      } finally {
        setIsLoading(false);
      }
    }

    loadTopics();
  }, []);

  const getText = (bilingual: BilingualText | string) => {
    if (typeof bilingual === 'string') return bilingual;
    return bilingual?.[language] || bilingual?.en || '';
  };

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-10">
      <div className="mb-8 rounded-[2rem] bg-[#03050b] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-amber-300">History</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">History Topics</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Explore various topics in Indian History. Click on a topic to start practicing questions.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
          >
            Back to Home
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300 shadow-panel">
            Loading topics...
          </div>
        ) : errorMessage ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center text-red-200 shadow-panel">
            <p className="text-lg font-semibold">{errorMessage}</p>
          </div>
        ) : !topics.length ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300 shadow-panel">
            No topics found.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic, index) => (
              <Link
                key={index}
                href={`/history/${encodeURIComponent(getText(topic))}`}
                className="group rounded-3xl border border-white/10 bg-[#081420] p-6 shadow-panel transition hover:border-amber-400/30 hover:bg-[#0a1a2a]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white group-hover:text-amber-300">
                      {getText(topic)}
                    </h3>
                    <p className="mt-2 text-sm text-slate-400">Practice questions</p>
                  </div>
                  <div className="text-2xl text-amber-400">📚</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}