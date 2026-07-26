'use client';

import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import type { BiString } from '@/content/revision/indian-polity/company-rule-and-early-acts.v1';
import { BiText } from '../shared';

type Stage = {
  id: string;
  label: BiString;
  text: BiString;
};

type Props = {
  mode: LangMode;
  stages: readonly Stage[];
};

export function CorrectionStoryStrip({ mode, stages }: Props) {
  return (
    <div className="cr-act1781-story-strip" aria-label={pick({ en: 'Problem to correction', hi: 'समस्या से सुधार' }, mode)}>
      {stages.map((stage, index) => (
        <div key={stage.id} className="cr-act1781-story-stage">
          {index > 0 ? <span className="cr-act1781-story-arrow" aria-hidden>→</span> : null}
          <article className={`cr-act1781-story-card cr-act1781-story-card--${stage.id}`}>
            <p className="cr-act1781-story-label">{pick(stage.label, mode)}</p>
            <BiText text={stage.text} mode={mode} className="cr-act1781-story-text" />
          </article>
        </div>
      ))}
    </div>
  );
}
