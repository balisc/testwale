import type { ActivityAccuracyTrend } from '@/lib/profileActivityTypes';
import type { ProfileActivityCopy } from '../profileActivityCopy';

type Props = {
  copy: ProfileActivityCopy;
  trend: ActivityAccuracyTrend;
};

export default function ProfileActivityAccuracyTrend({ copy, trend }: Props) {
  const hasData = trend.points.some((point) => point.attempts > 0);
  const plotted = trend.points.filter((point) => point.accuracy_percent != null);
  const maxY = 100;
  const minY = 0;

  const width = 320;
  const height = 120;
  const padX = 8;
  const padY = 8;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const coords = trend.points.map((point, index) => {
    const x = padX + (index / Math.max(trend.points.length - 1, 1)) * innerW;
    const y =
      point.accuracy_percent == null
        ? null
        : padY + innerH - ((point.accuracy_percent - minY) / (maxY - minY)) * innerH;
    return { x, y, point };
  });

  const segments: string[] = [];
  let current: string[] = [];
  for (const coord of coords) {
    if (coord.y == null) {
      if (current.length > 0) {
        segments.push(current.join(' '));
        current = [];
      }
      continue;
    }
    current.push(`${coord.x},${coord.y}`);
  }
  if (current.length > 0) segments.push(current.join(' '));

  const changeLabel =
    trend.change_points != null
      ? copy.changePoints(trend.change_points)
      : copy.noPriorPeriod;
  const changePositive = trend.change_points != null && trend.change_points >= 0;

  return (
    <section
      aria-label={copy.accuracyTrend}
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <div>
        <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{copy.accuracyTrend}</h3>
        <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{copy.firstAttemptHint}</p>
      </div>

      <div className="mt-4">
        <p className="text-2xl font-bold text-brand sm:text-3xl">
          {copy.currentAccuracy(trend.current_accuracy_percent)}
        </p>
        <p
          className={`mt-1 text-sm ${changePositive ? 'text-emerald-600' : 'text-slate-600'}`}
          aria-live="polite"
        >
          {changeLabel}
        </p>
      </div>

      {!hasData ? (
        <p className="mt-6 text-sm text-slate-500">{copy.noChartData}</p>
      ) : (
        <div className="mt-4 min-w-0">
          <div className="flex gap-2">
            <div className="flex flex-col justify-between py-1 text-[10px] text-slate-400" aria-hidden>
              <span>100%</span>
              <span>50%</span>
              <span>0%</span>
            </div>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="h-28 w-full min-w-0 flex-1 text-brand sm:h-32"
              role="img"
              aria-label={copy.chartSummary}
            >
              {[0, 50, 100].map((tick) => {
                const y = padY + innerH - ((tick - minY) / (maxY - minY)) * innerH;
                return (
                  <line
                    key={tick}
                    x1={padX}
                    x2={width - padX}
                    y1={y}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeWidth="1"
                  />
                );
              })}
              {segments.map((points, index) => (
                <polyline
                  key={index}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={points}
                  className="motion-reduce:transition-none"
                />
              ))}
              {coords.map(({ x, y, point }) =>
                y != null ? (
                  <circle key={point.key} cx={x} cy={y} r="3.5" fill="currentColor" />
                ) : null,
              )}
            </svg>
          </div>
          <div className="mt-2 flex justify-between gap-1 px-6 text-[10px] text-slate-500 sm:text-xs">
            {trend.points.map((point) => (
              <span key={point.key} className="min-w-0 truncate text-center">
                {point.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <table className="sr-only">
        <caption>{copy.chartSummary}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Accuracy</th>
            <th scope="col">Attempts</th>
          </tr>
        </thead>
        <tbody>
          {trend.points.map((point) => (
            <tr key={point.key}>
              <td>{point.label}</td>
              <td>{point.accuracy_percent == null ? 'No attempts' : `${point.accuracy_percent}%`}</td>
              <td>{point.attempts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
