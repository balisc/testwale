'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Boxes,
  Calculator,
  ClipboardCheck,
  Clock,
  Compass,
  Lock,
  Scale,
  Search,
  Shapes,
  Sofa,
  Trophy,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type ReasoningModule = {
  slug: string;
  number: string;
  title: string;
  description: string;
  modulesLabel: string;
  icon: LucideIcon;
  imageSrc: string;
  imageAlt: string;
};

const reasoningModules: ReasoningModule[] = [
  {
    slug: 'analogy-classification',
    number: '01',
    title: 'Analogy & Classification',
    description: 'Verbal Analogy, Number/Letter Analogy, Classification (Odd One Out).',
    modulesLabel: '750+ MCQs',
    icon: Scale,
    imageSrc: '/reasoning/analogy.png',
    imageAlt: 'Analogy and classification illustration',
  },
  {
    slug: 'series',
    number: '02',
    title: 'Series',
    description: 'Number Series, Alphabet Series, Mixed Series.',
    modulesLabel: '1000+ MCQs',
    icon: BarChart3,
    imageSrc: '/reasoning/series.png',
    imageAlt: 'Series illustration',
  },
  {
    slug: 'coding-decoding',
    number: '03',
    title: 'Coding-Decoding',
    description: 'Letter Coding, Number Coding, Substitution Coding.',
    modulesLabel: '900+ MCQs',
    icon: Lock,
    imageSrc: '/reasoning/coding.png',
    imageAlt: 'Coding decoding illustration',
  },
  {
    slug: 'blood-relations',
    number: '04',
    title: 'Blood Relations',
    description: 'Direct Blood Relations, Coded Blood Relations, Family Tree Puzzles.',
    modulesLabel: '600+ MCQs',
    icon: Users,
    imageSrc: '/reasoning/blood-relations.png',
    imageAlt: 'Blood relations illustration',
  },
  {
    slug: 'direction-distance',
    number: '05',
    title: 'Direction & Distance',
    description: 'Direction Sense Test, Distance Calculation.',
    modulesLabel: '600+ MCQs',
    icon: Compass,
    imageSrc: '/reasoning/direction.png',
    imageAlt: 'Direction and distance illustration',
  },
  {
    slug: 'ranking-order-arrangement',
    number: '06',
    title: 'Ranking, Order & Arrangement',
    description: 'Ranking Test, Order & Sequence, Alphabet/Word Arrangement.',
    modulesLabel: '700+ MCQs',
    icon: Trophy,
    imageSrc: '/reasoning/ranking.png',
    imageAlt: 'Ranking and order illustration',
  },
  {
    slug: 'seating-arrangement-puzzle',
    number: '07',
    title: 'Seating Arrangement & Puzzle',
    description: 'Linear Seating Arrangement, Circular Seating Arrangement, Puzzle (Floor-based, Box-based).',
    modulesLabel: '2000+ MCQs',
    icon: Sofa,
    imageSrc: '/reasoning/seating.png',
    imageAlt: 'Seating arrangement illustration',
  },
  {
    slug: 'syllogism',
    number: '08',
    title: 'Syllogism',
    description: 'Categorical Syllogism, Venn Diagram Method, Possibility Cases.',
    modulesLabel: '1200+ MCQs',
    icon: Shapes,
    imageSrc: '/reasoning/syllogism.png',
    imageAlt: 'Syllogism Venn diagram illustration',
  },
  {
    slug: 'statement-based-reasoning',
    number: '09',
    title: 'Statement-Based Reasoning',
    description:
      'Statement & Assumption, Statement & Argument, Statement & Conclusion, Statement & Course of Action, Statement & Inference.',
    modulesLabel: '1500+ MCQs',
    icon: ClipboardCheck,
    imageSrc: '/reasoning/statement.png',
    imageAlt: 'Statement based reasoning illustration',
  },
  {
    slug: 'logical-mathematical-operations',
    number: '10',
    title: 'Logical & Mathematical Operations',
    description: 'Number-based Reasoning, Mathematical Operations (Symbol-based), Inequality Reasoning.',
    modulesLabel: '1500+ MCQs',
    icon: Calculator,
    imageSrc: '/reasoning/logical-math.png',
    imageAlt: 'Logical and mathematical operations illustration',
  },
  {
    slug: 'non-verbal-reasoning',
    number: '11',
    title: 'Non-Verbal Reasoning',
    description:
      'Mirror Image, Water Image, Paper Folding & Cutting, Pattern Completion, Figure Series, Embedded Figures, Figure Classification.',
    modulesLabel: '2000+ MCQs',
    icon: Shapes,
    imageSrc: '/reasoning/non-verbal.png',
    imageAlt: 'Non-verbal reasoning illustration',
  },
  {
    slug: 'clock-calendar',
    number: '12',
    title: 'Clock & Calendar',
    description: 'Clock-based Problems (Angle, Time), Calendar-based Problems (Day-Date).',
    modulesLabel: '800+ MCQs',
    icon: Clock,
    imageSrc: '/reasoning/clock-calendar.png',
    imageAlt: 'Clock and calendar illustration',
  },
  {
    slug: 'spatial-reasoning',
    number: '13',
    title: 'Spatial Reasoning (Cube & Dice)',
    description: 'Cube Construction & Painting, Cube Rotation, Open Cube, Dice - Standard & Non-standard.',
    modulesLabel: '1000+ MCQs',
    icon: Boxes,
    imageSrc: '/reasoning/spatial.png',
    imageAlt: 'Spatial reasoning cube and dice illustration',
  },
  {
    slug: 'data-sufficiency-decision-making',
    number: '14',
    title: 'Data Sufficiency & Decision Making',
    description: 'Data Sufficiency, Decision Making, Input-Output (Machine-based).',
    modulesLabel: '1000+ MCQs',
    icon: Search,
    imageSrc: '/reasoning/data-sufficiency.png',
    imageAlt: 'Data sufficiency and decision making illustration',
  },
];

function ReasoningCard({ module }: { module: ReasoningModule }) {
  const Icon = module.icon;

  return (
    <Link
      href={`/reasoning/topics?category=${encodeURIComponent(module.slug)}`}
      className="group relative flex min-h-[290px] flex-col overflow-hidden rounded-2xl border border-slate-100/80 bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(109,40,217,0.10)]"
    >
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-[#7C3AED]">
          <Icon className="h-5 w-5" strokeWidth={2.1} />
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3E8FF] text-[#7C3AED] transition group-hover:bg-[#EDE9FE]">
          <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
        </span>
      </div>

      <h2 className="relative z-10 mt-5 pr-2 text-[17px] font-bold leading-snug text-[#111827]">
        {module.number}. {module.title}
      </h2>
      <p className="relative z-10 mt-2.5 max-w-[62%] flex-1 text-[13px] leading-[1.65] text-[#6B7280]">
        {module.description}
      </p>

      <div className="relative mt-auto pt-8">
        <span className="relative z-10 inline-flex items-center gap-1.5 rounded-full bg-[#F3E8FF] px-3 py-1.5 text-[11px] font-semibold text-[#7C3AED]">
          <BookOpen className="h-3.5 w-3.5" strokeWidth={2.2} />
          {module.modulesLabel}
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

export default function ReasoningClient() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="mx-auto max-w-[1100px] px-4 pb-14 pt-10 sm:px-6 lg:px-8"
      >
        <header className="mx-auto mb-12 max-w-3xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#7C3AED]">Core Subjects</p>
          <h1 className="mt-3 text-[2.35rem] font-bold tracking-tight text-[#111827] sm:text-[2.75rem]">Reasoning</h1>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-[#6B7280]">
            Strengthen your logical thinking and problem-solving skills with a comprehensive collection of reasoning
            topics for all competitive exams
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {reasoningModules.map((module) => (
            <ReasoningCard key={module.slug} module={module} />
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
