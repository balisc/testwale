'use client';

import { SOURCE_VISUAL, type SourceKey } from '../lib/revisionVisualTokens';
import type { LangMode } from '../lib/bilingual';
import { BiText, pick } from '../lib/bilingual';

type Panel = {
  id: string;
  left: SourceKey;
  right: SourceKey;
  think: { en: string; hi: string };
  trap: { en: string; hi: string };
  cue: { en: string; hi: string };
};

const PANELS: Panel[] = [
  {
    id: 'br-us',
    left: 'britain',
    right: 'usa',
    think: {
      en: 'Parliamentary government & Rule of law → Britain',
      hi: 'संसदीय शासन व Rule of law → ब्रिटेन',
    },
    trap: {
      en: 'Do not put Judicial review with Britain',
      hi: 'Judicial review को ब्रिटेन से न जोड़ें',
    },
    cue: {
      en: 'Chamber ≠ Review lens',
      hi: 'Chamber ≠ Review lens',
    },
  },
  {
    id: 'us-ie',
    left: 'usa',
    right: 'ireland',
    think: {
      en: 'Fundamental Rights / Judicial independence → United States',
      hi: 'मौलिक अधिकार / न्यायिक स्वतंत्रता → संयुक्त राज्य',
    },
    trap: {
      en: 'Directive Principles → Ireland, not USA',
      hi: 'नीति निदेशक तत्व → आयरलैंड, USA नहीं',
    },
    cue: {
      en: 'Rights scroll ≠ Direction sign',
      hi: 'Rights scroll ≠ Direction sign',
    },
  },
  {
    id: 'br-ca',
    left: 'britain',
    right: 'canada',
    think: {
      en: 'Parliament & Speaker → Britain',
      hi: 'Parliament व Speaker → ब्रिटेन',
    },
    trap: {
      en: 'Strong Centre + residuary → Canada',
      hi: 'मजबूत केंद्र + अवशिष्ट → कनाडा',
    },
    cue: {
      en: 'Chamber ≠ Centre orbit',
      hi: 'Chamber ≠ Centre orbit',
    },
  },
  {
    id: 'fr-ca',
    left: 'france',
    right: 'canada',
    think: {
      en: 'Liberty–Equality–Fraternity → France (Preamble)',
      hi: 'स्वतंत्रता–समानता–बंधुता → फ्रांस (प्रस्तावना)',
    },
    trap: {
      en: 'Residuary / quasi-federal → Canada',
      hi: 'अवशिष्ट / अर्ध-संघ → कनाडा',
    },
    cue: {
      en: 'LEF triangle ≠ Centre orbit',
      hi: 'LEF triangle ≠ Centre orbit',
    },
  },
];

function Side({ source, mode }: { source: SourceKey; mode: LangMode }) {
  const v = SOURCE_VISUAL[source];
  return (
    <div
      className="min-w-0 rounded-xl border px-2 py-1.5 min-[360px]:px-3 min-[360px]:py-2"
      style={{ borderColor: v.border, background: v.soft }}
    >
      <span className="text-[9px] font-bold uppercase tracking-wide min-[360px]:text-[10px]" style={{ color: v.hex }}>
        {v.motif}
      </span>
      <p className="break-words text-xs font-semibold text-slate-900 min-[360px]:text-sm">
        {pick(v.label, mode === 'both' ? 'en' : mode)}
      </p>
    </div>
  );
}

export function ConfusionClinic({ mode }: { mode: LangMode }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {PANELS.map((panel) => (
        <article
          key={panel.id}
          className="min-w-0 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm min-[360px]:p-4"
          aria-label={`${SOURCE_VISUAL[panel.left].label.en} versus ${SOURCE_VISUAL[panel.right].label.en}`}
        >
          <div className="grid grid-cols-1 items-stretch gap-1.5 min-[320px]:grid-cols-[1fr_auto_1fr] min-[320px]:items-center min-[320px]:gap-2">
            <Side source={panel.left} mode={mode} />
            <span className="text-center text-[10px] font-bold text-slate-400 min-[320px]:text-xs" aria-hidden>
              vs
            </span>
            <Side source={panel.right} mode={mode} />
          </div>
          <dl className="mt-3 space-y-2 text-[11px] min-[360px]:text-xs">
            <div className="rounded-lg bg-emerald-50 px-2 py-2 text-emerald-950 min-[360px]:px-2.5">
              <dt className="font-bold">Think</dt>
              <dd>
                <BiText text={panel.think} mode={mode} as="span" className="block" />
              </dd>
            </div>
            <div className="rounded-lg bg-rose-50 px-2 py-2 text-rose-950 min-[360px]:px-2.5">
              <dt className="font-bold">Do not confuse</dt>
              <dd>
                <BiText text={panel.trap} mode={mode} as="span" className="block" />
              </dd>
            </div>
            <div className="rounded-lg border border-dashed border-slate-200 px-2 py-2 text-slate-700 min-[360px]:px-2.5">
              <dt className="font-bold text-slate-500">Visual cue</dt>
              <dd>
                <BiText text={panel.cue} mode={mode} as="span" className="block font-medium" />
              </dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}
