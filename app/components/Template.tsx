'use client';

import type { ReactNode } from 'react';

export default function Template({
  children,
  disableTopPadding = false,
}: {
  children: ReactNode;
  disableTopPadding?: boolean;
}) {
  // Match fixed BaliHeader height (72px / 56px on ultra-narrow)
  return (
    <div
      className={`min-h-screen bg-[#FAFAFC] text-slate-900 ${
        disableTopPadding ? '' : 'pt-[72px] max-[359px]:pt-14'
      }`}
    >
      {children}
    </div>
  );
}
