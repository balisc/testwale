'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Calculator,
  Dices,
  Hash,
  Network,
  Shapes,
  TrendingUp,
  Variable,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type MathModule = {
  slug: string;
  number: string;
  title: string;
  description: string;
  modulesLabel: string;
  icon: LucideIcon;
  imageSrc: string;
  imageAlt: string;
};

const mathModules: MathModule[] = [
  {
    slug: 'number-system',
    number: '1',
    title: 'Number System',
    description:
      'Learn number types, divisibility rules, factors, multiples, HCF, LCM, remainder, unit digit, simplification, surds and indices.',
    modulesLabel: '18 Modules',
    icon: Hash,
    imageSrc: '/math/number-system.png',
    imageAlt: 'Number system blocks illustration',
  },
  {
    slug: 'arithmetic',
    number: '2',
    title: 'Arithmetic',
    description:
      'Master percentage, profit & loss, SI, CI, ratio, average, time & work, speed & distance, trains, pipes & cistern, mixture, ages and more.',
    modulesLabel: '24 Modules',
    icon: Calculator,
    imageSrc: '/math/arithmetic.png',
    imageAlt: 'Arithmetic calculator and coins illustration',
  },
  {
    slug: 'algebra',
    number: '3',
    title: 'Algebra',
    description:
      'Study algebraic expressions, linear & quadratic equations, polynomials, inequalities and logarithms in detail.',
    modulesLabel: '16 Modules',
    icon: Variable,
    imageSrc: '/math/algebra.png',
    imageAlt: 'Algebra formulas illustration',
  },
  {
    slug: 'geometry-mensuration',
    number: '4',
    title: 'Geometry & Mensuration',
    description:
      'Explore lines & angles, triangles, quadrilaterals, circles, polygons, coordinate geometry, 2D & 3D mensuration and more.',
    modulesLabel: '20 Modules',
    icon: Shapes,
    imageSrc: '/math/geometry-mensuration.png',
    imageAlt: 'Geometry and mensuration shapes illustration',
  },
  {
    slug: 'trigonometry',
    number: '5',
    title: 'Trigonometry',
    description: 'Learn trigonometric ratios, identities, heights & distances and their real-life applications.',
    modulesLabel: '14 Modules',
    icon: TrendingUp,
    imageSrc: '/math/trigonometry.png',
    imageAlt: 'Trigonometry sine wave illustration',
  },
  {
    slug: 'data-interpretation',
    number: '6',
    title: 'Data Interpretation',
    description:
      'Practice tables, bar graphs, pie charts, line graphs, caselet DI and mixed graphs with concept clarity.',
    modulesLabel: '18 Modules',
    icon: BarChart3,
    imageSrc: '/math/data-interpretation.png',
    imageAlt: 'Data interpretation charts illustration',
  },
  {
    slug: 'statistics-probability',
    number: '7',
    title: 'Statistics & Probability',
    description: 'Understand mean, median, mode, probability, permutation and combination with solved examples.',
    modulesLabel: '12 Modules',
    icon: Dices,
    imageSrc: '/math/statistics-probability.png',
    imageAlt: 'Statistics and probability illustration',
  },
  {
    slug: 'advanced-mathematics',
    number: '8',
    title: 'Advanced Mathematics',
    description:
      'Enhance skills with sequence & series, set theory, venn diagram, binary numbers, mathematical reasoning and more.',
    modulesLabel: '16 Modules',
    icon: Network,
    imageSrc: '/math/advanced-mathematics.png',
    imageAlt: 'Advanced mathematics Venn diagram illustration',
  },
];

function MathCard({ module }: { module: MathModule }) {
  const Icon = module.icon;

  return (
    <Link
      href={`/math/topics?category=${encodeURIComponent(module.slug)}`}
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
      <p className="relative z-10 mt-2.5 max-w-[85%] flex-1 text-[13px] leading-[1.65] text-[#6B7280]">{module.description}</p>

      <div className="relative mt-auto pt-8">
        <span className="relative z-10 inline-flex items-center gap-1.5 rounded-full bg-[#F3E8FF] px-3 py-1.5 text-[11px] font-semibold text-[#7C3AED]">
          <BookOpen className="h-3.5 w-3.5" strokeWidth={2.2} />
          {module.modulesLabel}
        </span>

        <div className="pointer-events-none absolute -bottom-2 -right-2 z-0 h-[130px] w-[150px]">
          <Image
            src={module.imageSrc}
            alt={module.imageAlt}
            fill
            className="object-contain object-bottom-right"
            sizes="150px"
          />
        </div>
      </div>
    </Link>
  );
}

export default function MathClient() {
  const topRow = mathModules.slice(0, 3);
  const middleRow = mathModules.slice(3, 6);
  const bottomRow = mathModules.slice(6);

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
          <h1 className="mt-3 text-[2.35rem] font-bold tracking-tight text-[#111827] sm:text-[2.75rem]">Mathematics</h1>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-[#6B7280]">
            Comprehensive quantitative aptitude topics for UPSC, State PCS, SSC and other competitive exams
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {topRow.map((module) => (
            <MathCard key={module.slug} module={module} />
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
          {middleRow.map((module) => (
            <MathCard key={module.slug} module={module} />
          ))}
        </div>

        <div className="mx-auto mt-5 grid max-w-[720px] grid-cols-1 gap-5 md:grid-cols-2">
          {bottomRow.map((module) => (
            <MathCard key={module.slug} module={module} />
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
