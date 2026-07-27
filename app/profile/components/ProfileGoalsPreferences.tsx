'use client';

import {
  Bell,
  Calendar,
  Crown,
  Globe,
  Lock,
  Mail,
  User,
  FileText,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import type { ProfileGoalsData } from '@/lib/profileGoalsTypes';
import type { ProfileGoalsCopy } from '../profileGoalsCopy';

type Props = {
  copy: ProfileGoalsCopy;
  preferences: ProfileGoalsData['preferences'];
  onEditProfile: () => void;
};

export default function ProfileGoalsPreferences({ copy, preferences, onEditProfile }: Props) {
  const { language } = useLanguage();

  const joined = language === 'hi' ? preferences.joined_label_hi : preferences.joined_label_en;
  const membership =
    language === 'hi' ? preferences.membership_label_hi : preferences.membership_label_en;
  const languageLabel = language === 'hi' ? copy.hindi : copy.english;

  const rows = [
    { icon: User, label: copy.displayName, value: preferences.display_name },
    { icon: Mail, label: copy.email, value: preferences.email_masked },
    { icon: Globe, label: copy.preferredLanguage, value: languageLabel, hint: copy.languageClientNote },
    {
      icon: FileText,
      label: copy.targetExam,
      value: preferences.target_exam ?? copy.noExamSelected,
    },
    { icon: Crown, label: copy.membership, value: membership },
    { icon: Bell, label: copy.practiceReminders, value: copy.notAvailable },
    { icon: Lock, label: copy.profileVisibility, value: copy.profilesNotPublic },
    { icon: Calendar, label: copy.joined, value: joined },
  ];

  return (
    <section
      aria-label={copy.profilePreferences}
      className="rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{copy.profilePreferences}</h3>
        <button
          type="button"
          onClick={onEditProfile}
          className="inline-flex min-h-[44px] items-center rounded-lg border border-brand px-3 py-1.5 text-sm font-medium text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {copy.editProfile}
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="flex items-start gap-3 rounded-xl border border-[#F1F5F9] px-3 py-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs text-slate-500">{row.label}</p>
                <p className="break-words text-sm font-medium text-slate-800">{row.value}</p>
                {row.hint ? <p className="mt-0.5 text-[11px] text-slate-400">{row.hint}</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
