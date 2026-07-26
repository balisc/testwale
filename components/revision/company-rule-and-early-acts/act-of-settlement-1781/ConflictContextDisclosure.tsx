'use client';

import { ChevronDown } from 'lucide-react';
import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import type { actOfSettlement1781Section } from '@/content/revision/indian-polity/company-rule-act1781-section.v1';
import { BiText } from '../shared';

type Data = typeof actOfSettlement1781Section.conflictDisclosure;

type Props = {
  mode: LangMode;
  data: Data;
};

export function ConflictContextDisclosure({ mode, data }: Props) {
  return (
    <details className="cr-act1773-advanced">
      <summary className="cr-act1773-advanced-summary">
        <span>{pick(data.heading, mode)}</span>
        <ChevronDown className="cr-act1773-advanced-chevron h-5 w-5 shrink-0" aria-hidden />
      </summary>
      <div className="cr-act1781-conflict-body">
        {data.examples.map((example) => (
          <article key={example.id} className="cr-act1781-conflict-example">
            <h4 className="cr-act1781-conflict-title">{pick(example.title, mode)}</h4>
            <BiText text={example.text} mode={mode} className="cr-act1781-conflict-text" />
          </article>
        ))}
      </div>
    </details>
  );
}
