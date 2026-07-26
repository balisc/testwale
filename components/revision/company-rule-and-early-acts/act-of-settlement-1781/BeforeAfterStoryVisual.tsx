'use client';

import type { LangMode } from '@/app/demo/lib/bilingual';
import { uiLabel } from '../uiLabel';

type Props = {
  mode: LangMode;
};

export function BeforeAfterStoryVisual({ mode }: Props) {
  return (
    <div className="cr-act1781-before-after-visual" aria-label={uiLabel(mode, 'Before and after 1781', '1781 से पहले और बाद')}>
      <div className="cr-act1781-ba-panel cr-act1781-ba-panel--before">
        <p className="cr-act1781-ba-label">{uiLabel(mode, 'Before 1781 — Overlap & conflict', '1781 से पहले — ओवरलैप और टकराव')}</p>
        <svg viewBox="0 0 200 120" className="cr-act1781-ba-svg" aria-hidden>
          <circle cx="70" cy="55" r="32" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.5" opacity="0.9" />
          <circle cx="110" cy="55" r="32" fill="#F0FDF4" stroke="#15803D" strokeWidth="1.5" opacity="0.9" />
          <circle cx="90" cy="75" r="28" fill="#FFFBEB" stroke="#D97706" strokeWidth="1.5" opacity="0.9" />
          <text x="70" y="58" textAnchor="middle" className="cr-act1781-venn-text">SC</text>
          <text x="110" y="58" textAnchor="middle" className="cr-act1781-venn-text">Co.</text>
          <text x="90" y="78" textAnchor="middle" className="cr-act1781-venn-text">Rev</text>
          <text x="90" y="55" textAnchor="middle" className="cr-act1781-venn-conflict">!</text>
        </svg>
        <p className="cr-act1781-ba-caption">
          {uiLabel(mode, 'Unclear limits → jurisdictional conflict', 'अस्पष्ट सीमाएँ → अधिकारिता संघर्ष')}
        </p>
      </div>

      <div className="cr-act1781-ba-arrow" aria-hidden>
        <span>{uiLabel(mode, 'Act of Settlement, 1781', 'एक्ट ऑफ सेटलमेंट, 1781')}</span>
        →
      </div>

      <div className="cr-act1781-ba-panel cr-act1781-ba-panel--after">
        <p className="cr-act1781-ba-label">{uiLabel(mode, 'After 1781 — Clearer boundaries', '1781 के बाद — स्पष्ट सीमाएँ')}</p>
        <ul className="cr-act1781-ba-after-list">
          <li>{uiLabel(mode, 'Court jurisdiction clarified', 'न्यायालय की अधिकारिता स्पष्ट')}</li>
          <li>{uiLabel(mode, 'Official acts protected', 'सरकारी कार्य संरक्षित')}</li>
          <li>{uiLabel(mode, 'Revenue outside Court reach', 'राजस्व न्यायालय से बाहर')}</li>
          <li>{uiLabel(mode, 'Personal laws respected', 'व्यक्तिगत विधियों का सम्मान')}</li>
        </ul>
      </div>
    </div>
  );
}
