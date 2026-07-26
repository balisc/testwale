'use client';

import {
  ArrowDownLeft,
  Building2,
  FileText,
  Landmark,
  MapPin,
  ScrollText,
  Shield,
  Stamp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import type { BiString } from '@/content/revision/indian-polity/company-rule-and-early-acts.v1';
import type { KeyCorrectionIcon } from '@/content/revision/indian-polity/company-rule-act1781-section.v1';
import { BiText } from '../shared';

const ICONS: Record<KeyCorrectionIcon, LucideIcon> = {
  document: ScrollText,
  executive: Landmark,
  seal: Stamp,
  revenue: FileText,
  boundary: MapPin,
  manuscript: ScrollText,
  courthouse: Building2,
  appeal: ArrowDownLeft,
  regulation: FileText,
};

type Item = {
  id: string;
  icon: KeyCorrectionIcon;
  text: BiString;
  qualifier?: BiString;
};

type Props = {
  mode: LangMode;
  heading: BiString;
  items: readonly Item[];
};

export function KeyCorrectionList({ mode, heading, items }: Props) {
  return (
    <div className="cr-act1773-features-card">
      <h3 className="cr-act1773-card-title">
        <Shield className="h-4 w-4 shrink-0 text-[#2563EB]" aria-hidden />
        {pick(heading, mode)}
      </h3>
      <ul className="cr-act1773-features-list">
        {items.map((item) => {
          const Icon = ICONS[item.icon] ?? ScrollText;
          return (
            <li key={item.id} className="cr-act1773-feature-row">
              <span className="cr-act1781-feature-icon" aria-hidden>
                <Icon className="h-4 w-4" />
              </span>
              <div className="cr-act1781-feature-body">
                {mode === 'both' ? (
                  <div className="cr-act1773-feature-bilingual">
                    <p className="cr-act1773-feature-text">{item.text.en}</p>
                    <p className="cr-act1773-feature-text cr-act1773-feature-text--hi">{item.text.hi}</p>
                  </div>
                ) : (
                  <BiText text={item.text} mode={mode} className="cr-act1773-feature-text" as="p" />
                )}
                {item.qualifier ? (
                  <p className="cr-act1781-feature-qualifier">{pick(item.qualifier, mode)}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
