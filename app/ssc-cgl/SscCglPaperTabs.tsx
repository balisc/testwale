'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { KeyboardEvent } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { SSC_CGL_STAGES, type SscCglStageDefinition } from '@/lib/sscCglSyllabus';
import { pickCatalogText } from '@/lib/useCatalogText';

export default function SscCglPaperTabs({ stage }: { stage: SscCglStageDefinition }) {
  const router = useRouter();
  const { language } = useLanguage();
  const papers = SSC_CGL_STAGES.slice(1);

  const onKeyDown = (event: KeyboardEvent<HTMLAnchorElement>, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % papers.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + papers.length) % papers.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = papers.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const next = papers[nextIndex];
    event.currentTarget.closest('[role="tablist"]')?.querySelector<HTMLAnchorElement>(`#ssc-cgl-${next?.paper}-tab`)?.focus();
    if (next) router.push(next.href);
  };

  return (
    <nav aria-label={language === 'hi' ? 'टियर 2 पेपर चुनें' : 'Choose Tier 2 paper'} role="tablist" className="mt-5 grid w-full min-w-0 max-w-full grid-cols-3 gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 sm:gap-2">
      {papers.map((paper, index) => {
        const selected = paper.code === stage.code;
        return (
          <Link
            key={paper.code}
            id={`ssc-cgl-${paper.paper}-tab`}
            href={paper.href}
            role="tab"
            aria-selected={selected}
            aria-controls="ssc-cgl-subjects-panel"
            tabIndex={selected ? 0 : -1}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`inline-flex min-h-11 min-w-0 max-w-full items-center justify-center rounded-lg px-1.5 text-center text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 sm:px-4 sm:text-sm ${selected ? 'bg-violet-700 text-white shadow-sm' : 'text-slate-600 hover:bg-violet-50 hover:text-violet-700'}`}
          >
            {pickCatalogText(paper.shortLabel, language)}
          </Link>
        );
      })}
    </nav>
  );
}
