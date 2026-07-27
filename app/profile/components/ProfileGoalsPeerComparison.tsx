import { Lock } from 'lucide-react';
import type { ProfileGoalsCopy } from '../profileGoalsCopy';

type Props = {
  copy: ProfileGoalsCopy;
};

export default function ProfileGoalsPeerComparison({ copy }: Props) {
  return (
    <section
      aria-label={copy.peerComparison}
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{copy.peerComparison}</h3>
      <div className="mt-6 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[#DDD6FE] bg-[#FAF5FF] px-4 py-8 text-center">
        <Lock className="h-8 w-8 text-brand" aria-hidden />
        <p className="mt-3 text-sm font-medium text-slate-700">{copy.peerLocked}</p>
        <p className="mt-2 text-sm text-slate-500">{copy.peerHint}</p>
      </div>
    </section>
  );
}
