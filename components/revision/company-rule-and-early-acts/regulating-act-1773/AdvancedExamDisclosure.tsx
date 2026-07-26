'use client';

import { ChevronDown } from 'lucide-react';
import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import type { BiString } from '@/content/revision/indian-polity/company-rule-and-early-acts.v1';
import { BiText } from '../shared';

type Props = {
  mode: LangMode;
  heading: BiString;
  items: readonly BiString[];
};

export function AdvancedExamDisclosure({ mode, heading, items }: Props) {
  return (
    <details className="cr-act1773-advanced">
      <summary className="cr-act1773-advanced-summary">
        <span>{pick(heading, mode)}</span>
        <ChevronDown className="cr-act1773-advanced-chevron h-5 w-5 shrink-0" aria-hidden />
      </summary>
      <ul className="cr-act1773-advanced-list">
        {items.map((item) => (
          <li key={item.en}>
            <BiText text={item} mode={mode} as="span" />
          </li>
        ))}
      </ul>
    </details>
  );
}
