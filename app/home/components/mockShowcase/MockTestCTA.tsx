'use client';

import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import type { MockShowcaseCta } from '@/lib/mockTests/showcase';

const baseClassName = 'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 motion-reduce:transition-none sm:w-auto sm:min-w-[250px] max-[479px]:text-sm';

export default function MockTestCTA({
  cta,
  generating,
  onGenerate,
}: {
  cta: MockShowcaseCta;
  generating: boolean;
  onGenerate: () => void;
}) {
  if (cta.href) {
    return (
      <Link href={cta.href} className={`${baseClassName} bg-violet-700 text-white hover:bg-violet-800`}>
        {cta.label}<ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    );
  }
  return (
    <button
      type="button"
      disabled={!cta.canGenerate || generating}
      onClick={onGenerate}
      className={`${baseClassName} ${cta.canGenerate ? 'bg-violet-700 text-white hover:bg-violet-800' : 'cursor-not-allowed bg-slate-200 text-slate-600'}`}
    >
      {generating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {generating ? 'Generating your mock…' : cta.label}
      {!generating && cta.canGenerate ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
    </button>
  );
}
