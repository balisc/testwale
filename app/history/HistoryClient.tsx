'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Castle, Landmark, Ship, type LucideIcon } from 'lucide-react';

type HistoryModule = {
  slug: string;
  number: string;
  title: string;
  description: string;
  modulesLabel: string;
  icon: LucideIcon;
  imageSrc: string;
  imageAlt: string;
};

const historyModules: HistoryModule[] = [
  {
    slug: 'ancient',
    number: '1',
    title: 'Ancient History',
    description:
      'Explore from the Indus Valley Civilization to the end of the Gupta Period and early Indian culture.',
    modulesLabel: '32 Modules',
    icon: Landmark,
    imageSrc: '/history/ancient-stupa.png',
    imageAlt: 'Ancient history stupa illustration',
  },
  {
    slug: 'medieval',
    number: '2',
    title: 'Medieval History',
    description:
      'Study the medieval period from early medieval kingdoms to the Mughal Empire and regional states.',
    modulesLabel: '34 Modules',
    icon: Castle,
    imageSrc: '/history/medieval-fort.png',
    imageAlt: 'Medieval history fort illustration',
  },
  {
    slug: 'modern',
    number: '3',
    title: 'Modern History',
    description:
      'Learn about the arrival of Europeans, British rule, freedom struggle and post-independence India.',
    modulesLabel: '36 Modules',
    icon: Ship,
    imageSrc: '/history/modern-gate.png',
    imageAlt: 'Modern history monument illustration',
  },
];

const CARD_BASE =
  'group relative overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(109,40,217,0.10)]';

function ArrowBadge() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3E8FF] text-[#7C3AED] transition group-hover:bg-[#EDE9FE]">
      <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
    </span>
  );
}

function ModulesBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3E8FF] px-3 py-1.5 text-[11px] font-semibold text-[#7C3AED]">
      <BookOpen className="h-3.5 w-3.5" strokeWidth={2.2} />
      {label}
    </span>
  );
}

function HistoryCard({ module }: { module: HistoryModule }) {
  const Icon = module.icon;
  const href = `/history/topics?sub_category=${encodeURIComponent(module.slug)}`;

  return (
    <Link href={href} className={`${CARD_BASE} flex min-h-[290px] flex-col p-6`}>
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-[#7C3AED]">
          <Icon className="h-5 w-5" strokeWidth={2.1} />
        </div>
        <ArrowBadge />
      </div>

      <h2 className="relative z-10 mt-5 pr-2 text-[17px] font-bold leading-snug text-[#111827]">
        {module.number}. {module.title}
      </h2>
      <span className="relative z-10 mt-2 block h-[3px] w-10 rounded-full bg-[#7C3AED]" aria-hidden />

      <p className="relative z-10 mt-2.5 max-w-[62%] flex-1 text-[13px] leading-[1.65] text-[#6B7280]">
        {module.description}
      </p>

      <div className="relative mt-auto pt-8">
        <span className="relative z-10">
          <ModulesBadge label={module.modulesLabel} />
        </span>

        <div className="pointer-events-none absolute bottom-1 right-1 z-0 h-[130px] w-[142px]">
          <Image
            src={module.imageSrc}
            alt={module.imageAlt}
            fill
            className="object-contain object-bottom-right"
            sizes="142px"
          />
        </div>
      </div>
    </Link>
  );
}

export default function HistoryClient() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="mx-auto max-w-[1100px] px-4 pb-14 pt-10 sm:px-6 lg:px-8"
      >
        <header className="mx-auto mb-12 max-w-3xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#7C3AED]">Core Subjects</p>
          <h1 className="mt-3 text-[2.35rem] font-bold tracking-tight text-[#111827] sm:text-[2.75rem]">History</h1>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-[#6B7280]">
            Comprehensive history topics for UPSC, State PCS, SSC and other competitive exams
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {historyModules.map((module) => (
            <HistoryCard key={module.slug} module={module} />
          ))}
        </div>

        <p className="mt-10 text-center text-[12px] text-[#9CA3AF]">
          <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#D1D5DB] text-[10px] text-[#9CA3AF]">
            i
          </span>
          Click on any card to explore topics and start practicing MCQs
        </p>
      </motion.div>
    </div>
  );
}
