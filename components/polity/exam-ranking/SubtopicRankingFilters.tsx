'use client';

import { Search } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { getDepthLabel } from '@/lib/polity/examRankingLabels';
import { pickCatalogText } from '@/lib/useCatalogText';
import type { PolityProgressState } from '@/types/polityExamRankingV2';

export type SubtopicFilterState = {
  query: string;
  importance: 'all' | 'high' | 'medium' | 'low';
  recommendedOnly: boolean;
  progress: 'all' | PolityProgressState;
  depth: 'all' | 'foundation' | 'standard' | 'advanced' | 'school_civics';
};

type SubtopicRankingFiltersProps = {
  value: SubtopicFilterState;
  onChange: (next: SubtopicFilterState) => void;
};

const COPY = {
  en: {
    search: 'Search subtopics in English or Hindi…',
    importance: 'Importance',
    progress: 'Progress',
    depth: 'Depth',
    recommended: 'Recommended only',
    all: 'All',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    notStarted: 'Not started',
    inProgress: 'In progress',
    completed: 'Completed',
  },
  hi: {
    search: 'हिंदी या अंग्रेज़ी में उप-विषय खोजें…',
    importance: 'महत्व',
    progress: 'प्रगति',
    depth: 'गहराई',
    recommended: 'केवल अनुशंसित',
    all: 'सभी',
    high: 'उच्च',
    medium: 'मध्यम',
    low: 'कम',
    notStarted: 'शुरू नहीं',
    inProgress: 'प्रगति में',
    completed: 'पूर्ण',
  },
};

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
        active
          ? 'bg-brand text-white shadow-sm'
          : 'border border-slate-200 bg-white text-slate-600 hover:border-[#DDD6FE] hover:text-brand'
      }`}
    >
      {label}
    </button>
  );
}

export default function SubtopicRankingFilters({ value, onChange }: SubtopicRankingFiltersProps) {
  const { language } = useLanguage();
  const c = COPY[language];

  const depthOptions = [
    { id: 'all' as const, label: c.all },
    { id: 'foundation' as const, label: pickCatalogText(getDepthLabel('foundation'), language) },
    { id: 'standard' as const, label: pickCatalogText(getDepthLabel('standard'), language) },
    { id: 'advanced' as const, label: pickCatalogText(getDepthLabel('advanced'), language) },
    { id: 'school_civics' as const, label: pickCatalogText(getDepthLabel('school_civics'), language) },
  ];

  return (
    <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={value.query}
          onChange={(event) => onChange({ ...value, query: event.target.value })}
          placeholder={c.search}
          className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-[#EDE9FE]"
        />
      </label>

      <div className="space-y-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{c.importance}</p>
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(['all', 'high', 'medium', 'low'] as const).map((key) => (
              <FilterChip
                key={key}
                active={value.importance === key}
                label={c[key]}
                onClick={() => onChange({ ...value, importance: key })}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{c.progress}</p>
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(
              [
                ['all', c.all],
                ['not_started', c.notStarted],
                ['in_progress', c.inProgress],
                ['completed', c.completed],
              ] as const
            ).map(([key, label]) => (
              <FilterChip
                key={key}
                active={value.progress === key}
                label={label}
                onClick={() => onChange({ ...value, progress: key })}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{c.depth}</p>
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {depthOptions.map((option) => (
              <FilterChip
                key={option.id}
                active={value.depth === option.id}
                label={option.label}
                onClick={() => onChange({ ...value, depth: option.id })}
              />
            ))}
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={value.recommendedOnly}
            onChange={(event) => onChange({ ...value, recommendedOnly: event.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
          />
          {c.recommended}
        </label>
      </div>
    </div>
  );
}
