'use client';

import { Info } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { RANKING_DISCLAIMER, resolveRankingBadge } from '@/lib/polity/examRankingLabels';
import { useCatalogText } from '@/lib/useCatalogText';
import type { PolityExamRankingEvidence } from '@/types/polityExamRankingV2';

type RankingEvidenceBadgeProps = {
  evidence: PolityExamRankingEvidence;
  onOpenDetails?: () => void;
};

export default function RankingEvidenceBadge({ evidence, onOpenDetails }: RankingEvidenceBadgeProps) {
  const { language } = useLanguage();
  const badge = resolveRankingBadge(evidence);
  const label = useCatalogText(badge.label);
  const confidence = useCatalogText(badge.confidence);
  const disclaimer = useCatalogText(RANKING_DISCLAIMER);

  const badgeStyles = {
    official_syllabus: 'border-[#DDD6FE] bg-[#F5F3FF] text-[#5B21B6]',
    direct_pyq: 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]',
    proxy_pyq: 'border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]',
    limited_pyq: 'border-slate-200 bg-slate-50 text-slate-700',
    generic: 'border-[#DDD6FE] bg-[#FAF5FF] text-brand',
  }[badge.kind];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${badgeStyles}`}
        >
          {label}
          {confidence && (
            <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
              {language === 'hi' ? 'विश्वास' : 'Confidence'}: {confidence}
            </span>
          )}
        </span>
        {onOpenDetails && (
          <button
            type="button"
            onClick={onOpenDetails}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-white hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label={language === 'hi' ? 'रैंकिंग विवरण देखें' : 'View ranking details'}
          >
            <Info className="h-3.5 w-3.5" />
            {language === 'hi' ? 'विवरण' : 'Details'}
          </button>
        )}
      </div>
      <p className="text-xs leading-relaxed text-slate-500">{disclaimer}</p>
    </div>
  );
}
