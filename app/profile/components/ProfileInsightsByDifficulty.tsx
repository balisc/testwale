import type { InsightsDifficultyRow } from '@/lib/profileInsightsTypes';
import type { ProfileInsightsCopy } from '../profileInsightsCopy';
import ProfileProgressBar from './ProfileProgressBar';

type Props = {
  copy: ProfileInsightsCopy;
  rows: InsightsDifficultyRow[];
  language: 'en' | 'hi';
};

export default function ProfileInsightsByDifficulty({ copy, rows, language }: Props) {
  return (
    <section
      aria-label={copy.byDifficulty}
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <div>
        <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{copy.byDifficulty}</h3>
        <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{copy.difficultyHint}</p>
      </div>

      <ul className="mt-4 space-y-3.5">
        {rows.map((row) => {
          const label = language === 'hi' ? row.label_hi : row.label_en;
          const display = row.insufficient_data ? copy.notEnoughData : `${row.accuracy_percent}%`;

          return (
            <li key={row.key}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="font-medium text-slate-800">{label}</span>
                <span className="shrink-0 font-semibold text-brand">{display}</span>
              </div>
              <ProfileProgressBar
                value={row.insufficient_data ? 0 : (row.accuracy_percent ?? 0)}
                label={`${label} ${copy.difficultyHint}: ${display}`}
              />
              <p className="mt-0.5 text-xs text-slate-500">
                {row.unique_questions} {language === 'hi' ? 'अद्वितीय प्रश्न' : 'unique questions'}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
