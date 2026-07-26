'use client';

import { AlertTriangle } from 'lucide-react';
import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import type { BiString } from '@/content/revision/indian-polity/company-rule-and-early-acts.v1';
import { BiText } from '../shared';

type Props = {
  mode: LangMode;
  heading: BiString;
  text: BiString;
};

export function ActExamTrapCard({ mode, heading, text }: Props) {
  return (
    <aside className="cr-act1773-trap-card" aria-labelledby="cr-act1773-trap-heading">
      <h3 id="cr-act1773-trap-heading" className="cr-act1773-trap-title">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
        {pick(heading, mode)}
      </h3>
      <BiText text={text} mode={mode} className="cr-act1773-trap-text" />
    </aside>
  );
}
