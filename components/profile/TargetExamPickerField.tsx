'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { normalizeExamCode, sortExamsForDisplay } from '@/lib/polity';
import { JURISDICTION_GROUP_LABELS } from '@/lib/polity/examRankingLabels';
import { pickCatalogText } from '@/lib/useCatalogText';
import type { Exam } from '@/types/polity';
import type { PolityRankedExamOption } from '@/types/polityExamRankingV2';

function rankedExamLabel(exam: PolityRankedExamOption, language: 'en' | 'hi'): string {
  return pickCatalogText(exam.title, language) || exam.exam_code;
}

function catalogExamLabel(exam: Exam, language: 'en' | 'hi'): string {
  return pickCatalogText(exam.title, language) || exam.code;
}

function findRankedForStored(exams: PolityRankedExamOption[], stored: string): PolityRankedExamOption | null {
  const trimmed = stored.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  const byCode = exams.find((exam) => exam.exam_code.toLowerCase() === lower);
  if (byCode) return byCode;
  return (
    exams.find((exam) => {
      const en = pickCatalogText(exam.title, 'en').toLowerCase();
      const hi = pickCatalogText(exam.title, 'hi').toLowerCase();
      return en === lower || hi === lower;
    }) ?? null
  );
}

function findCatalogForStored(exams: Exam[], stored: string): Exam | null {
  const trimmed = stored.trim().toLowerCase();
  if (!trimmed) return null;
  return (
    exams.find((exam) => {
      const en = pickCatalogText(exam.title, 'en').toLowerCase();
      const hi = pickCatalogText(exam.title, 'hi').toLowerCase();
      return en === trimmed || hi === trimmed || exam.code.toLowerCase() === trimmed;
    }) ?? null
  );
}

function formatRankedMeta(exam: PolityRankedExamOption, language: 'en' | 'hi'): string {
  return [
    exam.jurisdiction_name,
    exam.stage,
    exam.paper ? `${language === 'hi' ? 'पेपर' : 'Paper'} ${exam.paper}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

type TargetExamPickerFieldProps = {
  value: string;
  onChange: (value: string) => void;
  language: 'en' | 'hi';
  chooseExamLabel: string;
  otherExamLabel: string;
  otherPlaceholder: string;
  loadErrorLabel: string;
  searchPlaceholder?: string;
  noResultsLabel?: string;
  listClassName?: string;
};

export default function TargetExamPickerField({
  value,
  onChange,
  language,
  chooseExamLabel,
  otherExamLabel,
  otherPlaceholder,
  loadErrorLabel,
  searchPlaceholder,
  noResultsLabel,
  listClassName = 'max-h-64 sm:max-h-72',
}: TargetExamPickerFieldProps) {
  const [rankedExams, setRankedExams] = useState<PolityRankedExamOption[]>([]);
  const [catalogExams, setCatalogExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [isOther, setIsOther] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [otherName, setOtherName] = useState('');

  const sortedCatalog = useMemo(() => sortExamsForDisplay(catalogExams), [catalogExams]);
  const useRanked = rankedExams.length > 0;
  const examCount = useRanked ? rankedExams.length : sortedCatalog.length;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);

    void Promise.all([
      fetch('/api/catalog/ranked-exams').then((res) => (res.ok ? res.json() : { exams: [] })),
      fetch('/api/catalog/exams').then((res) => (res.ok ? res.json() : { exams: [] })),
    ])
      .then(([rankedJson, catalogJson]) => {
        if (cancelled) return;
        setRankedExams(Array.isArray(rankedJson.exams) ? rankedJson.exams : []);
        setCatalogExams(Array.isArray(catalogJson.exams) ? catalogJson.exams : []);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const rankedMatch = findRankedForStored(rankedExams, value);
    if (rankedMatch) {
      setIsOther(false);
      setSelectedCode(rankedMatch.exam_code);
      setOtherName('');
      return;
    }

    const catalogMatch = findCatalogForStored(sortedCatalog, value);
    if (catalogMatch) {
      setIsOther(false);
      setSelectedCode(catalogMatch.code);
      setOtherName('');
      return;
    }

    if (value.trim()) {
      setIsOther(true);
      setSelectedCode(null);
      setOtherName(value.trim());
      return;
    }

    setIsOther(false);
    setSelectedCode(null);
    setOtherName('');
  }, [loading, rankedExams, sortedCatalog, value]);

  const filteredRanked = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rankedExams;
    return rankedExams.filter((exam) => {
      const haystack = [
        pickCatalogText(exam.title, 'en').toLowerCase(),
        pickCatalogText(exam.title, 'hi').toLowerCase(),
        exam.exam_code.toLowerCase(),
        exam.jurisdiction_name?.toLowerCase() ?? '',
        exam.stage?.toLowerCase() ?? '',
        exam.paper?.toLowerCase() ?? '',
      ];
      return haystack.some((part) => part.includes(q));
    });
  }, [rankedExams, query]);

  const filteredCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortedCatalog;
    return sortedCatalog.filter((exam) => {
      const titleEn = pickCatalogText(exam.title, 'en').toLowerCase();
      const titleHi = pickCatalogText(exam.title, 'hi').toLowerCase();
      return titleEn.includes(q) || titleHi.includes(q) || exam.code.toLowerCase().includes(q);
    });
  }, [sortedCatalog, query]);

  const groupedRanked = useMemo(() => {
    const groups: Record<'national' | 'state' | 'union_territory', PolityRankedExamOption[]> = {
      national: [],
      state: [],
      union_territory: [],
    };
    for (const exam of filteredRanked) {
      groups[exam.jurisdictionGroup].push(exam);
    }
    return groups;
  }, [filteredRanked]);

  const selectRanked = (exam: PolityRankedExamOption) => {
    setIsOther(false);
    setSelectedCode(exam.exam_code);
    setOtherName('');
    onChange(rankedExamLabel(exam, language));
  };

  const selectCatalog = (exam: Exam) => {
    setIsOther(false);
    setSelectedCode(exam.code);
    setOtherName('');
    onChange(catalogExamLabel(exam, language));
  };

  const selectOther = () => {
    setIsOther(true);
    setSelectedCode(null);
    onChange(otherName.trim());
  };

  const searchCopy =
    searchPlaceholder ??
    (language === 'hi' ? 'परीक्षा खोजें…' : 'Search exams by name, state or stage…');
  const noResultsCopy =
    noResultsLabel ?? (language === 'hi' ? 'कोई परीक्षा नहीं मिली।' : 'No exams match your search.');

  if (loading) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 min-[360px]:text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-brand" aria-hidden />
        {chooseExamLabel}
      </div>
    );
  }

  if (loadError || examCount === 0) {
    return (
      <div className="mt-2 space-y-2">
        <p className="text-xs text-red-600 min-[360px]:text-sm">{loadErrorLabel}</p>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={otherPlaceholder}
          maxLength={120}
          className="w-full min-w-0 rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-brand min-[360px]:rounded-xl min-[360px]:px-3 min-[360px]:text-sm"
        />
      </div>
    );
  }

  const renderRankedButton = (exam: PolityRankedExamOption) => {
    const label = rankedExamLabel(exam, language);
    const meta = formatRankedMeta(exam, language);
    const active = !isOther && selectedCode === exam.exam_code;
    return (
      <button
        key={exam.exam_code}
        type="button"
        onClick={() => selectRanked(exam)}
        className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition min-[360px]:text-sm ${
          active
            ? 'border-brand bg-[#F5F3FF] font-medium text-brand'
            : 'border-transparent hover:bg-slate-50'
        }`}
      >
        <span className="block font-medium">{label}</span>
        {meta ? <span className="mt-0.5 block text-[11px] text-slate-500">{meta}</span> : null}
      </button>
    );
  };

  const renderCatalogButton = (exam: Exam) => {
    const label = catalogExamLabel(exam, language);
    const active = !isOther && selectedCode === exam.code;
    return (
      <button
        key={exam.id}
        type="button"
        onClick={() => selectCatalog(exam)}
        className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition min-[360px]:text-sm ${
          active
            ? 'border-brand bg-[#F5F3FF] font-medium text-brand'
            : 'border-transparent hover:bg-slate-50'
        }`}
      >
        {label}
      </button>
    );
  };

  const totalRankedMatches =
    groupedRanked.national.length + groupedRanked.state.length + groupedRanked.union_territory.length;

  return (
    <div className="mt-2 space-y-2">
      <p className="text-xs text-slate-500">
        {chooseExamLabel}
        <span className="ml-1 text-slate-400">({examCount})</span>
      </p>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchCopy}
          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-brand min-[360px]:rounded-xl min-[360px]:text-sm"
        />
      </div>
      <div className={`space-y-1.5 overflow-y-auto rounded-xl border border-[#E2E8F0] p-2 ${listClassName}`}>
        {useRanked ? (
          query.trim() ? (
            filteredRanked.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-slate-500">{noResultsCopy}</p>
            ) : (
              filteredRanked.map(renderRankedButton)
            )
          ) : totalRankedMatches === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-slate-500">{noResultsCopy}</p>
          ) : (
            (['national', 'state', 'union_territory'] as const).map((groupKey) => {
              const items = groupedRanked[groupKey];
              if (items.length === 0) return null;
              const groupLabel = pickCatalogText(JURISDICTION_GROUP_LABELS[groupKey], language);
              return (
                <div key={groupKey} className="mb-2 last:mb-0">
                  <p className="sticky top-0 z-10 bg-white px-1 py-1 text-[10px] font-bold uppercase tracking-wide text-brand">
                    {groupLabel}
                  </p>
                  <div className="space-y-1">{items.map(renderRankedButton)}</div>
                </div>
              );
            })
          )
        ) : filteredCatalog.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-slate-500">{noResultsCopy}</p>
        ) : (
          filteredCatalog.map(renderCatalogButton)
        )}
      </div>
      <button
        type="button"
        onClick={selectOther}
        className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition min-[360px]:text-sm ${
          isOther
            ? 'border-brand bg-[#F5F3FF] font-medium text-brand'
            : 'border-[#E2E8F0] hover:bg-slate-50'
        }`}
      >
        {otherExamLabel}
      </button>
      {isOther ? (
        <input
          value={otherName}
          onChange={(e) => {
            const next = e.target.value;
            setOtherName(next);
            onChange(next.trim());
          }}
          placeholder={otherPlaceholder}
          maxLength={120}
          className="w-full min-w-0 rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-brand min-[360px]:rounded-xl min-[360px]:px-3 min-[360px]:text-sm"
        />
      ) : null}
    </div>
  );
}
