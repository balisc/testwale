'use client';

import { Scale } from 'lucide-react';
import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import type { BiString } from '@/content/revision/indian-polity/company-rule-and-early-acts.v1';

type FactRow = {
  label: BiString;
  value: BiString;
};

type Props = {
  mode: LangMode;
  heading: BiString;
  actHighlight: BiString;
  establishedHighlight: BiString;
  rows: FactRow[];
};

export function SupremeCourtFactCard({
  mode,
  heading,
  actHighlight,
  establishedHighlight,
  rows,
}: Props) {
  return (
    <div className="cr-act1773-court-card">
      <h3 className="cr-act1773-card-title">
        <Scale className="h-4 w-4 shrink-0 text-[#2563EB]" aria-hidden />
        {pick(heading, mode)}
      </h3>

      <div className="cr-act1773-court-highlights">
        <span className="cr-act1773-court-highlight">{pick(actHighlight, mode)}</span>
        <span className="cr-act1773-court-highlight cr-act1773-court-highlight--accent">
          {pick(establishedHighlight, mode)}
        </span>
      </div>

      <table className="cr-act1773-court-table">
        <caption className="sr-only">{pick(heading, mode)}</caption>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label.en}>
              <th scope="row">{pick(row.label, mode)}</th>
              <td>{pick(row.value, mode)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="cr-act1773-court-stack">
        {rows.map((row) => (
          <div key={`stack-${row.label.en}`} className="cr-act1773-court-stack-row">
            <dt>{pick(row.label, mode)}</dt>
            <dd>{pick(row.value, mode)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
