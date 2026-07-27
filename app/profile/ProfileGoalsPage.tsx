'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import type { ProfileGoalsData } from '@/lib/profileGoalsTypes';
import ProfileShell from './ProfileShell';
import { getProfileGoalsCopy } from './profileGoalsCopy';
import ProfileGoals from './components/ProfileGoals';
import ProfileGoalsSkeleton from './components/ProfileGoalsSkeleton';
import ProfileGoalsEditModal from './components/ProfileGoalsEditModal';

export default function ProfileGoalsPage() {
  const { language } = useLanguage();
  const copy = useMemo(() => getProfileGoalsCopy(language), [language]);
  const [goals, setGoals] = useState<ProfileGoalsData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [goalForm, setGoalForm] = useState({ daily_goal: 50, weekly_goal: 300, monthly_goal: 1500 });

  const loadGoals = useCallback(async () => {
    setFetching(true);
    setError(false);
    try {
      const res = await fetch('/api/profile/goals', { cache: 'no-store', credentials: 'include' });
      if (!res.ok) throw new Error('failed');
      const json = (await res.json()) as ProfileGoalsData;
      setGoals(json);
      setGoalForm({
        daily_goal: json.targets.daily_goal,
        weekly_goal: json.targets.weekly_goal,
        monthly_goal: json.targets.monthly_goal,
      });
    } catch {
      setError(true);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    void loadGoals();
  }, [loadGoals]);

  const handleSaveGoals = async () => {
    setSaving(true);
    setSaveError(false);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(goalForm),
      });
      if (!res.ok) throw new Error('failed');
      setEditOpen(false);
      await loadGoals();
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileShell activeTab="goals" title={copy.title} subtitle={copy.subtitle}>
      {({ openEdit, openTargetExam }) => (
        <>
          {error && !goals ? (
            <div className="py-12 text-center">
              <p className="text-sm text-red-600">{copy.loadError}</p>
              <button
                type="button"
                onClick={() => void loadGoals()}
                className="mt-4 inline-flex min-h-[44px] items-center text-sm text-brand underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {copy.retry}
              </button>
            </div>
          ) : fetching && !goals ? (
            <ProfileGoalsSkeleton />
          ) : goals ? (
            <ProfileGoals
              copy={copy}
              data={goals}
              language={language}
              onEditGoals={() => setEditOpen(true)}
              onUpdateTarget={openTargetExam}
              onEditProfile={openEdit}
            />
          ) : null}

          <ProfileGoalsEditModal
            open={editOpen}
            onClose={() => {
              setEditOpen(false);
              setSaveError(false);
              if (goals) {
                setGoalForm({
                  daily_goal: goals.targets.daily_goal,
                  weekly_goal: goals.targets.weekly_goal,
                  monthly_goal: goals.targets.monthly_goal,
                });
              }
            }}
            copy={copy}
            form={goalForm}
            onChange={(field, value) => setGoalForm((prev) => ({ ...prev, [field]: value }))}
            onSave={() => void handleSaveGoals()}
            saving={saving}
            error={saveError}
          />
        </>
      )}
    </ProfileShell>
  );
}
