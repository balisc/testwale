'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import SubjectTopicsClient from '../subjects/[subject]/SubjectTopicsClient';
import { Crown, Library, FileText, ChevronRight } from 'lucide-react';

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
    buttonLabel: 'Select ->',
  },
  {
    slug: 'medieval',
    title: 'Medieval Indian History',
    description: 'Practice MCQs on Rajput kingdoms, Mughal Empire, and regional powers.',
    icon: Crown,
    highlighted: true,
    buttonLabel: 'Select ->',
  },
  {
    slug: 'modern',
    title: 'Modern Indian History',
    description: 'Engage with questions on Freedom Struggle, British Rule, and National movements.',
    icon: FileText,
    highlighted: false,
    buttonLabel: 'Select ->',
  },
];

export default function SubjectPageClient({
  subjectKey,
  topics,
}: {
  subjectKey: string;
  topics: TopicItem[];
}) {
  const router = useRouter();
  const isHistory = subjectKey === 'history';

  const handleEpochSelect = (slug: string) => {
    router.push(`/${encodeURIComponent(subjectKey)}/topics?sub_category=${encodeURIComponent(slug)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <motion.main
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ ease: 'easeInOut', duration: 0.4 }}
        className="max-w-7xl mx-auto px-4 pt-6 pb-16 sm:px-6 lg:px-8"
      >
        {isHistory ? (
          <section className="space-y-10 p-11">
            <div className="text-center mx-auto max-w-3xl">
              <p className="text-sm uppercase tracking-[0.32em] text-slate-500">History Practice</p>
              <h1 className="mt-4 text-3xl sm:text-4xl font-semibold text-slate-900">Choose Your Epoch</h1>
              <p className="mt-4 text-base text-slate-600 leading-7">
                Select a history period to start practicing curated multiple-choice questions.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {epochCards.map((card) => {
                const CardIcon = card.icon;
                const cardClass = card.highlighted
                  ? 'relative overflow-hidden rounded-3xl border-2 border-purple-500 bg-white shadow-lg'
                  : 'rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition';

                return (
                  <button
                    key={card.slug}
                    type="button"
                    onClick={() => handleEpochSelect(card.slug)}
                    className={`${cardClass} p-6 text-left w-full group transition duration-300 ease-out hover:-translate-y-0.5`}
                  >
                    {card.highlighted && (
                      <span className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-700">
                        • Recommended
                      </span>
                    )}
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-800 mb-6">
                      <CardIcon className={`${card.highlighted ? 'text-purple-600' : 'text-slate-700'} h-7 w-7`} />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900">{card.title}</h2>
                    <p className="mt-3 text-sm text-slate-600 leading-6">{card.description}</p>
                    <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition duration-300 hover:bg-purple-700">
                      {card.buttonLabel}
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </button>
                );
              })}
            </div>

          </section>
        ) : (
          <SubjectTopicsClient subjectKey={subjectKey} topics={topics} />
        )}
      </motion.main>
    </div>
  );
}
