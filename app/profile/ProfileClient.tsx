'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Loader2,
  MapPin,
  X,
  XCircle,
} from 'lucide-react';
import CircularGauge from './CircularGauge';
import ModalPortal from '@/components/ModalPortal';
import UserAvatar from '@/components/UserAvatar';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { getLocalizedText } from '@/lib/localizedText';
import type { ProfilePageData } from '@/lib/profileAnalytics';

function formatJoinedDate(value: string) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(
      new Date(value),
    );
  } catch {
    return value;
  }
}

function formatRelativeTime(value: string) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return formatJoinedDate(value);
}

export default function ProfileClient() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const [data, setData] = useState<ProfilePageData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ bio: '', country: '', target_exam: '' });
  const [sessionChecked, setSessionChecked] = useState(false);
  const loadedForUserRef = useRef<string | null>(null);

  const loadProfile = useCallback(async () => {
    setFetching(true);
    setError(false);
    try {
      const res = await fetch('/api/profile', { cache: 'no-store', credentials: 'include' });
      if (res.status === 401) {
        router.replace('/login?redirect=/profile');
        return;
      }
      if (!res.ok) throw new Error('failed');
      const json = (await res.json()) as ProfilePageData;
      setData(json);
      setEditForm({
        bio: json.profile.bio ?? '',
        country: json.profile.country ?? '',
        target_exam: json.profile.target_exam ?? '',
      });
    } catch {
      setError(true);
    } finally {
      setFetching(false);
    }
  }, [router]);

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
    router.replace('/login?redirect=/profile');
  }, [authLoading, sessionChecked, user, router]);

  const displayUser = useMemo(() => {
    const name =
      data?.user.full_name?.trim() ||
      user?.fullName?.trim() ||
      user?.email?.split('@')[0] ||
      'User';
    return {
      id: data?.user.id ?? user?.id ?? '',
      full_name: name,
      email: data?.user.email || user?.email || '',
      avatar_url: data?.user.avatar_url ?? user?.avatarUrl ?? null,
      provider: data?.user.provider || user?.provider || 'google',
      created_at: data?.user.created_at ?? '',
    };
  }, [data, user]);

  const profileSettings = data?.profile ?? {
    bio: null,
    country: null,
    state: null,
    city: null,
    target_exam: null,
    is_premium: false,
    daily_goal: 50,
    weekly_goal: 300,
    monthly_goal: 1500,
  };

  const overview = useMemo(
    () =>
      data?.overview ?? {
        total_attempts: 0,
        unique_questions_attempted: 0,
        correct_count: 0,
        wrong_count: 0,
        accuracy_percent: 0,
      },
    [data?.overview],
  );

  const wrongPct = useMemo(() => {
    if (!overview.total_attempts) return 0;
    return Math.round((overview.wrong_count * 1000) / overview.total_attempts) / 10;
  }, [overview]);

  const hasAttempts = overview.total_attempts > 0;

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
      setEditOpen(false);
    } catch {
      /* keep modal open */
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || (!user && !sessionChecked)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error && !data) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-lg px-2 py-12 text-center min-[360px]:px-4 min-[360px]:py-20">
        <p className="break-words text-sm text-red-600 min-[360px]:text-base">
          Could not load profile data. Please try again.
        </p>
        <button
          type="button"
          onClick={() => void loadProfile()}
          className="mt-4 text-sm text-brand underline min-[360px]:text-base"
        >
          Retry
        </button>
      </div>
    );
  }

  const u = displayUser;
  const profile = profileSettings;
  const rank = data?.rank ?? { overall: 0, total_users: 0, change_7d: 0 };
  const readiness = data?.readiness ?? { score: 0, label: 'Average' };
  const strengths = data?.strengths ?? [];
  const weaknesses = data?.weaknesses ?? [];
  const bySubject = data?.by_subject ?? [];
  const recentActivity = data?.recent_activity ?? [];
  const studyDays = data?.study_days ?? 0;
  const avgDailyAttempts = data?.avg_daily_attempts ?? 0;
  const goalsProgress = data?.goals_progress ?? { today: 0, week: 0, month: 0 };

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1280px] overflow-x-hidden px-2 py-4 min-[240px]:px-3 min-[360px]:px-4 min-[360px]:py-6 lg:px-6 lg:py-8">
      <div className="space-y-3 min-[360px]:space-y-4 lg:space-y-6">
        {/* Header row */}
        <div className="grid gap-3 min-[360px]:gap-4 lg:grid-cols-3">
          <div className="min-w-0 rounded-xl border border-[#EDE9FE] bg-white p-3 shadow-sm min-[360px]:rounded-2xl min-[360px]:p-5">
            <div className="flex min-w-0 flex-col items-center gap-3 text-center min-[360px]:flex-row min-[360px]:items-start min-[360px]:gap-4 min-[360px]:text-left">
              <UserAvatar
                name={u.full_name}
                id={u.id}
                email={u.email}
                imageUrl={u.avatar_url}
                className="h-14 w-14 shrink-0 rounded-xl ring-2 ring-[#EDE9FE] min-[240px]:h-16 min-[240px]:w-16 min-[360px]:h-20 min-[360px]:w-20 min-[360px]:rounded-2xl"
                textClassName="text-lg min-[240px]:text-xl min-[360px]:text-2xl"
              />
              <div className="min-w-0 w-full flex-1">
                <div className="flex flex-wrap items-center justify-center gap-1.5 min-[360px]:justify-start min-[360px]:gap-2">
                  <h1 className="max-w-full break-words text-base font-bold text-slate-900 min-[240px]:text-lg">
                    {u.full_name}
                  </h1>
                  {profile.is_premium && (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700 min-[360px]:px-2 min-[360px]:text-[10px]">
                      Premium
                    </span>
                  )}
                </div>
                {u.email && (
                  <p className="mt-1 break-all text-[11px] text-slate-500 min-[360px]:text-xs">{u.email}</p>
                )}
                {profile.target_exam && (
                  <p className="mt-1 break-words text-[11px] text-slate-500 min-[360px]:text-xs">
                    Target Exam: {profile.target_exam}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500 min-[360px]:justify-start min-[360px]:gap-3 min-[360px]:text-xs">
                  {profile.country && (
                    <span className="inline-flex max-w-full items-center gap-1 break-words">
                      <MapPin className="h-3 w-3 shrink-0" /> {profile.country}
                    </span>
                  )}
                  {u.created_at && (
                    <span className="inline-flex max-w-full items-center gap-1 break-words">
                      <Calendar className="h-3 w-3 shrink-0" /> Joined {formatJoinedDate(u.created_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {profile.bio && (
              <p className="mt-3 break-words text-xs leading-relaxed text-slate-600 min-[360px]:mt-4 min-[360px]:text-sm">
                {profile.bio}
              </p>
            )}
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#DDD6FE] px-3 py-2 text-xs font-semibold text-brand transition hover:bg-[#FAF5FF] min-[360px]:mt-4 min-[360px]:w-auto min-[360px]:rounded-xl min-[360px]:px-4 min-[360px]:py-2 min-[360px]:text-sm"
            >
              <Edit3 className="h-3.5 w-3.5 min-[360px]:h-4 min-[360px]:w-4" /> Edit Profile
            </button>
          </div>

          {rank.overall > 0 && (
            <div className="flex min-w-0 flex-col items-center justify-center rounded-xl border border-[#EDE9FE] bg-white p-3 shadow-sm min-[360px]:rounded-2xl min-[360px]:p-5">
              <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 min-[360px]:text-xs">
                Overall Rank
              </p>
              <div className="relative mt-2 flex h-16 w-16 items-center justify-center min-[360px]:h-24 min-[360px]:w-24">
                <Award className="absolute -left-1 h-5 w-5 text-amber-400 opacity-80 min-[360px]:-left-2 min-[360px]:h-8 min-[360px]:w-8" />
                <Award className="absolute -right-1 h-5 w-5 scale-x-[-1] text-amber-400 opacity-80 min-[360px]:-right-2 min-[360px]:h-8 min-[360px]:w-8" />
                <span className="text-2xl font-bold text-brand min-[360px]:text-3xl">#{rank.overall}</span>
              </div>
              {rank.total_users > 0 && (
                <p className="mt-1 text-center text-[10px] text-slate-500 min-[360px]:text-xs">
                  Out of {rank.total_users.toLocaleString()} students
                </p>
              )}
              {rank.change_7d !== 0 && (
                <p
                  className={`mt-1 text-center text-[10px] font-semibold min-[360px]:text-xs ${rank.change_7d > 0 ? 'text-emerald-600' : 'text-red-500'}`}
                >
                  {rank.change_7d > 0 ? '+' : ''}
                  {rank.change_7d} in last 7 days
                </p>
              )}
            </div>
          )}

          {hasAttempts && (
            <div className="flex min-w-0 flex-col items-center justify-center rounded-xl border border-[#EDE9FE] bg-white p-3 shadow-sm min-[360px]:rounded-2xl min-[360px]:p-5">
              <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 min-[360px]:text-xs">
                Readiness Score
              </p>
              <div className="mt-1 w-full max-w-[88px] min-[240px]:max-w-[96px] min-[360px]:mt-2 min-[360px]:max-w-[110px]">
                <CircularGauge value={readiness.score} size={110} stroke={9} sublabel={readiness.label} />
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        {fetching && !data ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-brand" aria-label="Loading profile stats" />
          </div>
        ) : (
        <>
        {!hasAttempts && (
          <div className="rounded-xl border border-[#EDE9FE] bg-[#FAF5FF] px-4 py-3 text-center text-sm text-slate-600 min-[360px]:rounded-2xl">
            {language === 'hi'
              ? 'अभी तक कोई अभ्यास डेटा नहीं है। विषय चुनकर प्रैक्टिस शुरू करें — आपकी प्रगति यहाँ दिखेगी।'
              : 'No practice data yet. Start practicing from Subjects — your progress will appear here.'}
          </div>
        )}
        <div className="grid grid-cols-1 gap-2 min-[280px]:grid-cols-2 min-[360px]:gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Total Attempts" value={overview.total_attempts.toLocaleString()} />
          <StatCard label="Unique Questions" value={overview.unique_questions_attempted.toLocaleString()} />
          <StatCard
            label="Correct Answers"
            value={overview.correct_count.toLocaleString()}
            sub={hasAttempts ? `${overview.accuracy_percent}% Accuracy` : undefined}
            accent="green"
          />
          <StatCard
            label="Wrong Answers"
            value={overview.wrong_count.toLocaleString()}
            sub={hasAttempts ? `${wrongPct}% Incorrect` : undefined}
            accent="red"
          />
          <StatCard label="Study Days" value={String(studyDays)} sub="Total Days" />
          <StatCard label="Avg. Daily Attempts" value={String(avgDailyAttempts)} sub="Per Day" />
        </div>

        {(data?.counts.bookmarks ?? 0) > 0 || (data?.counts.notes ?? 0) > 0 || (data?.counts.mistakes ?? 0) > 0 ? (
          <div className="grid grid-cols-1 gap-2 min-[280px]:grid-cols-3 min-[360px]:gap-3">
            {(data?.counts.mistakes ?? 0) > 0 && (
              <StatCard label="Mistake Questions" value={String(data!.counts.mistakes)} />
            )}
            {(data?.counts.bookmarks ?? 0) > 0 && (
              <StatCard label="Bookmarks" value={String(data!.counts.bookmarks)} />
            )}
            {(data?.counts.notes ?? 0) > 0 && (
              <StatCard label="Saved Notes" value={String(data!.counts.notes)} />
            )}
          </div>
        ) : null}

        <div className="grid gap-3 min-[360px]:gap-4 lg:grid-cols-3">
          <div className="min-w-0 rounded-xl border border-[#EDE9FE] bg-white p-3 shadow-sm min-[360px]:rounded-2xl min-[360px]:p-5">
            <h2 className="text-sm font-bold text-slate-900 min-[360px]:text-base">Strengths & Weaknesses</h2>
            <div className="mt-3 min-[360px]:mt-4">
              <p className="text-[10px] font-semibold uppercase text-emerald-600 min-[360px]:text-xs">Strong Areas</p>
              <div className="mt-2 flex flex-wrap gap-1.5 min-[360px]:gap-2">
                {strengths.length === 0 ? (
                  <p className="text-xs text-slate-400 min-[360px]:text-sm">No strong topics yet</p>
                ) : (
                  strengths.map((s, i) => (
                    <span
                      key={i}
                      className="max-w-full break-words rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 min-[360px]:px-3 min-[360px]:py-1 min-[360px]:text-xs"
                    >
                      {getLocalizedText(s.topic_title, language)}
                      <span className="ml-1 opacity-70">({s.accuracy_percent}%)</span>
                    </span>
                  ))
                )}
              </div>
            </div>
            <div className="mt-4 min-[360px]:mt-5">
              <p className="text-[10px] font-semibold uppercase text-red-500 min-[360px]:text-xs">Focus Topics</p>
              <div className="mt-2 flex flex-wrap gap-1.5 min-[360px]:gap-2">
                {weaknesses.length === 0 ? (
                  <p className="text-xs text-slate-400 min-[360px]:text-sm">No weak topics yet</p>
                ) : (
                  weaknesses.map((w, i) => (
                    <span
                      key={i}
                      className="max-w-full break-words rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 min-[360px]:px-3 min-[360px]:py-1 min-[360px]:text-xs"
                    >
                      {getLocalizedText(w.topic_title, language)}
                      <span className="ml-1 opacity-70">({w.accuracy_percent}%)</span>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="min-w-0 rounded-xl border border-[#EDE9FE] bg-white p-3 shadow-sm min-[360px]:rounded-2xl min-[360px]:p-5">
            <h2 className="text-sm font-bold text-slate-900 min-[360px]:text-base">Exam Readiness Breakdown</h2>
            {bySubject.length === 0 ? (
              <p className="mt-3 text-xs text-slate-400 min-[360px]:mt-4 min-[360px]:text-sm">No subject data yet</p>
            ) : (
              <div className="mt-3 flex flex-col items-center gap-3 min-[360px]:mt-4 min-[360px]:gap-4 sm:flex-row">
                {hasAttempts && (
                  <div className="w-full max-w-[80px] shrink-0 min-[240px]:max-w-[88px] min-[360px]:max-w-[100px]">
                    <CircularGauge value={readiness.score} size={100} stroke={8} />
                  </div>
                )}
                <div className="w-full min-w-0 flex-1 space-y-2.5 min-[360px]:space-y-3">
                  {bySubject.map((s, i) => (
                    <div key={i} className="min-w-0">
                      <div className="mb-1 flex items-start justify-between gap-2 text-[10px] min-[360px]:text-xs">
                        <span className="min-w-0 break-words font-medium text-slate-700">
                          {getLocalizedText(s.subject_title, language) || 'Subject'}
                        </span>
                        <span className="shrink-0 font-semibold text-brand">{s.accuracy_percent}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#EDE9FE] min-[360px]:h-2">
                        <div
                          className="h-full rounded-full bg-brand transition-all"
                          style={{ width: `${Math.min(100, s.accuracy_percent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 rounded-xl border border-[#EDE9FE] bg-white p-3 shadow-sm min-[360px]:rounded-2xl min-[360px]:p-5">
            <h2 className="text-sm font-bold text-slate-900 min-[360px]:text-base">Recent Activity</h2>
            <ul className="mt-3 space-y-2.5 min-[360px]:mt-4 min-[360px]:space-y-3">
              {recentActivity.length === 0 ? (
                <li className="text-xs text-slate-400 min-[360px]:text-sm">No activity yet</li>
              ) : (
                recentActivity.map((a, i) => (
                  <li
                    key={i}
                    className="flex min-w-0 gap-2 border-b border-slate-50 pb-2.5 last:border-0 last:pb-0 min-[360px]:gap-3 min-[360px]:pb-3"
                  >
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg min-[360px]:h-8 min-[360px]:w-8 ${
                        a.is_correct ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                      }`}
                    >
                      {a.is_correct ? (
                        <CheckCircle2 className="h-3.5 w-3.5 min-[360px]:h-4 min-[360px]:w-4" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 min-[360px]:h-4 min-[360px]:w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-800 min-[360px]:text-sm">
                        {a.activity_type === 'quiz_attempted' ? 'Quiz Attempted' : a.activity_type}
                      </p>
                      <p className="truncate text-[10px] text-slate-500 min-[360px]:text-xs">{a.title}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400 min-[360px]:text-[11px]">
                        <Clock className="h-3 w-3 shrink-0" /> {formatRelativeTime(a.created_at)}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {hasAttempts && (
          <div className="grid gap-2 min-[360px]:gap-4 sm:grid-cols-3">
            <GoalBar
              label="Today's Progress"
              current={goalsProgress.today}
              target={profile.daily_goal}
            />
            <GoalBar label="Weekly Goal" current={goalsProgress.week} target={profile.weekly_goal} />
            <GoalBar label="Monthly Goal" current={goalsProgress.month} target={profile.monthly_goal} />
          </div>
        )}
        </>
        )}
      </div>

      <ModalPortal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        labelledBy="edit-profile-title"
        zClassName="z-50"
        panelClassName="max-w-md rounded-2xl bg-white p-4 shadow-xl min-[360px]:p-6"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 id="edit-profile-title" className="text-base font-bold text-slate-900 min-[360px]:text-lg">
            Edit Profile
          </h3>
          <button type="button" onClick={() => setEditOpen(false)} aria-label="Close">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        <div className="mt-3 space-y-3 min-[360px]:mt-4">
          <label className="block text-xs font-medium text-slate-700 min-[360px]:text-sm">
            Bio
            <textarea
              value={editForm.bio}
              onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
              rows={3}
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-brand min-[360px]:rounded-xl min-[360px]:px-3 min-[360px]:text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-slate-700 min-[360px]:text-sm">
            Country
            <input
              value={editForm.country}
              onChange={(e) => setEditForm((f) => ({ ...f, country: e.target.value }))}
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-brand min-[360px]:rounded-xl min-[360px]:px-3 min-[360px]:text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-slate-700 min-[360px]:text-sm">
            Target Exam
            <input
              value={editForm.target_exam}
              onChange={(e) => setEditForm((f) => ({ ...f, target_exam: e.target.value }))}
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-brand min-[360px]:rounded-xl min-[360px]:px-3 min-[360px]:text-sm"
            />
          </label>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSaveProfile()}
          className="mt-4 w-full rounded-lg bg-brand py-2.5 text-xs font-semibold text-white hover:bg-[#6D28D9] disabled:opacity-60 min-[360px]:mt-5 min-[360px]:rounded-xl min-[360px]:text-sm"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </ModalPortal>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: 'green' | 'red';
}) {
  const subClass =
    accent === 'green' ? 'text-emerald-600' : accent === 'red' ? 'text-red-500' : 'text-slate-400';
  return (
    <div className="min-w-0 rounded-xl border border-[#EDE9FE] bg-white p-2.5 shadow-sm min-[360px]:rounded-2xl min-[360px]:p-4">
      <p className="break-words text-[9px] font-semibold uppercase tracking-wide text-slate-500 min-[240px]:text-[10px] min-[360px]:text-[11px]">
        {label}
      </p>
      <p className="mt-1.5 break-words text-lg font-bold text-slate-900 min-[360px]:mt-2 min-[360px]:text-xl">
        {value}
      </p>
      {sub && <p className={`mt-1 break-words text-[9px] font-medium min-[360px]:text-[11px] ${subClass}`}>{sub}</p>}
    </div>
  );
}

function GoalBar({ label, current, target }: { label: string; current: number; target: number }) {
  const pct = target > 0 ? Math.min(100, Math.round((current * 100) / target)) : 0;
  return (
    <div className="min-w-0 rounded-xl border border-[#EDE9FE] bg-white p-2.5 shadow-sm min-[360px]:rounded-2xl min-[360px]:p-4">
      <div className="flex flex-col gap-1 min-[280px]:flex-row min-[280px]:items-center min-[280px]:justify-between">
        <span className="break-words text-xs font-semibold text-slate-800 min-[360px]:text-sm">{label}</span>
        <span className="shrink-0 text-xs text-slate-500 min-[360px]:text-sm">
          {current}/{target}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EDE9FE] min-[360px]:h-2">
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
