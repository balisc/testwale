'use client';

import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import type { BiString } from '@/content/revision/indian-polity/company-rule-and-early-acts.v1';
import { BiText } from '../shared';

type Props = {
  mode: LangMode;
  heading: BiString;
  points: BiString[];
  bridge: BiString;
};

export function ActConflictCard({ mode, heading, points, bridge }: Props) {
  return (
    <div className="cr-act1773-conflict-card">
      <h3 className="cr-act1773-card-title">{pick(heading, mode)}</h3>
      <ul className="cr-act1773-conflict-list">
        {points.map((point) => (
          <li key={point.en}>
            <BiText text={point} mode={mode} as="span" />
          </li>
        ))}
      </ul>
      <p className="cr-act1773-conflict-bridge">{pick(bridge, mode)}</p>
    </div>
  );
}
