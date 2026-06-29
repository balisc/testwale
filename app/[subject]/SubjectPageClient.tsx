'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import SubjectTopicsClient from '../subjects/[subject]/SubjectTopicsClient';
import { Crown, Library, FileText } from 'lucide-react';

type TopicItem = {
  en: string;
  hi: string;
  count: number;
};

const epochCards = [
  {
    slug: 'ancient',
    title: 'Ancient Indian History',
    description: 'Practice MCQs on Indus Valley Civilisation, Vedic Era, and Mauryan Empire.',
    icon: Library,
    highlighted: false,
    modulesLabel: '12 Modules',
  },
  {
    slug: 'medieval',
    title: 'Medieval Indian History',
    description: 'Practice MCQs on Rajput kingdoms, Mughal Empire, and regional powers.',
    icon: Crown,
    highlighted: true,
    modulesLabel: '14 Modules',
  },
  {
    slug: 'modern',
    title: 'Modern Indian History',
    description: 'Engage with questions on Freedom Struggle, British Rule, and National movements.',
    icon: FileText,
    highlighted: false,
    modulesLabel: '11 Modules',
  },
];

export default function SubjectPageClient({
  subjectKey,
  topics,
}: {
  subjectKey: string;
  topics: TopicItem[];
}) {
  const isHistory = subjectKey === 'history';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ ease: 'easeInOut', duration: 0.4 }}
        className="max-w-7xl mx-auto px-4 pt-6 pb-16 sm:px-6 lg:px-8"
      >
        {isHistory ? (
          <section className="mx-auto max-w-5xl py-10 font-[Outfit,sans-serif]">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold tracking-widest text-purple-600 uppercase mb-2">Core Subjects</p>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">History</h1>
              <p className="mt-2 text-sm text-gray-500">Ancient, Medieval, and Modern India topics for exam practice</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {epochCards.map((card) => {
                const CardIcon = card.icon;
                return (
                  <Link
                    key={card.slug}
                    href={`/${encodeURIComponent(subjectKey)}/topics?sub_category=${encodeURIComponent(card.slug)}`}
                    className={[
                      'block rounded-2xl p-7 text-left cursor-pointer transition-all duration-200 bg-white border-2',
                      card.highlighted
                        ? 'border-purple-600 shadow-[0_4px_24px_0_rgba(109,40,217,0.13)]'
                        : 'border-purple-100 hover:border-purple-300 hover:-translate-y-1 hover:shadow-[0_8px_40px_0_rgba(109,40,217,0.13)]',
                    ].join(' ')}
                  >
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-6 text-purple-600">
                      <CardIcon className="h-6 w-6" />
                    </div>

                    <h2 className="text-lg font-bold text-gray-900 mb-2">{card.title}</h2>
                    <p className="text-sm text-gray-500 leading-relaxed">{card.description}</p>

                    <div className="mt-6 flex items-center gap-2">
                      {card.highlighted ? (
                        <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                          Active
                        </span>
                      ) : null}
                      <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{card.modulesLabel}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <p className="text-center text-xs text-gray-400 mt-10">
              Click any card to activate · Hover for preview
            </p>
          </section>
        ) : (
          <SubjectTopicsClient subjectKey={subjectKey} topics={topics} />
        )}
      </motion.div>
    </div>
  );
}
