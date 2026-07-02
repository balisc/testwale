'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Atom, BookOpen, Cpu, Dna, FlaskConical, Laptop2, Rocket, Telescope, type LucideIcon } from 'lucide-react';

type ScienceModule = {
  slug: string;
  number: string;
  title: string;
  description: string;
  modulesLabel: string;
  icon: LucideIcon;
  imageSrc: string;
  imageAlt: string;
  cardSpan?: string;
};

const scienceModules: ScienceModule[] = [
  {
    slug: 'physics',
    number: '1',
    title: 'Physics',
    description:
      'Learn physical world concepts including mechanics, thermodynamics, waves, optics, electricity, magnetism, and modern physics.',
    modulesLabel: '13 Modules',
    icon: Atom,
    imageSrc: '/science/science-physics.png',
    imageAlt: 'Physics illustration',
  },
  {
    slug: 'chemistry',
    number: '2',
    title: 'Chemistry',
    description:
      'Cover atomic structure, periodic table, bonding, states of matter, equilibrium, organic chemistry, inorganic chemistry, and applications.',
    modulesLabel: '12 Modules',
    icon: FlaskConical,
    imageSrc: '/science/science-chemistry.png',
    imageAlt: 'Chemistry illustration',
  },
  {
    slug: 'biology',
    number: '3',
    title: 'Biology',
    description:
      'Study living world, cell biology, plant and animal kingdoms, human body, genetics, evolution, ecology, nutrition, and microorganisms.',
    modulesLabel: '12 Modules',
    icon: Dna,
    imageSrc: '/science/science-biology.png',
    imageAlt: 'Biology illustration',
  },
  {
    slug: 'general-science',
    number: '4',
    title: 'General Science',
    description:
      'Practice scientific instruments, units and measurements, laws, discoveries, Nobel prizes, and everyday science concepts for exams.',
    modulesLabel: '10 Modules',
    icon: Telescope,
    imageSrc: '/science/science-general.png',
    imageAlt: 'General science illustration',
  },
  {
    slug: 'space-astronomy',
    number: '5',
    title: 'Space Science & Astronomy',
    description:
      'Explore the solar system, stars, galaxies, satellites, ISRO missions, Chandrayaan updates, Aditya L1, and core space technology.',
    modulesLabel: '11 Modules',
    icon: Rocket,
    imageSrc: '/science/science-space.png',
    imageAlt: 'Space science illustration',
  },
  {
    slug: 'computer-it',
    number: '6',
    title: 'Computer & Information Technology',
    description:
      'Learn computer basics, hardware, software, operating systems, networking, internet, cyber security, cloud computing, and IT applications.',
    modulesLabel: '11 Modules',
    icon: Laptop2,
    imageSrc: '/science/science-computer.png',
    imageAlt: 'Computer technology illustration',
  },
  {
    slug: 'applied-science',
    number: '7',
    title: 'Applied Science & Emerging Technologies',
    description:
      'Build understanding of AI, robotics, biotechnology, renewable energy, green hydrogen, quantum computing, semiconductors, and defence tech.',
    modulesLabel: '11 Modules',
    icon: Cpu,
    imageSrc: '/science/science-applied.png',
    imageAlt: 'Applied science illustration',
    cardSpan: 'md:col-span-3',
  },
];

const CARD_BASE =
  'group relative overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(109,40,217,0.10)]';

function ArrowBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3E8FF] text-[#7C3AED] transition group-hover:bg-[#EDE9FE] ${className}`}
    >
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

function ScienceCard({ module }: { module: ScienceModule }) {
  const Icon = module.icon;
  const isWide = Boolean(module.cardSpan);
  const href = `/science/topics?category=${encodeURIComponent(module.slug)}`;

  if (isWide) {
    return (
      <Link
        href={href}
        className={`${CARD_BASE} ${module.cardSpan ?? ''} flex min-h-[150px] flex-col gap-5 p-6 sm:flex-row sm:items-center`}
      >
        <ArrowBadge className="absolute right-5 top-5 z-20" />

        <div className="relative z-10 flex flex-1 flex-col">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-[#7C3AED]">
              <Icon className="h-5 w-5" strokeWidth={2.1} />
            </div>
            <h2 className="pr-12 text-[17px] font-bold leading-snug text-[#111827]">
              {module.number}. {module.title}
            </h2>
          </div>
          <p className="mt-2.5 max-w-[640px] text-[13px] leading-[1.65] text-[#6B7280]">
            {module.description}
          </p>
          <div className="mt-4">
            <ModulesBadge label={module.modulesLabel} />
          </div>
        </div>

        <div className="relative h-[110px] w-full shrink-0 sm:h-[130px] sm:w-[300px] md:w-[380px] lg:w-[440px]">
          <Image
            src={module.imageSrc}
            alt={module.imageAlt}
            fill
            className="object-contain object-center sm:object-right"
            sizes="(max-width: 640px) 100vw, 440px"
          />
        </div>
      </Link>
    );
  }

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

export default function ScienceClient() {
  const topRow = scienceModules.slice(0, 3);
  const middleRow = scienceModules.slice(3, 6);
  const bottomRow = scienceModules.slice(6);

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
          <h1 className="mt-3 text-[2.35rem] font-bold tracking-tight text-[#111827] sm:text-[2.75rem]">Science</h1>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-[#6B7280]">
            Comprehensive science topics for UPSC, State PCS, SSC and other competitive exams
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {topRow.map((module) => (
            <ScienceCard key={module.slug} module={module} />
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
          {middleRow.map((module) => (
            <ScienceCard key={module.slug} module={module} />
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
          {bottomRow.map((module) => (
            <ScienceCard key={module.slug} module={module} />
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
