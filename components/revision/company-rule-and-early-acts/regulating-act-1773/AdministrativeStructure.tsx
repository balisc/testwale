'use client';

import { ArrowDown, Crown, Users } from 'lucide-react';
import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import type { BiString } from '@/content/revision/indian-polity/company-rule-and-early-acts.v1';

type Props = {
  mode: LangMode;
  heading: BiString;
  governorExisting: BiString;
  elevatedTo: BiString;
  firstHolder: BiString;
  council: BiString;
  presidencies: BiString[];
  qualifier: BiString;
};

export function AdministrativeStructure({
  mode,
  heading,
  governorExisting,
  elevatedTo,
  firstHolder,
  council,
  presidencies,
  qualifier,
}: Props) {
  return (
    <div className="cr-act1773-admin-card">
      <h3 className="cr-act1773-card-title">
        <span className="cr-act1773-admin-icon" aria-hidden>
          ⎇
        </span>
        {pick(heading, mode)}
      </h3>

      <div className="cr-act1773-admin-grid">
        <div className="cr-act1773-admin-col">
          <div className="cr-act1773-admin-node cr-act1773-admin-node--neutral">
            <span className="cr-act1773-admin-node-label">{pick(governorExisting, mode)}</span>
            <span className="cr-act1773-admin-node-sub">
              {pick({ en: '(Existing)', hi: '(पहले से)' }, mode)}
            </span>
          </div>

          <div className="cr-act1773-admin-arrow" aria-hidden>
            <ArrowDown className="h-5 w-5" />
            <span>{pick({ en: 'elevated to', hi: 'को बढ़ाया गया' }, mode)}</span>
          </div>

          <div className="cr-act1773-admin-node cr-act1773-admin-node--primary">
            <Crown className="h-4 w-4 shrink-0" aria-hidden />
            <div>
              <span className="cr-act1773-admin-node-label">{pick(elevatedTo, mode)}</span>
              <span className="cr-act1773-admin-node-person">{pick(firstHolder, mode)}</span>
            </div>
          </div>
        </div>

        <div className="cr-act1773-admin-col">
          <div className="cr-act1773-admin-node cr-act1773-admin-node--council">
            <Users className="h-4 w-4 shrink-0" aria-hidden />
            <span className="cr-act1773-admin-node-label">{pick(council, mode)}</span>
          </div>

          <div className="cr-act1773-admin-merge" aria-hidden>
            <span className="cr-act1773-admin-merge-label">
              {pick({ en: 'Governor-General-in-Council', hi: 'गवर्नर-जनरल-इन-काउंसिल' }, mode)}
            </span>
          </div>

          <div className="cr-act1773-admin-control">
            <p className="cr-act1773-admin-qualifier">{pick(qualifier, mode)}</p>
            <ul className="cr-act1773-admin-presidencies">
              {presidencies.map((p) => (
                <li key={p.en} className="cr-act1773-admin-node cr-act1773-admin-node--presidency">
                  {pick(p, mode)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
