'use client';

import { X } from 'lucide-react';
import ModalPortal from '@/components/ModalPortal';
import TargetExamPickerField from '@/components/profile/TargetExamPickerField';
import type { ProfileCopy } from '../profileCopy';

type ProfileEditModalProps = {
  open: boolean;
  onClose: () => void;
  copy: ProfileCopy;
  language: 'en' | 'hi';
  mode?: 'full' | 'examGoal';
  form: { bio: string; country: string; target_exam: string; exam_date: string };
  onChange: (field: 'bio' | 'country' | 'target_exam' | 'exam_date', value: string) => void;
  onSave: () => void;
  saving: boolean;
};

export default function ProfileEditModal({
  open,
  onClose,
  copy,
  language,
  mode = 'full',
  form,
  onChange,
  onSave,
  saving,
}: ProfileEditModalProps) {
  const isExamGoal = mode === 'examGoal';
  const titleId = isExamGoal ? 'edit-exam-goal-title' : 'edit-profile-title';

  return (
    <ModalPortal
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      zClassName="z-50"
      panelClassName={`rounded-2xl bg-white p-4 shadow-xl min-[360px]:p-6 ${isExamGoal ? 'max-w-md' : 'max-w-lg'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 id={titleId} className="text-base font-bold text-slate-900 min-[360px]:text-lg">
          {isExamGoal ? copy.changeExamGoalTitle : copy.editProfileTitle}
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
      <div className="mt-3 space-y-3 min-[360px]:mt-4">
        {!isExamGoal ? (
          <>
            <label className="block text-xs font-medium text-slate-700 min-[360px]:text-sm">
              {copy.bio}
              <textarea
                value={form.bio}
                onChange={(e) => onChange('bio', e.target.value)}
                rows={3}
                className="mt-1 w-full min-w-0 rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-brand min-[360px]:rounded-xl min-[360px]:px-3 min-[360px]:text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-slate-700 min-[360px]:text-sm">
              {copy.country}
              <input
                value={form.country}
                onChange={(e) => onChange('country', e.target.value)}
                className="mt-1 w-full min-w-0 rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-brand min-[360px]:rounded-xl min-[360px]:px-3 min-[360px]:text-sm"
              />
            </label>
          </>
        ) : null}
        <div className="block text-xs font-medium text-slate-700 min-[360px]:text-sm">
          {copy.targetExam}
          <TargetExamPickerField
            value={form.target_exam}
            onChange={(next) => onChange('target_exam', next)}
            language={language}
            chooseExamLabel={copy.chooseExam}
            otherExamLabel={copy.otherExam}
            otherPlaceholder={copy.otherExamPlaceholder}
            loadErrorLabel={copy.examsLoadError}
            searchPlaceholder={copy.searchExams}
            noResultsLabel={copy.noExamsFound}
            listClassName={isExamGoal ? 'max-h-52' : 'max-h-64 sm:max-h-80'}
          />
        </div>
        <label className="block text-xs font-medium text-slate-700 min-[360px]:text-sm">
          {copy.examDateLabel}
          <input
            type="date"
            value={form.exam_date}
            onChange={(e) => onChange('exam_date', e.target.value)}
            className="mt-1 w-full min-w-0 rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-brand min-[360px]:rounded-xl min-[360px]:px-3 min-[360px]:text-sm"
          />
        </label>
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={onSave}
        className="mt-4 w-full min-h-[44px] rounded-lg bg-brand py-2.5 text-xs font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-60 min-[360px]:mt-5 min-[360px]:rounded-xl min-[360px]:text-sm"
      >
        {saving ? copy.saving : copy.saveChanges}
      </button>
    </ModalPortal>
  );
}
