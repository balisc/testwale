'use client';

import Image from 'next/image';
import type { LangMode } from '@/app/demo/lib/bilingual';
import { getCompanyRuleImage } from '../companyRuleRevisionImages';
import { uiLabel } from '../uiLabel';

type Props = {
  mode: LangMode;
};

export function RegulatingActIllustration({ mode }: Props) {
  const img = getCompanyRuleImage('regulatingAct1773');
  const alt = uiLabel(
    mode,
    'British officer presenting the Regulating Act 1773 from Parliament toward Fort William at Calcutta',
    'ब्रिटिश अधिकारी संसद से रेगुलेटिंग एक्ट 1773 कलकत्ता के फोर्ट विलियम की ओर प्रस्तुत करते हैं',
  );

  return (
    <figure className="cr-act1773-illustration">
      <Image
        src={img.src}
        alt={alt}
        width={img.width}
        height={img.height}
        sizes={img.sizes}
        className="cr-act1773-illustration-img"
        style={{ width: '100%', height: 'auto' }}
      />
    </figure>
  );
}
