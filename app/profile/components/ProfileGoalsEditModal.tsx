'use client';

import { X } from 'lucide-react';
import ModalPortal from '@/components/ModalPortal';
import { GOAL_LIMITS } from '@/lib/profileGoalsCore';
import type { ProfileGoalsCopy } from '../profileGoalsCopy';

type Props = {
  open: boolean;
  onClose: () => void;
  copy: ProfileGoalsCopy;
  form: { daily_goal: number; weekly_goal: number; monthly_goal: number };
  onChange: (field: 'daily_goal' | 'weekly_goal' | 'monthly_goal', value: number) => void;
  onSave: () => void;
  saving: boolean;
  error: boolean;
};

export default function ProfileGoalsEditModal({
  open,
  onClose,
  copy,
  form,
  onChange,
  onSave,
  saving,
  error,
}: Props) {
  return (
    <ModalPortal
      open={open}
      onClose={onClose}
      labelledBy="edit-goals-title"
      zClassName="z-50"
      panelClassName="max-w-md rounded-2xl bg-white p-4 shadow-xl min-[360px]:p-6"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 id="edit-goals-title" className="text-base font-bold text-slate-900 min-[360px]:text-lg">
          {copy.editGoals}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label={copy.close}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <X className="h-5 w-5 text-slate-400" />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {(['daily_goal', 'weekly_goal', 'monthly_goal'] as const).map((field) => {
          const period = field.replace('_goal', '') as 'daily' | 'weekly' | 'monthly';
          const limits = GOAL_LIMITS[period];
          const label =
            period === 'daily' ? copy.daily : period === 'weekly' ? copy.weekly : copy.monthly;
          return (
            <label key={field} className="block text-xs font-medium text-slate-700 min-[360px]:text-sm">
              {label} ({limits.min}–{limits.max} {copy.questions})
              <input
                type="number"
                min={limits.min}
                max={limits.max}
                step={1}
                value={form[field]}
                onChange={(e) => onChange(field, Number(e.target.value))}
                className="mt-1 w-full min-w-0 rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-brand min-[360px]:rounded-xl min-[360px]:px-3 min-[360px]:text-sm"
              />
            </label>
          );
        })}
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{copy.saveError}</p> : null}

      <button
        type="button"
        disabled={saving}
        onClick={onSave}
        aria-busy={saving}
        className="mt-4 w-full min-h-[44px] rounded-lg bg-brand py-2.5 text-xs font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-60 min-[360px]:mt-5 min-[360px]:rounded-xl min-[360px]:text-sm"
      >
        {saving ? copy.saving : copy.saveGoals}
      </button>
    </ModalPortal>
  );
}
