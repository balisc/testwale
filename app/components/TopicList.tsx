'use client';

import Link from 'next/link';
import { useLanguage } from '../../lib/LanguageContext';

type TopicItem = {
  en: string;
  hi: string;
};

type TopicListProps = {
  topics: TopicItem[];
  subjectKey: string;
};

export default function TopicList({ topics, subjectKey }: TopicListProps) {
  const { language } = useLanguage();

  return (
    <div className="space-y-4">
      {topics.map((topic) => {
        const topicText = language === 'hi' ? topic.hi || topic.en : topic.en || topic.hi;
        const topicHref = `/subjects/${subjectKey}/${encodeURIComponent(topicText)}?v=${Date.now()}`;

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
  );
}
