'use client';

import { ExternalLink, X } from 'lucide-react';
import ModalPortal from '@/components/ModalPortal';
import { useLanguage } from '@/lib/LanguageContext';
import { getConfidenceLabel, resolveRankingBadge } from '@/lib/polity/examRankingLabels';
import { useCatalogText } from '@/lib/useCatalogText';
import type { PolityExamRankingEvidence } from '@/types/polityExamRankingV2';

type RankingEvidenceDrawerProps = {
  open: boolean;
  onClose: () => void;
  evidence: PolityExamRankingEvidence;
  examTitle?: string;
};

const COPY = {
  en: {
    title: 'Ranking evidence',
    basis: 'Ranking basis',
    confidence: 'Confidence',
    source: 'Source',
    locator: 'Corpus window',
    clause: 'Syllabus clause',
    note: 'Basis note',
    proxyNote:
      'This order uses patterns from comparable examinations because a complete verified paper corpus for this exact exam is unavailable.',
    openSource: 'Open source',
    close: 'Close',
  },
  hi: {
    title: 'रैंकिंग प्रमाण',
    basis: 'रैंकिंग आधार',
    confidence: 'विश्वास',
    source: 'स्रोत',
    locator: 'कोर्पस विंडो',
    clause: 'पाठ्यक्रम खंड',
    note: 'आधार नोट',
    proxyNote:
      'इस क्रम में तुलनीय परीक्षाओं के पैटर्न का उपयोग किया गया है क्योंकि इसी परीक्षा के लिए पूर्ण सत्यापित प्रश्नपत्र कोर्पस उपलब्ध नहीं है।',
    openSource: 'स्रोत खोलें',
    close: 'बंद करें',
  },
};

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value?.trim()) return null;
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm leading-relaxed text-slate-800">{value}</dd>
    </div>
  );
}

export default function RankingEvidenceDrawer({
  open,
  onClose,
  evidence,
  examTitle,
}: RankingEvidenceDrawerProps) {
  const { language } = useLanguage();
  const c = COPY[language];
  const badge = resolveRankingBadge(evidence);
  const badgeLabel = useCatalogText(badge.label);
  const confidence = useCatalogText(getConfidenceLabel(evidence.pyq_confidence));

  const basis =
    evidence.ranking_basis?.replace(/_/g, ' ') ??
    evidence.effective_ranking_method?.replace(/_/g, ' ') ??
    null;

  return (
    <ModalPortal
      open={open}
      onClose={onClose}
      panelClassName="max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl"
      labelledBy="ranking-evidence-title"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="ranking-evidence-title" className="text-lg font-bold text-slate-900">
              {c.title}
            </h2>
            {examTitle && <p className="mt-1 text-sm text-slate-500">{examTitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label={c.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-[#EDE9FE] bg-[#FAF5FF] px-4 py-3">
          <p className="text-sm font-semibold text-brand">{badgeLabel}</p>
          {confidence && (
            <p className="mt-1 text-xs text-slate-600">
              {c.confidence}: {confidence}
            </p>
          )}
        </div>

        {badge.isProxy && (
          <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
            {c.proxyNote}
          </p>
        )}

        <dl className="mt-5 space-y-4">
          <DetailRow label={c.basis} value={basis} />
          <DetailRow label={c.clause} value={evidence.syllabus_clause} />
          <DetailRow label={c.source} value={evidence.source_title} />
          <DetailRow label={c.locator} value={evidence.source_locator} />
          <DetailRow label={c.note} value={evidence.basis_note} />
        </dl>

        {evidence.source_url && (
          <a
            href={evidence.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {c.openSource}
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </ModalPortal>
  );
}
