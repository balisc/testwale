import type { ActivityPracticeMix } from '@/lib/profileActivityTypes';
import type { ProfileActivityCopy } from '../profileActivityCopy';
import ProfileProgressBar from './ProfileProgressBar';

type Props = {
  copy: ProfileActivityCopy;
  mix: ActivityPracticeMix;
  language: 'en' | 'hi';
};

export default function ProfileActivityPracticeMix({ copy, mix, language }: Props) {
  const difficultyRows = mix.difficulty;
  const subjectRows = mix.subjects;

  return (
    <section
      aria-label={copy.practiceMix}
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <div>
        <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{copy.practiceMix}</h3>
        {mix.exam_tags_omitted ? (
          <p className="mt-0.5 text-xs text-slate-500">{copy.examMixOmitted}</p>
        ) : null}
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-semibold text-slate-800">{copy.difficultyLevel}</h4>
        {difficultyRows.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">{copy.noChartData}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {difficultyRows.map((row) => {
              const label = language === 'hi' ? row.label_hi : row.label_en;
              return (
                <li key={row.key}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-slate-700">{label}</span>
                    <span className="shrink-0 font-semibold text-brand">{copy.percentLabel(row.percent)}</span>
                  </div>
                  <ProfileProgressBar
                    value={row.percent}
                    label={`${label}: ${row.percent}% (${row.count})`}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-5 border-t border-[#F1F5F9] pt-4">
        <h4 className="text-sm font-semibold text-slate-800">{copy.subjectMix}</h4>
        {subjectRows.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">{copy.noChartData}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {subjectRows.slice(0, 5).map((row) => {
              const label = language === 'hi' ? row.label_hi : row.label_en;
              return (
                <li key={row.key}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium text-slate-700">{label}</span>
                    <span className="shrink-0 font-semibold text-brand">{copy.percentLabel(row.percent)}</span>
                  </div>
                  <ProfileProgressBar
                    value={row.percent}
                    label={`${label}: ${row.percent}% (${row.count})`}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
