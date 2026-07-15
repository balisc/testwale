'use client';

import { SOURCE_VISUAL, type SourceKey } from '../lib/revisionVisualTokens';

const PASSPORT_KEYS: SourceKey[] = ['britain', 'usa', 'ireland', 'france', 'canada'];

function Sketch({ source }: { source: SourceKey }) {
  const c = SOURCE_VISUAL[source].hex;
  switch (source) {
    case 'britain':
      return (
        <svg viewBox="0 0 120 88" className="h-full w-full" aria-hidden>
          <rect x="18" y="28" width="84" height="46" rx="4" fill="none" stroke={c} strokeWidth="2.5" />
          <path d="M28 28 V18 H92 V28" fill="none" stroke={c} strokeWidth="2.5" />
          <rect x="48" y="40" width="24" height="22" rx="2" fill={c} opacity="0.15" stroke={c} strokeWidth="2" />
          <path d="M30 74 Q60 62 90 74" fill="none" stroke={c} strokeWidth="2" strokeDasharray="3 3" />
          <circle cx="30" cy="74" r="3" fill={c} />
          <circle cx="90" cy="74" r="3" fill={c} />
        </svg>
      );
    case 'usa':
      return (
        <svg viewBox="0 0 120 88" className="h-full w-full" aria-hidden>
          <path d="M28 20 H70 L82 32 V72 H28 Z" fill="none" stroke={c} strokeWidth="2.5" />
          <path d="M70 20 V32 H82" fill="none" stroke={c} strokeWidth="2" />
          <path d="M95 28 L95 62 M86 36 H104 M86 54 H104" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="95" cy="72" r="10" fill="none" stroke={c} strokeWidth="2.2" />
          <path d="M95 66 V72 L99 75" fill="none" stroke={c} strokeWidth="2" />
        </svg>
      );
    case 'ireland':
      return (
        <svg viewBox="0 0 120 88" className="h-full w-full" aria-hidden>
          <rect x="48" y="18" width="10" height="58" rx="2" fill={c} opacity="0.2" stroke={c} strokeWidth="2" />
          <path d="M58 28 H96 L86 42 L96 56 H58 Z" fill={c} opacity="0.12" stroke={c} strokeWidth="2.5" />
          <text x="68" y="46" fontSize="9" fontWeight="700" fill={c} fontFamily="system-ui,sans-serif">
            DPSP
          </text>
        </svg>
      );
    case 'france':
      return (
        <svg viewBox="0 0 120 88" className="h-full w-full" aria-hidden>
          <path d="M60 18 L98 72 H22 Z" fill="none" stroke={c} strokeWidth="2.5" />
          <circle cx="60" cy="18" r="5" fill={c} />
          <circle cx="98" cy="72" r="5" fill={c} />
          <circle cx="22" cy="72" r="5" fill={c} />
          <text x="54" y="40" fontSize="9" fontWeight="700" fill={c} fontFamily="system-ui,sans-serif">
            L
          </text>
          <text x="28" y="68" fontSize="9" fontWeight="700" fill={c} fontFamily="system-ui,sans-serif">
            E
          </text>
          <text x="84" y="68" fontSize="9" fontWeight="700" fill={c} fontFamily="system-ui,sans-serif">
            F
          </text>
        </svg>
      );
    case 'canada':
      return (
        <svg viewBox="0 0 120 88" className="h-full w-full" aria-hidden>
          <circle cx="58" cy="44" r="22" fill={c} opacity="0.12" stroke={c} strokeWidth="2.5" />
          <text x="42" y="48" fontSize="9" fontWeight="700" fill={c} fontFamily="system-ui,sans-serif">
            Centre
          </text>
          <circle cx="96" cy="28" r="12" fill="none" stroke={c} strokeWidth="2" strokeDasharray="3 2" />
          <text x="86" y="31" fontSize="7" fontWeight="600" fill={c} fontFamily="system-ui,sans-serif">
            residual
          </text>
          <line x1="78" y1="36" x2="86" y2="32" stroke={c} strokeWidth="1.5" />
        </svg>
      );
    default:
      return null;
  }
}

export function PassportCardArt({
  source,
  title,
  memory,
  selected,
  onSelect,
}: {
  source: SourceKey;
  title: string;
  memory: string;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const v = SOURCE_VISUAL[source];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group flex h-full w-full flex-col overflow-hidden rounded-2xl border text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        selected ? 'shadow-md' : 'hover:shadow-sm'
      }`}
      style={{
        borderColor: selected ? v.hex : v.border,
        background: v.soft,
        boxShadow: selected ? `0 0 0 2px ${v.hex}` : undefined,
      }}
    >
      <div className="flex items-center justify-between px-3 pt-3">
        <span className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: v.hex }}>
          {v.motif}
        </span>
        <span className="text-[10px] font-semibold text-slate-500">{selected ? 'Open' : 'Open detail'}</span>
      </div>
      <div className="aspect-[4/3] w-full px-2">
        <Sketch source={source} />
      </div>
      <div className="border-t px-2 py-2 min-[360px]:px-3 min-[360px]:py-2.5" style={{ borderColor: v.border }}>
        <p className="break-words text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-0.5 line-clamp-3 break-words text-[11px] leading-snug text-slate-600 min-[360px]:line-clamp-2">
          {memory}
        </p>
      </div>
    </button>
  );
}

export { PASSPORT_KEYS };
