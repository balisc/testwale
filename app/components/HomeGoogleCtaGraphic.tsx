'use client';

import { Check, Lock, Shield } from 'lucide-react';

export default function HomeGoogleCtaGraphic() {
  return (
    <div className="relative mx-auto h-[96px] w-[112px] shrink-0 sm:mx-0" aria-hidden>
      <div className="relative flex h-[80px] w-[80px] items-center justify-center rounded-2xl bg-[#EDE9FE]">
        <Shield className="h-11 w-11 text-brand" strokeWidth={1.5} />
        <Lock className="absolute h-[18px] w-[18px] text-[#0F172A]" strokeWidth={2.2} />
      </div>
      <svg
        className="absolute bottom-0 left-[34px] h-11 w-[72px] text-brand/45"
        viewBox="0 0 72 44"
        fill="none"
        aria-hidden
      >
        <path
          d="M2 6 C 18 4, 28 30, 58 34"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute bottom-0 left-[82px] flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white shadow-md">
        <Check className="h-4 w-4" strokeWidth={3} />
      </div>
    </div>
  );
}
