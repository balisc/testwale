'use client';

import type { LangMode } from '@/app/demo/lib/bilingual';
import { uiLabel } from '../uiLabel';

type Props = {
  mode: LangMode;
};

export function SettlementIllustration({ mode }: Props) {
  const alt = uiLabel(
    mode,
    'Supreme Court at Calcutta, Company revenue administration and the 1781 amending Act clarifying jurisdiction boundaries',
    'कलकत्ता का सुप्रीम कोर्ट, कंपनी का राजस्व प्रशासन और 1781 का संशोधन अधिनियम अधिकारिता की सीमाएँ स्पष्ट करता है',
  );

  return (
    <figure className="cr-act1781-illustration">
      <svg viewBox="0 0 520 280" className="cr-act1781-illustration-svg" role="img" aria-labelledby="cr-act1781-ill-title">
        <title id="cr-act1781-ill-title">{alt}</title>
        <rect width="520" height="280" fill="#F8FAFC" rx="12" />

        <g transform="translate(24, 24)">
          <rect width="140" height="100" rx="8" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.5" />
          <rect x="52" y="16" width="36" height="28" fill="#DBEAFE" stroke="#2563EB" />
          <rect x="20" y="52" width="100" height="8" fill="#BFDBFE" />
          <rect x="20" y="66" width="80" height="8" fill="#BFDBFE" />
          <text x="70" y="92" textAnchor="middle" className="cr-act1781-ill-label">
            {uiLabel(mode, 'Supreme Court', 'सुप्रीम कोर्ट')}
          </text>
        </g>

        <g transform="translate(190, 36)">
          <rect width="120" height="88" rx="6" fill="#FFFBEB" stroke="#D97706" strokeWidth="1.5" />
          <rect x="16" y="20" width="88" height="12" fill="#FDE68A" />
          <rect x="16" y="38" width="72" height="8" fill="#FEF3C7" />
          <rect x="16" y="52" width="64" height="8" fill="#FEF3C7" />
          <text x="60" y="78" textAnchor="middle" className="cr-act1781-ill-label">
            {uiLabel(mode, 'Revenue office', 'राजस्व कार्यालय')}
          </text>
        </g>

        <path d="M330 80 H420" stroke="#94A3B8" strokeWidth="2" strokeDasharray="5 4" />
        <text x="375" y="72" textAnchor="middle" className="cr-act1781-ill-sublabel">
          {uiLabel(mode, 'Boundary', 'सीमा')}
        </text>

        <g transform="translate(340, 96)">
          <rect width="156" height="88" rx="6" fill="#F0FDF4" stroke="#15803D" strokeWidth="1.5" />
          <rect x="14" y="18" width="36" height="28" fill="#DCFCE7" stroke="#15803D" />
          <rect x="58" y="18" width="36" height="28" fill="#DCFCE7" stroke="#15803D" />
          <rect x="102" y="18" width="36" height="28" fill="#DCFCE7" stroke="#15803D" />
          <text x="78" y="78" textAnchor="middle" className="cr-act1781-ill-label">
            {uiLabel(mode, 'Provincial courts', 'प्रांतीय अदालतें')}
          </text>
        </g>

        <g transform="translate(180, 168)">
          <path d="M8 8 H88 L96 18 V72 H8 Z" fill="#FAF5FF" stroke="#7C3AED" strokeWidth="1.5" />
          <text x="52" y="36" textAnchor="middle" className="cr-act1781-ill-doc">1781</text>
          <text x="52" y="58" textAnchor="middle" className="cr-act1781-ill-label cr-act1781-ill-label--purple">
            {uiLabel(mode, 'Amending Act', 'संशोधन अधिनियम')}
          </text>
        </g>
      </svg>
    </figure>
  );
}
