'use client';

export default function AboutHeroIllustration() {
  return (
    <div
      className="relative mx-auto flex w-full max-w-[440px] items-center justify-center lg:mx-0 lg:max-w-none lg:justify-end"
      aria-hidden
    >
      <svg
        viewBox="0 0 440 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-auto w-full max-w-[400px] sm:max-w-[440px]"
        role="img"
        aria-label="Education illustration with books and graduation cap"
      >
        <defs>
          <linearGradient id="penBarrel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="45%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#5B21B6" />
          </linearGradient>
          <linearGradient id="penMetal" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="50%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
          <linearGradient id="pageEdge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
          <linearGradient id="spineShade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4C1D95" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>
          <linearGradient id="coverFace1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient id="coverFace2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>
          <linearGradient id="coverFace3" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#5B21B6" />
          </linearGradient>
          <linearGradient id="capGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#9333EA" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>
          <linearGradient id="targetGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#C4B5FD" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#7C3AED" floodOpacity="0.18" />
          </filter>
          <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#64748B" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* ambient blobs */}
        <ellipse cx="88" cy="248" rx="56" ry="18" fill="#EDE9FE" opacity="0.7" />
        <ellipse cx="330" cy="260" rx="72" ry="20" fill="#F3E8FF" opacity="0.9" />
        <circle cx="360" cy="72" r="34" fill="#F3E8FF" />
        <circle cx="72" cy="88" r="22" fill="#EDE9FE" opacity="0.8" />

        {/* MCQ floating card */}
        <g filter="url(#cardShadow)">
          <rect x="34" y="42" width="118" height="92" rx="16" fill="#FFFFFF" />
          <rect x="34" y="42" width="118" height="92" rx="16" stroke="#E9D5FF" strokeWidth="1.5" />
          <text x="52" y="68" fill="#7C3AED" fontSize="15" fontWeight="700" fontFamily="system-ui, sans-serif">
            MCQ
          </text>
          <rect x="52" y="78" width="14" height="14" rx="4" fill="#7C3AED" />
          <path d="M55 86 L58 89 L63 82" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="72" y="81" width="58" height="6" rx="3" fill="#E9D5FF" />
          <rect x="52" y="98" width="14" height="14" rx="4" fill="#7C3AED" />
          <path d="M55 106 L58 109 L63 102" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="72" y="101" width="48" height="6" rx="3" fill="#E9D5FF" />
          <rect x="52" y="118" width="14" height="14" rx="4" stroke="#C4B5FD" strokeWidth="1.5" fill="#FFFFFF" />
          <rect x="72" y="121" width="52" height="6" rx="3" fill="#F3E8FF" />
        </g>

        {/* target badge */}
        <g filter="url(#cardShadow)">
          <circle cx="352" cy="88" r="42" fill="#FFFFFF" />
          <circle cx="352" cy="88" r="42" stroke="#E9D5FF" strokeWidth="1.5" />
          <circle cx="352" cy="88" r="28" fill="url(#targetGrad)" opacity="0.35" />
          <circle cx="352" cy="88" r="20" stroke="#7C3AED" strokeWidth="5" fill="#FFFFFF" />
          <circle cx="352" cy="88" r="10" fill="#7C3AED" />
          <path
            d="M318 62 L346 86 L338 94 L310 70 Z"
            fill="#6D28D9"
            opacity="0.85"
          />
          <path d="M318 62 L346 86" stroke="#5B21B6" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* realistic pen */}
        <g transform="translate(108 252) rotate(-18)" filter="url(#cardShadow)">
          <ellipse cx="8" cy="18" rx="7" ry="3" fill="#7C3AED" opacity="0.12" />
          {/* barrel */}
          <rect x="14" y="10" width="88" height="16" rx="8" fill="url(#penBarrel)" />
          <rect x="22" y="11.5" width="36" height="3" rx="1.5" fill="#FFFFFF" opacity="0.22" />
          {/* grip rings */}
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={58 + i * 5} y="12" width="2" height="12" rx="1" fill="#5B21B6" opacity="0.35" />
          ))}
          {/* clip */}
          <path
            d="M34 10 C34 6 40 5 42 8 L42 24 C42 27 38 27 36 24 L36 12 C36 10 34 10 34 10 Z"
            fill="#6D28D9"
            stroke="#5B21B6"
            strokeWidth="0.8"
          />
          {/* cap end */}
          <rect x="14" y="10" width="14" height="16" rx="7" fill="#6D28D9" />
          <circle cx="21" cy="18" r="3" fill="#C4B5FD" opacity="0.55" />
          {/* tip cone + nib */}
          <path d="M102 10 L118 18 L102 26 Z" fill="url(#penMetal)" />
          <path d="M112 16 L118 18 L112 20 Z" fill="#475569" />
          <circle cx="115" cy="18" r="1.2" fill="#1E293B" />
        </g>

        {/* realistic book stack — isometric hardcovers */}
        <g filter="url(#softShadow)">
          {/* bottom book */}
          <path d="M118 228 L302 228 L318 244 L134 244 Z" fill="url(#coverFace3)" />
          <path d="M118 228 L134 244 L134 208 L118 192 Z" fill="url(#spineShade)" />
          <path d="M118 192 L302 192 L318 208 L134 208 Z" fill="#8B5CF6" opacity="0.55" />
          <path d="M302 192 L318 208 L318 244 L302 228 Z" fill="url(#pageEdge)" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <line
              key={`b1-${i}`}
              x1="306"
              y1={198 + i * 6.5}
              x2="314"
              y2={204 + i * 6.5}
              stroke="#CBD5E1"
              strokeWidth="0.8"
            />
          ))}
          <rect x="148" y="206" width="72" height="3" rx="1.5" fill="#FFFFFF" opacity="0.16" />
          <rect x="156" y="216" width="48" height="2" rx="1" fill="#C4B5FD" opacity="0.35" />

          {/* middle book — slightly forward */}
          <path d="M108 200 L296 200 L312 216 L124 216 Z" fill="url(#coverFace2)" />
          <path d="M108 200 L124 216 L124 180 L108 164 Z" fill="url(#spineShade)" />
          <path d="M108 164 L296 164 L312 180 L124 180 Z" fill="#9F7AEA" opacity="0.5" />
          <path d="M296 164 L312 180 L312 216 L296 200 Z" fill="url(#pageEdge)" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line
              key={`b2-${i}`}
              x1="300"
              y1={170 + i * 7}
              x2="308"
              y2={176 + i * 7}
              stroke="#CBD5E1"
              strokeWidth="0.8"
            />
          ))}
          <path
            d="M138 178 L188 178 L188 194 L138 194 Z"
            fill="#FFFFFF"
            opacity="0.12"
            stroke="#C4B5FD"
            strokeWidth="0.8"
            strokeOpacity="0.4"
          />

          {/* top book */}
          <path d="M98 172 L288 172 L304 188 L114 188 Z" fill="url(#coverFace1)" />
          <path d="M98 172 L114 188 L114 152 L98 136 Z" fill="url(#spineShade)" />
          <path d="M98 136 L288 136 L304 152 L114 152 Z" fill="#C4B5FD" opacity="0.45" />
          <path d="M288 136 L304 152 L304 188 L288 172 Z" fill="url(#pageEdge)" />
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={`b3-${i}`}
              x1="292"
              y1={142 + i * 9}
              x2="300"
              y2={148 + i * 9}
              stroke="#CBD5E1"
              strokeWidth="0.8"
            />
          ))}
          <rect x="132" y="148" width="56" height="2" rx="1" fill="#FFFFFF" opacity="0.2" />
          <rect x="140" y="154" width="40" height="2" rx="1" fill="#EDE9FE" opacity="0.5" />

          {/* subtle contact shadow between books */}
          <path d="M124 188 L312 188 L318 194 L130 194 Z" fill="#4C1D95" opacity="0.08" />
          <path d="M114 152 L304 152 L310 158 L120 158 Z" fill="#4C1D95" opacity="0.08" />
        </g>

        {/* graduation cap */}
        <g filter="url(#softShadow)">
          <path d="M216 126 L112 166 L216 146 L320 166 Z" fill="url(#capGrad)" />
          <path d="M216 126 L320 166 L320 176 L216 156 Z" fill="#5B21B6" opacity="0.55" />
          <path d="M216 126 L112 166 L112 176 L216 156 Z" fill="#6D28D9" opacity="0.75" />
          <rect x="208" y="140" width="16" height="26" rx="3" fill="#4C1D95" />
          <circle cx="224" cy="166" r="5" fill="#C4B5FD" />
          <path
            d="M224 166 C236 176 248 184 262 190"
            stroke="#4C1D95"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="262" cy="190" r="4" fill="#7C3AED" />
        </g>

        {/* sparkle accents */}
        <path d="M382 188 L386 196 L394 198 L386 200 L382 208 L378 200 L370 198 L378 196 Z" fill="#C4B5FD" />
        <path d="M98 196 L100 200 L104 201 L100 202 L98 206 L96 202 L92 201 L96 200 Z" fill="#DDD6FE" />
      </svg>
    </div>
  );
}
