'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Globe, Leaf, Map, Mountain } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type GeographyModule = {
  slug: string;
  number: string;
  title: string;
  description: string;
  modulesLabel: string;
  icon: LucideIcon;
  iconClassName?: string;
  imageSrc: string;
  imageAlt: string;
};

const geographyModules: GeographyModule[] = [
  {
    slug: 'physical-geography',
    number: '1',
    title: 'Physical Geography',
    description:
      'Study the natural systems of the Earth including landforms, climate, oceans, atmosphere and geomorphological processes.',
    modulesLabel: '22 Modules',
    icon: Mountain,
    imageSrc: '/geography/physical-geography.png',
    imageAlt: 'Physical geography mountains and river illustration',
  },
  {
    slug: 'indian-geography',
    number: '2',
    title: 'Indian Geography',
    description:
      "Explore India's physical features, climate, resources, population, agriculture, industries, transport, states and more.",
    modulesLabel: '28 Modules',
    icon: Map,
    imageSrc: '/geography/indian-geography.png',
    imageAlt: 'Indian geography India Gate illustration',
  },
  {
    slug: 'world-geography',
    number: '3',
    title: 'World Geography',
    description:
      'Learn about continents, countries, physical features, climate, resources, oceans, important locations and global patterns.',
    modulesLabel: '24 Modules',
    icon: Globe,
    imageSrc: '/geography/world-geography.png',
    imageAlt: 'World geography globe illustration',
  },
  {
    slug: 'environment-ecology',
    number: '4',
    title: 'Environment & Ecology',
    description:
      'Understand ecosystems, biodiversity, environmental issues, conservation, climate change, pollution and important conventions.',
    modulesLabel: '16 Modules',
    icon: Leaf,
    iconClassName: 'text-emerald-600',
    imageSrc: '/geography/environment-ecology.png',
    imageAlt: 'Environment and ecology wind turbines illustration',
  },
  {
    slug: 'maps-geographic-locations',
    number: '5',
    title: 'Maps & Geographic Locations',
    description:
      'Practice map reading of India and World including rivers, mountains, states, countries, capitals, oceans, straits, canals and more.',
    modulesLabel: '20 Modules',
    icon: Map,
    imageSrc: '/geography/maps-locations.png',
    imageAlt: 'Maps and geographic locations illustration',
  },
];

function GeographyCard({ module }: { module: GeographyModule }) {
  const Icon = module.icon;
  const href =
    module.slug === 'maps-geographic-locations'
      ? '/map-practice'
      : `/geography/topics?category=${encodeURIComponent(module.slug)}`;

  return (
    <Link
      href={href}
      className="group relative flex min-h-[290px] flex-col overflow-hidden rounded-2xl border border-slate-100/80 bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(109,40,217,0.10)]"
    >
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-[#7C3AED]">
          <Icon className={`h-5 w-5 ${module.iconClassName ?? ''}`} strokeWidth={2.1} />
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

export default function GeographyClient() {
  const topRow = geographyModules.slice(0, 3);
  const bottomRow = geographyModules.slice(3);

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
          <h1 className="mt-3 text-[2.35rem] font-bold tracking-tight text-[#111827] sm:text-[2.75rem]">Geography</h1>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-[#6B7280]">
            Comprehensive geography topics for UPSC, State PCS, SSC and other competitive exams
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {topRow.map((module) => (
            <GeographyCard key={module.slug} module={module} />
          ))}
        </div>

        <div className="mx-auto mt-5 grid max-w-[720px] grid-cols-1 gap-5 md:grid-cols-2">
          {bottomRow.map((module) => (
            <GeographyCard key={module.slug} module={module} />
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
