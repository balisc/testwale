'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import type { LocalizedText } from '@/types/polity';
import { pickCatalogText } from '@/lib/useCatalogText';
import SscCglProgressSteps from './SscCglProgressSteps';

type BreadcrumbItem = { label: LocalizedText | string; href?: string };

function displayText(value: LocalizedText | string, language: 'en' | 'hi') {
  return typeof value === 'string' ? value : pickCatalogText(value, language);
}

export default function SscCglPageHeader({
  activeStep,
  breadcrumbs,
  backHref,
  backLabel,
  context,
}: {
  activeStep: 1 | 2 | 3 | 4 | 5;
  breadcrumbs: BreadcrumbItem[];
  backHref?: string;
  backLabel?: LocalizedText | string;
  context?: LocalizedText | string;
}) {
  const { language } = useLanguage();
  const hasLead = Boolean((backHref && backLabel) || context);

  return (
    <header className="w-full min-w-0 max-w-full">
      <nav aria-label={language === 'hi' ? 'पाठ्यक्रम पथ' : 'Syllabus breadcrumb'} className="w-full min-w-0 max-w-full">
        <ol className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-slate-500 sm:text-sm">
          {breadcrumbs.map((item, index) => {
            const label = displayText(item.label, language);
            const current = index === breadcrumbs.length - 1;
            return (
              <li key={`${label}-${index}`} className="flex items-center gap-1.5">
                {index > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden="true" /> : null}
                {item.href && !current ? (
                  <Link href={item.href} className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-1 font-semibold hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2">
                    {index === 0 ? <Home className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                    {label}
                  </Link>
                ) : (
                  <span className={current ? 'max-w-56 truncate font-bold text-violet-700' : 'font-medium'} aria-current={current ? 'page' : undefined}>{label}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <div className={`mt-3 w-full min-w-0 max-w-full gap-4 rounded-xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5 ${hasLead ? 'grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-center' : 'flex justify-center'}`}>
        {hasLead ? <div className="min-w-0">
          {backHref && backLabel ? (
            <Link href={backHref} className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-bold text-violet-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {displayText(backLabel, language)}
            </Link>
          ) : null}
          {context ? <p className={`${backHref ? 'mt-1' : ''} break-words text-sm font-bold text-slate-700`}>{displayText(context, language)}</p> : null}
        </div> : null}
        <div className={hasLead ? 'min-w-0' : 'w-full min-w-0 max-w-2xl'}><SscCglProgressSteps active={activeStep} language={language} /></div>
      </div>
    </header>
  );
}
