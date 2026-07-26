'use client';

import { ArrowDown } from 'lucide-react';
import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import type { actOfSettlement1781Section } from '@/content/revision/indian-polity/company-rule-act1781-section.v1';

type Data = typeof actOfSettlement1781Section.judicialRoute;

type Props = {
  mode: LangMode;
  data: Data;
};

export function JudicialRouteDiagram({ mode, data }: Props) {
  return (
    <div className="cr-act1781-route-card">
      <h3 className="cr-act1773-card-title">{pick(data.heading, mode)}</h3>
      <div className="cr-act1781-route-grid">
        <div className="cr-act1781-route-chain">
          {data.steps.map((step, index) => (
            <div key={step.id} className="cr-act1781-route-step-wrap">
              <div className="cr-act1781-route-step">{pick(step.label, mode)}</div>
              {index < data.steps.length - 1 ? (
                <ArrowDown className="cr-act1781-route-arrow h-4 w-4" aria-hidden />
              ) : null}
            </div>
          ))}
        </div>
        <aside className="cr-act1781-route-court">
          <p className="cr-act1781-route-court-label">{pick(data.supremeCourtNote, mode)}</p>
          <p className="cr-act1781-route-note">{pick(data.note, mode)}</p>
        </aside>
      </div>
    </div>
  );
}
