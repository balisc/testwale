'use client';

import type { LangMode } from '@/app/demo/lib/bilingual';
import { uiLabel } from './uiLabel';

type Props = {
  mode: LangMode;
};

export function StoryTimelineVisual({ mode }: Props) {
  const alt = uiLabel(
    mode,
    'Institutional flow from British Parliament through East India House, Board of Control and Fort William',
    'ब्रिटिश संसद से ईस्ट इंडिया हाउस, बोर्ड ऑफ कंट्रोल और फोर्ट विलियम तक संस्थागत प्रवाह',
  );

  return (
    <figure className="cr-story-visual" aria-label={alt}>
      <svg viewBox="0 0 420 220" className="cr-story-visual-svg" role="img">
        <title>{alt}</title>
        <defs>
          <linearGradient id="cr-story-flow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C4B5FD" />
            <stop offset="100%" stopColor="#5B2BE0" />
          </linearGradient>
        </defs>

        <path
          d="M36 110 H384"
          stroke="url(#cr-story-flow)"
          strokeWidth="2"
          strokeDasharray="6 6"
          fill="none"
        />

        <g transform="translate(20, 72)">
          <rect width="56" height="44" rx="6" fill="#F5F3FF" stroke="#5B2BE0" strokeWidth="1.5" />
          <path d="M28 8 L48 22 H8 Z" fill="#EDE9FE" stroke="#5B2BE0" strokeWidth="1.2" />
          <text x="28" y="58" textAnchor="middle" className="cr-story-visual-label">
            {uiLabel(mode, 'Parliament', 'संसद')}
          </text>
        </g>

        <g transform="translate(108, 72)">
          <rect width="56" height="44" rx="6" fill="#F5F3FF" stroke="#5B2BE0" strokeWidth="1.5" />
          <rect x="12" y="18" width="10" height="18" fill="#DDD6FE" />
          <rect x="32" y="18" width="10" height="18" fill="#DDD6FE" />
          <text x="28" y="58" textAnchor="middle" className="cr-story-visual-label">
            {uiLabel(mode, 'E.I. House', 'ई.आई. हाउस')}
          </text>
        </g>

        <g transform="translate(196, 72)">
          <rect width="56" height="44" rx="6" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.5" />
          <rect x="18" y="16" width="20" height="24" rx="2" fill="#DBEAFE" />
          <text x="28" y="58" textAnchor="middle" className="cr-story-visual-label">
            {uiLabel(mode, 'Board', 'बोर्ड')}
          </text>
        </g>

        <g transform="translate(284, 72)">
          <rect width="56" height="44" rx="6" fill="#FAFAFA" stroke="#64748B" strokeWidth="1.5" />
          <rect x="14" y="18" width="8" height="16" fill="#E2E8F0" />
          <rect x="26" y="18" width="8" height="16" fill="#E2E8F0" />
          <rect x="38" y="18" width="8" height="16" fill="#E2E8F0" />
          <text x="28" y="58" textAnchor="middle" className="cr-story-visual-label">
            {uiLabel(mode, 'Directors', 'निदेशक')}
          </text>
        </g>

        <g transform="translate(344, 64)">
          <rect width="56" height="52" rx="4" fill="#FEF3C7" stroke="#92400E" strokeWidth="1.5" />
          <rect x="8" y="10" width="8" height="32" fill="#FDE68A" stroke="#92400E" />
          <rect x="40" y="10" width="8" height="32" fill="#FDE68A" stroke="#92400E" />
          <text x="28" y="66" textAnchor="middle" className="cr-story-visual-label">
            {uiLabel(mode, 'Fort W.', 'फोर्ट')}
          </text>
        </g>

        <g transform="translate(170, 138)">
          <path
            d="M8 4 H34 L42 12 V38 H8 Z"
            fill="#FFFBEB"
            stroke="#D97706"
            strokeWidth="1.2"
          />
          <path d="M34 4 V12 H42" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.2" />
          <circle cx="25" cy="30" r="4" fill="#DC2626" opacity="0.75" />
          <text x="25" y="52" textAnchor="middle" className="cr-story-visual-label">
            {uiLabel(mode, 'Charter', 'चार्टर')}
          </text>
        </g>
      </svg>
    </figure>
  );
}
