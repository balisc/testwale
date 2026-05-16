'use client';

import Link from 'next/link';
import { useLanguage } from '../../../lib/LanguageContext';

type TopicItem = {
  en: string;
  hi: string;
};

const SUBJECT_LABELS: Record<string, { en: string; hi: string }> = {
  history: { en: 'History', hi: 'इतिहास' },
  science: { en: 'Science', hi: 'विज्ञान' },
  polity: { en: 'Polity', hi: 'राजव्यवस्था' },
  economics: { en: 'Economics', hi: 'अर्थशास्त्र' },
  geography: { en: 'Geography', hi: 'भूगोल' },
  'general-knowledge': { en: 'General Knowledge', hi: 'सामान्य ज्ञान' },
  math: { en: 'Math', hi: 'गणित' },
  'current-affairs': { en: 'Current Affairs', hi: 'वर्तमान मामले' },
  reasoning: { en: 'Reasoning', hi: 'तर्क' },
};

export default function SubjectTopicsClient({
  subjectKey,
  topics,
}: {
  subjectKey: string;
  topics: TopicItem[];
}) {
  const { language } = useLanguage();
  const subjectLabel = SUBJECT_LABELS[subjectKey]?.[language] ?? SUBJECT_LABELS[subjectKey]?.en ?? subjectKey;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{subjectLabel} Topics</h1>
            <p className="text-gray-600">Choose a topic to start practicing MCQs</p>
          </div>

          {topics.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-xl font-semibold text-slate-900">No topics were found</p>
              <p className="mt-3 text-slate-600">This subject does not have any topics in the connected database table yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topics.map((topic) => {
                const topicText = language === 'hi' ? topic.hi || topic.en : topic.en || topic.hi;
                const topicHref = `/subjects/${subjectKey}/${encodeURIComponent(topicText)}`;

                return (
                  <Link
                    key={`${topic.en}||${topic.hi}`}
                    href={topicHref}
                    className="block w-full max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl p-4 text-left font-semibold text-gray-800 hover:border-blue-600 transition-all flex justify-between items-center group"
                  >
                    <span>{topicText}</span>
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
