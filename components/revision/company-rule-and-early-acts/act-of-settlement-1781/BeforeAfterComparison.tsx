'use client';

import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import type { BiString } from '@/content/revision/indian-polity/company-rule-and-early-acts.v1';
import { uiLabel } from '../uiLabel';

type Row = {
  id: string;
  aspect: BiString;
  after1773: BiString;
  correction1781: BiString;
};

type Props = {
  mode: LangMode;
  heading: BiString;
  rows: readonly Row[];
};

export function BeforeAfterComparison({ mode, heading, rows }: Props) {
  return (
    <div className="cr-act1781-compare-card">
      <h3 className="cr-act1773-card-title">{pick(heading, mode)}</h3>

      <table className="cr-act1781-compare-table">
        <caption className="sr-only">{pick(heading, mode)}</caption>
        <thead>
          <tr>
            <th scope="col">{uiLabel(mode, 'Aspect', 'पहलू')}</th>
            <th scope="col">{uiLabel(mode, 'After 1773', '1773 के बाद')}</th>
            <th scope="col">{uiLabel(mode, 'Correction in 1781', '1781 में सुधार')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">{pick(row.aspect, mode)}</th>
              <td>{pick(row.after1773, mode)}</td>
              <td>{pick(row.correction1781, mode)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="cr-act1781-compare-stack">
        {rows.map((row) => (
          <article key={`stack-${row.id}`} className="cr-act1781-compare-stack-card">
            <h4 className="cr-act1781-compare-stack-aspect">{pick(row.aspect, mode)}</h4>
            <p>
              <span className="cr-act1781-compare-stack-label">{uiLabel(mode, 'After 1773', '1773 के बाद')}:</span>{' '}
              {pick(row.after1773, mode)}
            </p>
            <p>
              <span className="cr-act1781-compare-stack-label">{uiLabel(mode, '1781 correction', '1781 सुधार')}:</span>{' '}
              {pick(row.correction1781, mode)}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
