'use client';

import { ArrowRight } from 'lucide-react';
import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import type { BiString } from '@/content/revision/indian-polity/company-rule-and-early-acts.v1';

type Props = {
  mode: LangMode;
  label: BiString;
  title: BiString;
  button: BiString;
  comingSoon: BiString;
  targetExists?: boolean;
  onContinue?: () => void;
};

export function NextActTransition({
  mode,
  label,
  title,
  button,
  comingSoon,
  targetExists = false,
  onContinue,
}: Props) {
  return (
    <div className="cr-act1773-next-card">
      <p className="cr-act1773-next-label">{pick(label, mode)}</p>
      <h3 className="cr-act1773-next-title">{pick(title, mode)}</h3>
      {targetExists ? (
        <button type="button" className="cr-act1773-next-btn" onClick={onContinue}>
          {pick(button, mode)}
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </button>
      ) : (
        <p className="cr-act1773-next-preview" aria-live="polite">
          <span className="cr-act1773-next-btn cr-act1773-next-btn--preview" aria-disabled="true">
            {pick(button, mode)}
          </span>
          <span className="cr-act1773-next-soon">{pick(comingSoon, mode)}</span>
        </p>
      )}
    </div>
  );
}
