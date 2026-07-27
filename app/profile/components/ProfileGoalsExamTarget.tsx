import { FileText } from 'lucide-react';
import type { ProfileGoalsData } from '@/lib/profileGoalsTypes';
import type { ProfileGoalsCopy } from '../profileGoalsCopy';
import ProfileProgressBar from './ProfileProgressBar';

type Props = {
  copy: ProfileGoalsCopy;
  exam: ProfileGoalsData['exam_target'];
  readiness: ProfileGoalsData['readiness'];
  language: 'en' | 'hi';
  onUpdateTarget: () => void;
};

export default function ProfileGoalsExamTarget({ copy, exam, readiness, language, onUpdateTarget }: Props) {
  const examName = exam.name?.trim() || copy.noExamSelected;
  const daysLabel = language === 'hi' ? exam.days_remaining_label_hi : exam.days_remaining_label_en;
  const readinessExplanation = language === 'hi' ? readiness.explanation_hi : readiness.explanation_en;

  return (
    <section
      aria-label={copy.examTarget}
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{copy.examTarget}</h3>
        <button
          type="button"
          onClick={onUpdateTarget}
          className="shrink-0 text-sm font-medium text-brand underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {copy.updateTarget}
        </button>
      </div>

      <div className="mt-4 flex items-start gap-3">
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
        <div className="min-w-0">
          <p className="font-semibold text-slate-800">{examName}</p>
          <p className="mt-1 text-xs text-slate-500">{daysLabel}</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-slate-700">{copy.readiness}</p>
        {readiness.locked ? (
          <p className="mt-2 text-sm text-slate-500">{copy.readinessLocked}</p>
        ) : (
          <>
            <p className="mt-2 text-3xl font-bold text-brand">{readiness.percent}%</p>
            <p className="mt-1 text-xs text-slate-500">{readiness.label}</p>
            <div className="mt-3">
              <ProfileProgressBar
                value={readiness.percent ?? 0}
                label={`${copy.readiness}: ${readiness.percent}%`}
              />
            </div>
          </>
        )}
        <p className="mt-2 text-[11px] text-slate-400">{readinessExplanation}</p>
      </div>
    </section>
  );
}
