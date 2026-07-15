'use client';

type Props = {
  attempted: number;
  correct: number;
  total: number;
  hintsUsed: number;
  timerEnabled: boolean;
};

export default function MapScorePanel({ attempted, correct, total, hintsUsed, timerEnabled }: Props) {
  const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Score</h2>
      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
          <div className="text-[11px] text-slate-500">Attempted</div>
          <div className="font-bold text-slate-900">
            {attempted}/{total}
          </div>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
          <div className="text-[11px] text-slate-500">Correct</div>
          <div className="font-bold text-emerald-700">{correct}</div>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
          <div className="text-[11px] text-slate-500">Accuracy</div>
          <div className="font-bold text-indigo-700">{accuracy.toFixed(1)}%</div>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
          <div className="text-[11px] text-slate-500">Hints Used</div>
          <div className="font-bold text-slate-900">{hintsUsed}</div>
        </div>
      </div>
      <div className="mt-2 text-[11px] text-slate-500">
        Timer mode: <span className="font-semibold text-slate-700">{timerEnabled ? 'ON (30s)' : 'OFF'}</span>
      </div>
    </aside>
  );
}
