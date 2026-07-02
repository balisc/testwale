'use client';

import { motion } from 'framer-motion';
import SubjectTopicsClient from '../subjects/[subject]/SubjectTopicsClient';

type TopicItem = {
  en: string;
  hi: string;
  count: number;
};

export default function SubjectPageClient({
  subjectKey,
  topics,
}: {
  subjectKey: string;
  topics: TopicItem[];
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ ease: 'easeInOut', duration: 0.4 }}
        className="max-w-7xl mx-auto px-4 pt-6 pb-16 sm:px-6 lg:px-8"
      >
        <SubjectTopicsClient subjectKey={subjectKey} topics={topics} />
      </motion.div>
    </div>
  );
}
