'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Globe,
  Globe2,
  Landmark,
  Lightbulb,
  PieChart,
  Target,
  Tractor,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type ThemeColors = {
  iconBg: string;
  iconText: string;
  badgeBg: string;
  badgeText: string;
};

type EconomicsModule = {
  slug: string;
  number: string;
  title: string;
  description: string;
  modulesLabel: string;
  icon: LucideIcon;
  theme: ThemeColors;
  imageSrc: string;
  imageAlt: string;
};

const economicsModules: EconomicsModule[] = [
  {
    slug: 'economic-fundamentals',
    number: '1',
    title: 'Economic Fundamentals',
    description:
      'Learn basic economic concepts, demand supply, market structures, production, cost and economic systems.',
    modulesLabel: '18 Modules',
    icon: Lightbulb,
    theme: { iconBg: 'bg-[#DBEAFE]', iconText: 'text-[#2563EB]', badgeBg: 'bg-[#DBEAFE]', badgeText: 'text-[#2563EB]' },
    imageSrc: '/economics/economic-fundamentals.png',
    imageAlt: 'Economic fundamentals bar chart illustration',
  },
  {
    slug: 'national-income-macroeconomics',
    number: '2',
    title: 'National Income & Macroeconomics',
    description:
      'Understand national income, GDP, economic indicators, growth, development and business cycles.',
    modulesLabel: '16 Modules',
    icon: PieChart,
    theme: { iconBg: 'bg-[#DCFCE7]', iconText: 'text-[#16A34A]', badgeBg: 'bg-[#DCFCE7]', badgeText: 'text-[#16A34A]' },
    imageSrc: '/economics/national-income.png',
    imageAlt: 'National income macroeconomics graph illustration',
  },
  {
    slug: 'money-banking-financial-system',
    number: '3',
    title: 'Money, Banking & Financial System',
    description:
      'Explore money, RBI, banks, monetary policy, financial institutions, capital markets, digital payments and insurance.',
    modulesLabel: '22 Modules',
    icon: Landmark,
    theme: { iconBg: 'bg-[#F3E8FF]', iconText: 'text-[#7C3AED]', badgeBg: 'bg-[#F3E8FF]', badgeText: 'text-[#7C3AED]' },
    imageSrc: '/economics/money-banking.png',
    imageAlt: 'Money banking financial system illustration',
  },
  {
    slug: 'public-finance',
    number: '4',
    title: 'Public Finance',
    description: 'Study budget, taxation, GST, fiscal policy, public debt and deficit financing in detail.',
    modulesLabel: '14 Modules',
    icon: Calculator,
    theme: { iconBg: 'bg-[#FFEDD5]', iconText: 'text-[#EA580C]', badgeBg: 'bg-[#FFEDD5]', badgeText: 'text-[#EA580C]' },
    imageSrc: '/economics/public-finance.png',
    imageAlt: 'Public finance tax illustration',
  },
  {
    slug: 'indian-economy-sectors',
    number: '5',
    title: 'Indian Economy — Sectors',
    description:
      'Cover agriculture, industry, services, infrastructure, MSMEs, energy sector and key schemes (concept-level).',
    modulesLabel: '24 Modules',
    icon: Tractor,
    theme: { iconBg: 'bg-[#DCFCE7]', iconText: 'text-[#16A34A]', badgeBg: 'bg-[#DCFCE7]', badgeText: 'text-[#16A34A]' },
    imageSrc: '/economics/indian-economy-sectors.png',
    imageAlt: 'Indian economy sectors illustration',
  },
  {
    slug: 'economic-planning-development',
    number: '6',
    title: 'Economic Planning & Development',
    description:
      'Learn planning in India, five year plans, NITI Aayog, sustainable development, inclusive growth and HDI.',
    modulesLabel: '16 Modules',
    icon: Target,
    theme: { iconBg: 'bg-[#FFEDD5]', iconText: 'text-[#EA580C]', badgeBg: 'bg-[#FFEDD5]', badgeText: 'text-[#EA580C]' },
    imageSrc: '/economics/economic-planning.png',
    imageAlt: 'Economic planning development illustration',
  },
  {
    slug: 'external-sector',
    number: '7',
    title: 'External Sector',
    description: 'Understand international trade, BOP, foreign exchange, FDI, FPI and trade agreements.',
    modulesLabel: '16 Modules',
    icon: Globe,
    theme: { iconBg: 'bg-[#DBEAFE]', iconText: 'text-[#2563EB]', badgeBg: 'bg-[#DBEAFE]', badgeText: 'text-[#2563EB]' },
    imageSrc: '/economics/external-sector.png',
    imageAlt: 'External sector trade illustration',
  },
  {
    slug: 'inflation-employment-poverty',
    number: '8',
    title: 'Inflation, Employment & Poverty',
    description: 'Study inflation, unemployment, poverty, inequality and employment schemes (concept-level).',
    modulesLabel: '16 Modules',
    icon: Users,
    theme: { iconBg: 'bg-[#FCE7F3]', iconText: 'text-[#DB2777]', badgeBg: 'bg-[#FCE7F3]', badgeText: 'text-[#DB2777]' },
    imageSrc: '/economics/inflation-employment.png',
    imageAlt: 'Inflation employment poverty illustration',
  },
  {
    slug: 'international-economic-organizations',
    number: '9',
    title: 'International Economic Organizations',
    description: 'Explore IMF, World Bank, WTO, ADB, AIIB, BRICS Bank (NDB) and OECD in detail.',
    modulesLabel: '12 Modules',
    icon: Globe2,
    theme: { iconBg: 'bg-[#F3E8FF]', iconText: 'text-[#7C3AED]', badgeBg: 'bg-[#F3E8FF]', badgeText: 'text-[#7C3AED]' },
    imageSrc: '/economics/international-organizations.png',
    imageAlt: 'International economic organizations illustration',
  },
];

function EconomicsCard({ module }: { module: EconomicsModule }) {
  const Icon = module.icon;

  return (
    <Link
      href={`/economics/topics?category=${encodeURIComponent(module.slug)}`}
      className="group relative flex min-h-[290px] flex-col overflow-hidden rounded-2xl border border-slate-100/80 bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(15,23,42,0.08)]"
    >
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${module.theme.iconBg} ${module.theme.iconText}`}
        >
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
        <span
          className={`relative z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${module.theme.badgeBg} ${module.theme.badgeText}`}
        >
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

export default function EconomicsClient() {
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
          <h1 className="mt-3 text-[2.35rem] font-bold tracking-tight text-[#111827] sm:text-[2.75rem]">Economics</h1>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-[#6B7280]">
            Comprehensive economics topics for UPSC, State PCS, SSC and other competitive exams
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {economicsModules.map((module) => (
            <EconomicsCard key={module.slug} module={module} />
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
