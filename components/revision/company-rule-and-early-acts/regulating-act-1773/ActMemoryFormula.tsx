'use client';

import { Brain } from 'lucide-react';
import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import type { BiString } from '@/content/revision/indian-polity/company-rule-and-early-acts.v1';

type Props = {
  mode: LangMode;
  heading: BiString;
  formula: BiString;
};

export function ActMemoryFormula({ mode, heading, formula }: Props) {
  return (
    <aside className="cr-act1773-memory-card" aria-labelledby="cr-act1773-memory-heading">
      <h3 id="cr-act1773-memory-heading" className="cr-act1773-memory-title">
        <Brain className="h-4 w-4 shrink-0" aria-hidden />
        {pick(heading, mode)}
      </h3>
      <p className="cr-act1773-memory-formula">{pick(formula, mode)}</p>
    </aside>
  );
}
