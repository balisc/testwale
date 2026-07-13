'use client';

/** Original line-art: many streams merge into one Constitution. */
export function HeroStreamsSketch({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 320"
      className={`h-auto w-full max-w-full ${className}`.trim()}
      role="img"
      aria-label="Four labelled ribbons — National Movement, Colonial Experience, Constituent Assembly and Foreign Traditions — merge into an open constitutional book marked Learn, Test, Adapt"
    >
      <defs>
        <pattern id="qw-paper" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.6" fill="#94A3B8" opacity="0.25" />
        </pattern>
        <linearGradient id="qw-ink" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>
      </defs>
      <rect width="420" height="320" rx="24" fill="#F8FAFC" />
      <rect width="420" height="320" rx="24" fill="url(#qw-paper)" />

      {/* Ribbons */}
      <path d="M36 72 C110 78, 150 120, 200 148" stroke="#7C3AED" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M36 140 C120 136, 160 150, 200 160" stroke="#0F766E" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M36 208 C118 190, 155 175, 200 168" stroke="#1D4ED8" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M36 268 C130 240, 165 200, 200 172" stroke="#6D28D9" strokeWidth="10" fill="none" strokeLinecap="round" />

      {/* Ribbon labels */}
      <g fontFamily="system-ui,sans-serif" fontSize="10" fontWeight="600" fill="#334155">
        <text x="40" y="58">National Movement</text>
        <text x="40" y="126">Colonial Experience</text>
        <text x="40" y="194">Constituent Assembly</text>
        <text x="40" y="254">Foreign Traditions</text>
      </g>

      {/* Open book */}
      <path
        d="M210 120 C250 105, 300 105, 340 120 L340 250 C300 235, 250 235, 210 250 Z"
        fill="#EEF2FF"
        stroke="#4338CA"
        strokeWidth="2.5"
      />
      <path
        d="M210 120 C170 105, 120 105, 80 120 L80 250 C120 235, 170 235, 210 250 Z"
        fill="#F5F3FF"
        stroke="#7C3AED"
        strokeWidth="2.5"
      />
      <line x1="210" y1="120" x2="210" y2="250" stroke="#1E293B" strokeWidth="2.5" />
      <path d="M100 150 H175 M100 175 H170 M100 200 H160" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" />
      <path d="M245 150 H320 M250 175 H320 M255 200 H315" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" />

      {/* Merge badge */}
      <rect x="248" y="268" width="138" height="28" rx="14" fill="url(#qw-ink)" />
      <text x="317" y="286" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="system-ui,sans-serif">
        Learn → Test → Adapt
      </text>
    </svg>
  );
}

export function FourStreamTiles({ className = '' }: { className?: string }) {
  const tiles = [
    { label: 'National Movement', color: '#7C3AED', soft: '#F5F3FF', path: 'M20 40 Q40 18 60 40 Q40 55 20 40' },
    { label: 'Colonial Experience', color: '#0F766E', soft: '#F0FDFA', path: 'M22 22 H58 V58 H22 Z M30 30 H50 M30 40 H50' },
    { label: 'Assembly Debate', color: '#1D4ED8', soft: '#EFF6FF', path: 'M24 50 L40 22 L56 50 Z M32 42 H48' },
    { label: 'Foreign Select', color: '#6D28D9', soft: '#F5F3FF', path: 'M40 22 L55 35 L48 55 H32 L25 35 Z' },
  ];
  return (
    <div
      className={`min-w-0 w-full ${className}`}
      role="img"
      aria-label="Four illustrated streams feeding a central Indian Adaptation node"
    >
      <div className="grid grid-cols-1 gap-2 min-[280px]:grid-cols-2 sm:grid-cols-4">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="flex min-w-0 flex-col items-center rounded-xl border p-1.5 text-center min-[360px]:p-2"
            style={{ borderColor: `${t.color}33`, background: t.soft }}
          >
            <svg viewBox="0 0 80 70" className="h-10 w-10 min-[360px]:h-14 min-[360px]:w-14" aria-hidden>
              <path d={t.path} fill="none" stroke={t.color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            <span className="max-w-full break-words text-[9px] font-semibold leading-tight text-slate-700 min-[360px]:text-[10px]">
              {t.label}
            </span>
          </div>
        ))}
      </div>
      <div className="relative mt-3 flex justify-center px-1">
        <div className="absolute -top-3 left-1/2 h-3 w-px -translate-x-1/2 bg-slate-300" aria-hidden />
        <div className="max-w-full rounded-full border-2 border-slate-800 bg-white px-2.5 py-1.5 text-center text-[10px] font-bold leading-tight text-slate-900 shadow-sm min-[360px]:px-4 min-[360px]:text-xs">
          Indian Adaptation
        </div>
      </div>
    </div>
  );
}
