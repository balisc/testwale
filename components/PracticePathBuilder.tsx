'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, ChevronDown, Compass, GraduationCap } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useCatalogText } from '@/lib/useCatalogText';
import type { Exam } from '@/types/polity';

type PracticePathBuilderProps = {
  subjectSlug: string;
  exams: Exam[];
};

const COPY = {
  en: {
    title: 'Not sure where to begin?',
    sub: 'Select your exam and get a recommended topic order.',
    selectExam: 'Select exam',
    build: 'Build Practice Path',
  },
  hi: {
    title: 'कहाँ से शुरू करें, पता नहीं?',
    sub: 'अपनी परीक्षा चुनें और अनुशंसित विषय क्रम पाएँ।',
    selectExam: 'परीक्षा चुनें',
    build: 'अभ्यास पथ बनाएँ',
  },
};

const MENU_EASE = [0.16, 1, 0.3, 1] as const;

const menuPanelVariants = {
  hidden: { opacity: 0, scaleY: 0.92 },
  visible: {
    opacity: 1,
    scaleY: 1,
    transition: { duration: 0.22, ease: MENU_EASE },
  },
  exit: {
    opacity: 0,
    scaleY: 0.94,
    transition: { duration: 0.16, ease: [0.4, 0, 0.2, 1] as const },
  },
};

const menuListVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.06 },
  },
  exit: {
    transition: { staggerChildren: 0.02, staggerDirection: -1 },
  },
};

const menuItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.18, ease: MENU_EASE },
  },
  exit: {
    opacity: 0,
    x: -6,
    transition: { duration: 0.12 },
  },
};

function ExamDropdownItem({
  exam,
  selected,
  onSelect,
}: {
  exam: Exam;
  selected: boolean;
  onSelect: (code: string) => void;
}) {
  const label = useCatalogText(exam.title);

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={() => onSelect(exam.code)}
      className={`flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition ${
        selected
          ? 'bg-[#F3E8FF] text-brand shadow-sm'
          : 'text-slate-700 hover:bg-[#FAF5FF] hover:text-brand'
      }`}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
            selected ? 'bg-brand text-white' : 'bg-[#EDE9FE] text-brand'
          }`}
        >
          {exam.code.slice(0, 2)}
        </span>
        <span className="truncate">{label}</span>
      </span>
      {selected && <Check className="h-4 w-4 shrink-0 text-brand" strokeWidth={2.5} aria-hidden />}
    </button>
  );
}

function ExamSelectDropdown({
  exams,
  selectedExam,
  onChange,
  label,
}: {
  exams: Exam[];
  selectedExam: string;
  onChange: (code: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    openUp: boolean;
  } | null>(null);
  const selected = exams.find((exam) => exam.code === selectedExam);
  const selectedLabel = useCatalogText(selected?.title ?? selectedExam);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const estimatedMenuHeight = Math.min(exams.length * 48 + 16, 280);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < estimatedMenuHeight + 12 && spaceAbove > spaceBelow;

    setMenuPosition(
      openUp
        ? {
            bottom: window.innerHeight - rect.top + 8,
            left: rect.left,
            width: rect.width,
            openUp: true,
          }
        : {
            top: rect.bottom + 8,
            left: rect.left,
            width: rect.width,
            openUp: false,
          },
    );
  }, [exams.length]);

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !(target as Element).closest?.('[data-exam-menu]')) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const handleReposition = () => updateMenuPosition();

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [open, updateMenuPosition]);

  const handleToggle = () => {
    if (!open) updateMenuPosition();
    setOpen((prev) => !prev);
  };

  const handleSelect = (code: string) => {
    onChange(code);
    setOpen(false);
  };

  const menu =
    mounted && menuPosition
      ? createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="exam-select-menu"
                data-exam-menu
                role="listbox"
                aria-label={label}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={menuPanelVariants}
                className="fixed z-[200] overflow-hidden rounded-2xl border border-[#EDE9FE] bg-white p-1.5 shadow-[0_16px_40px_rgba(124,58,237,0.16)] will-change-transform"
                style={{
                  left: menuPosition.left,
                  width: menuPosition.width,
                  top: menuPosition.top,
                  bottom: menuPosition.bottom,
                  transformOrigin: menuPosition.openUp ? 'bottom center' : 'top center',
                  maxHeight: 'min(17.5rem, calc(100vh - 1.5rem))',
                }}
              >
                <motion.div
                  variants={menuListVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="max-h-[min(16.5rem,calc(100vh-2rem))] space-y-0.5 overflow-y-auto overscroll-contain"
                >
                  {exams.map((exam) => (
                    <motion.div key={exam.id} variants={menuItemVariants}>
                      <ExamDropdownItem
                        exam={exam}
                        selected={exam.code === selectedExam}
                        onSelect={handleSelect}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className="relative z-20 min-w-0 flex-1">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-brand/80">
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={handleToggle}
        className={`flex h-12 w-full min-w-0 items-center justify-between gap-3 rounded-2xl border bg-white px-3.5 py-2.5 text-left shadow-[0_4px_14px_rgba(124,58,237,0.08)] transition-[border-color,box-shadow,ring-color] duration-200 ${
          open
            ? 'border-brand ring-2 ring-[#EDE9FE]'
            : 'border-[#DDD6FE] hover:border-brand/60 hover:shadow-[0_6px_18px_rgba(124,58,237,0.12)]'
        }`}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#F3E8FF] to-[#EDE9FE] text-brand">
            <GraduationCap className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <span className="truncate text-sm font-semibold text-slate-800 sm:text-[15px]">{selectedLabel}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-brand transition-transform duration-300 ease-out ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {menu}
    </div>
  );
}

export default function PracticePathBuilder({ subjectSlug, exams }: PracticePathBuilderProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const c = COPY[language];
  const selectableExams = exams.filter((exam) => exam.code.toUpperCase() !== 'ALL');
  const [selectedExam, setSelectedExam] = useState(selectableExams[0]?.code ?? 'BASIC');

  const handleBuildPath = () => {
    if (!selectedExam) return;
    router.push(`/subjects/${subjectSlug}?exam=${encodeURIComponent(selectedExam)}`);
  };

  return (
    <section className="relative z-10 mt-10 overflow-visible rounded-3xl border border-[#EDE9FE] bg-gradient-to-r from-[#FAF5FF] to-[#F5F3FF] px-5 py-6 sm:px-8 sm:py-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
        <div className="flex min-w-0 items-start gap-4 sm:items-center lg:flex-1">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm sm:h-16 sm:w-16 lg:h-[72px] lg:w-[72px]">
            <Compass className="h-7 w-7 text-brand sm:h-8 sm:w-8 lg:h-9 lg:w-9" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900 sm:text-lg lg:text-xl">{c.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{c.sub}</p>
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-3 min-[480px]:flex-row min-[480px]:items-end lg:w-auto lg:max-w-[min(100%,28rem)] lg:shrink-0">
          <ExamSelectDropdown
            exams={selectableExams}
            selectedExam={selectedExam}
            onChange={setSelectedExam}
            label={c.selectExam}
          />
          <button
            type="button"
            onClick={handleBuildPath}
            className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(124,58,237,0.28)] transition hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 min-[480px]:w-auto sm:whitespace-nowrap"
          >
            {c.build}
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
