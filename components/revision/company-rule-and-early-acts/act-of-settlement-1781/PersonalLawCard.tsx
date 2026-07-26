'use client';

import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import type { actOfSettlement1781Section } from '@/content/revision/indian-polity/company-rule-act1781-section.v1';
import { BiText } from '../shared';
import { uiLabel } from '../uiLabel';

type Data = typeof actOfSettlement1781Section.personalLaw;

type Props = {
  mode: LangMode;
  data: Data;
};

export function PersonalLawCard({ mode, data }: Props) {
  return (
    <div className="cr-act1781-personal-card">
      <h3 className="cr-act1773-card-title">{pick(data.heading, mode)}</h3>
      <BiText text={data.text} mode={mode} className="cr-act1781-personal-text" />
      <p className="cr-act1781-personal-qualifier">
        {uiLabel(mode, 'In relevant matters', 'संबंधित मामलों में')}
      </p>
      <div className="cr-act1781-personal-subcards">
        <div className="cr-act1781-personal-sub">{pick(data.subcards.hindu, mode)}</div>
        <div className="cr-act1781-personal-sub">{pick(data.subcards.muslim, mode)}</div>
      </div>
    </div>
  );
}
