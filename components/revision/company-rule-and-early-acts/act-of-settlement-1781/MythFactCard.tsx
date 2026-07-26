'use client';

import { XCircle } from 'lucide-react';
import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import type { BiString } from '@/content/revision/indian-polity/company-rule-and-early-acts.v1';
import { BiText } from '../shared';

type Props = {
  mode: LangMode;
  heading: BiString;
  items: readonly BiString[];
};

export function MythFactCard({ mode, heading, items }: Props) {
  return (
    <aside className="cr-act1781-myth-card" aria-labelledby="cr-act1781-myth-heading">
      <h3 id="cr-act1781-myth-heading" className="cr-act1781-myth-title">
        <XCircle className="h-4 w-4 shrink-0" aria-hidden />
        {pick(heading, mode)}
      </h3>
      <ul className="cr-act1781-myth-list">
        {items.map((item) => (
          <li key={item.en}>
            <XCircle className="h-3.5 w-3.5 shrink-0 cr-act1781-myth-x" aria-hidden />
            <BiText text={item} mode={mode} as="span" />
          </li>
        ))}
      </ul>
    </aside>
  );
}
