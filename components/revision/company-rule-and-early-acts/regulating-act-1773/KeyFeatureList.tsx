'use client';

import {
  Building2,
  Crown,
  FileText,
  Landmark,
  Scale,
  ShieldCheck,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import type { BiString } from '@/content/revision/indian-polity/company-rule-and-early-acts.v1';
import { BiText } from '../shared';

const ICONS: Record<string, LucideIcon> = {
  landmark: Landmark,
  crown: Crown,
  user: User,
  users: Users,
  building: Building2,
  scale: Scale,
  shield: ShieldCheck,
  document: FileText,
};

type Feature = {
  id: string;
  icon: keyof typeof ICONS;
  text: BiString;
};

type Props = {
  mode: LangMode;
  heading: BiString;
  items: Feature[];
};

export function KeyFeatureList({ mode, heading, items }: Props) {
  return (
    <div className="cr-act1773-features-card">
      <h3 className="cr-act1773-card-title">
        <span className="cr-act1773-star" aria-hidden>
          ★
        </span>
        {pick(heading, mode)}
      </h3>
      <ul className="cr-act1773-features-list">
        {items.map((item) => {
          const Icon = ICONS[item.icon] ?? Landmark;
          return (
            <li key={item.id} className="cr-act1773-feature-row">
              <span className="cr-act1773-feature-icon" aria-hidden>
                <Icon className="h-4 w-4" />
              </span>
              {mode === 'both' ? (
                <div className="cr-act1773-feature-bilingual">
                  <p className="cr-act1773-feature-text">{item.text.en}</p>
                  <p className="cr-act1773-feature-text cr-act1773-feature-text--hi">{item.text.hi}</p>
                </div>
              ) : (
                <BiText text={item.text} mode={mode} className="cr-act1773-feature-text" as="p" />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
