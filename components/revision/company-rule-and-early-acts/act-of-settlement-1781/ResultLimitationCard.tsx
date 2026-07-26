'use client';

import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import type { actOfSettlement1781Section } from '@/content/revision/indian-polity/company-rule-act1781-section.v1';
import { BiText } from '../shared';

type Data = typeof actOfSettlement1781Section.resultLimitation;

type Props = {
  mode: LangMode;
  data: Data;
};

export function ResultLimitationCard({ mode, data }: Props) {
  return (
    <div className="cr-act1781-result-card">
      <h3 className="cr-act1773-card-title">{pick(data.heading, mode)}</h3>
      <BiText text={data.text} mode={mode} className="cr-act1781-result-text" />
      <p className="cr-act1781-result-bridge">{pick(data.bridge, mode)}</p>
    </div>
  );
}
