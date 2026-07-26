'use client';

import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import type { actOfSettlement1781Section } from '@/content/revision/indian-polity/company-rule-act1781-section.v1';
import { uiLabel } from '../uiLabel';

type Data = typeof actOfSettlement1781Section.jurisdictionVisual;

type Props = {
  mode: LangMode;
  data: Data;
};

export function JurisdictionBoundaryVisual({ mode, data }: Props) {
  return (
    <div className="cr-act1781-boundary-card">
      <h3 className="cr-act1773-card-title">{pick(data.heading, mode)}</h3>
      <div className="cr-act1781-boundary-map">
        <div className="cr-act1781-boundary-zone cr-act1781-boundary-zone--calcutta">
          <p className="cr-act1781-boundary-label">{pick(data.calcutta.label, mode)}</p>
          <ul>
            {data.calcutta.points.map((point) => (
              <li key={point.en}>{pick(point, mode)}</li>
            ))}
          </ul>
        </div>
        <div className="cr-act1781-boundary-divider" aria-hidden>
          <span>{uiLabel(mode, 'Boundary', 'सीमा')}</span>
        </div>
        <div className="cr-act1781-boundary-zone cr-act1781-boundary-zone--mofussil">
          <p className="cr-act1781-boundary-label">{pick(data.mofussil.label, mode)}</p>
          <ul>
            {data.mofussil.points.map((point) => (
              <li key={point.en}>{pick(point, mode)}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="cr-act1781-boundary-note">{pick(data.explanation, mode)}</p>
    </div>
  );
}
