'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import type { ProfilePageData } from '@/lib/profileAnalytics';
import { getProfileCopy } from './profileCopy';
import ProfileTabs from './components/ProfileTabs';
import { profileTabRedirectPath, type ProfileTabId } from '@/lib/profileTabAccess';
import ProfileEditModal from './components/ProfileEditModal';
import { needsProfileOnboarding } from '@/lib/profileOnboarding';

type ProfileShellProps = {
  activeTab: ProfileTabId;
  title: string;
  subtitle: string;
  children: (ctx: {
    profileData: ProfilePageData | null;
    fetching: boolean;
    openEdit: () => void;
    openTargetExam: () => void;
  }) => ReactNode;
};

export default function ProfileShell({ activeTab, title, subtitle, children }: ProfileShellProps) {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const copy = useMemo(() => getProfileCopy(language), [language]);

  const [data, setData] = useState<ProfilePageData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<'full' | 'examGoal'>('full');
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ bio: '', country: '', target_exam: '', exam_date: '' });
  const [sessionChecked, setSessionChecked] = useState(false);
  const loadedForUserRef = useRef<string | null>(null);

  const loadProfile = useCallback(async () => {
    setFetching(true);
    setError(false);
    try {
      const res = await fetch('/api/profile', { cache: 'no-store', credentials: 'include' });
      if (res.status === 401) {
        router.replace(`/login?redirect=${encodeURIComponent(profileTabRedirectPath(activeTab))}`);
        return;
      }
      if (!res.ok) throw new Error('failed');
      const json = (await res.json()) as ProfilePageData;
      setData(json);
      setEditForm({
        bio: json.profile.bio ?? '',
        country: json.profile.country ?? '',
        target_exam: json.profile.target_exam ?? '',
        exam_date: json.profile.exam_date?.slice(0, 10) ?? '',
      });
    } catch {
      setError(true);
    } finally {
      setFetching(false);
    }
  }, [router, activeTab]);

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      setSessionChecked(true);
      if (loadedForUserRef.current === user.id) return;
      loadedForUserRef.current = user.id;
      void loadProfile();
      return;
    }

    loadedForUserRef.current = null;
    if (sessionChecked) return;
    void refreshUser().finally(() => setSessionChecked(true));
  }, [user, authLoading, sessionChecked, refreshUser, loadProfile]);

  useEffect(() => {
    if (authLoading || !sessionChecked || user) return;
    router.replace(`/login?redirect=${encodeURIComponent(profileTabRedirectPath(activeTab))}`);
  }, [authLoading, sessionChecked, user, router, activeTab]);

  useEffect(() => {
    if (fetching || !data || authLoading) return;
    if (needsProfileOnboarding(data.profile)) {
      router.replace('/onboarding?redirect=%2Fprofile');
    }
  }, [data, fetching, authLoading, router]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error('save failed');
      const json = (await res.json()) as ProfilePageData;
      setData(json);
      setEditForm({
        bio: json.profile.bio ?? '',
        country: json.profile.country ?? '',
        target_exam: json.profile.target_exam ?? '',
        exam_date: json.profile.exam_date?.slice(0, 10) ?? '',
      });
      setEditOpen(false);
    } catch {
      /* keep modal open */
    } finally {
      setSaving(false);
    }
  };

  const openEdit = () => {
    setEditMode('full');
    setEditOpen(true);
  };
  const openTargetExam = () => {
    if (data && needsProfileOnboarding(data.profile)) {
      router.push('/onboarding?redirect=%2Fprofile');
      return;
    }
    setEditMode('examGoal');
    setEditOpen(true);
  };

  if (authLoading || (!user && !sessionChecked)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" aria-label="Loading" />
      </div>
    );
  }

  if (!user) return null;

  if (error && !data) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-lg px-4 py-20 text-center">
        <p className="text-sm text-red-600 sm:text-base">{copy.loadError}</p>
        <button
          type="button"
          onClick={() => void loadProfile()}
          className="mt-4 inline-flex min-h-[44px] items-center text-sm text-brand underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {copy.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1200px] overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">{subtitle}</p>
      </header>

      <ProfileTabs copy={copy} activeTab={activeTab} />

      <div role="tabpanel" className="mt-6 sm:mt-8">
        {children({ profileData: data, fetching, openEdit, openTargetExam })}
      </div>

      <ProfileEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        copy={copy}
        language={language}
        mode={editMode}
        form={editForm}
        onChange={(field, value) => setEditForm((prev) => ({ ...prev, [field]: value }))}
        onSave={() => void handleSaveProfile()}
        saving={saving}
      />
    </div>
  );
}
