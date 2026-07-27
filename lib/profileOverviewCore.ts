/** Minimum unique first attempts before showing exam readiness score. */
export const READINESS_MIN_UNIQUE_QUESTIONS = 10;

const IST = 'Asia/Kolkata';

export type UserAttemptSnapshot = {
  question_id: string;
  is_correct: boolean;
  attempted_at: string;
  time_taken_seconds: number | null;
  subject_id: string | null;
  topic_id: string | null;
  subtopic_id: string | null;
};

export type ProfileOverviewMetrics = {
  questions: number;
  accuracy_percent: number;
  streak_days: number;
  study_time_seconds: number;
};

export type WeeklyActivityDay = {
  key: string;
  label: string;
  count: number;
};

export type ReadinessBreakdown = {
  overall: number;
  label: string;
  locked: boolean;
  coverage: number;
  accuracy: number;
  consistency: number;
};

export type GroupedActivityItem = {
  title: string;
  correct: number;
  total: number;
  created_at: string;
  href: string | null;
};

export type RecentAttemptLike = {
  is_correct: boolean;
  attempted_at: string;
  topic_title?: string | { en?: string; hi?: string } | null;
  topic_slug?: string | null;
  subject_slug?: string | null;
};

export type ContinuePracticeInput = {
  recent_attempts?: RecentAttemptLike[];
  weaknesses: Array<{
    subject_slug?: string | null;
    topic_slug?: string | null;
  }>;
};

function readinessLabelFromScore(score: number): string {
  if (score >= 75) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 45) return 'Average';
  return 'Needs Work';
}

export function maskEmail(email: string): string {
  const trimmed = email.trim();
  if (!trimmed.includes('@')) return trimmed;

  const [local, domain] = trimmed.split('@');
  if (!local || !domain) return trimmed;

  const visible = local.slice(0, Math.min(2, local.length));
  const maskedLocal = `${visible}${'•'.repeat(Math.max(4, local.length - visible.length))}`;
  return `${maskedLocal}@${domain}`;
}

/** Profile completion from editable user-facing fields only. */
export function calcProfileCompletionPercent(profile: {
  bio: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  target_exam: string | null;
  exam_date: string | null;
}): number {
  const fields = [
    profile.bio?.trim(),
    profile.country?.trim(),
    profile.state?.trim(),
    profile.city?.trim(),
    profile.target_exam?.trim(),
    profile.exam_date?.trim(),
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

export function istDateKey(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: IST }).format(new Date(iso));
}

export function calcAccuracyPercent(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct * 1000) / total) / 10;
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** Consecutive IST calendar days with at least one first attempt, ending today or yesterday. */
export function calcStreakDays(dateKeys: string[]): number {
  if (dateKeys.length === 0) return 0;

  const unique = [...new Set(dateKeys)].sort();
  const today = istDateKey(new Date().toISOString());
  const yesterday = istDateKey(new Date(Date.now() - 86_400_000).toISOString());

  const latest = unique[unique.length - 1]!;
  if (latest !== today && latest !== yesterday) return 0;

  let streak = 1;
  for (let index = unique.length - 2; index >= 0; index -= 1) {
    const current = new Date(`${unique[index + 1]!}T12:00:00Z`).getTime();
    const prev = new Date(`${unique[index]!}T12:00:00Z`).getTime();
    const diffDays = Math.round((current - prev) / 86_400_000);
    if (diffDays !== 1) break;
    streak += 1;
  }

  return streak;
}

export function formatStudyTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours <= 0) return `${minutes}m`;
  if (minutes <= 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function buildOverviewMetricsFromAttempts(rows: UserAttemptSnapshot[]): ProfileOverviewMetrics {
  const total = rows.length;
  const correct = rows.filter((row) => row.is_correct).length;
  const dateKeys = rows.map((row) => istDateKey(row.attempted_at));
  const studyTime = rows.reduce((sum, row) => sum + (row.time_taken_seconds ?? 0), 0);

  return {
    questions: total,
    accuracy_percent: calcAccuracyPercent(correct, total),
    streak_days: calcStreakDays(dateKeys),
    study_time_seconds: studyTime,
  };
}

/** Monday-start week in IST from first-attempt timestamps. */
export function buildWeeklyActivity(rows: UserAttemptSnapshot[], now = new Date()): WeeklyActivityDay[] {
  const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: IST });
  const istNow = new Date(now.toLocaleString('en-US', { timeZone: IST }));
  const day = istNow.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(istNow);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(istNow.getDate() + mondayOffset);

  const counts = new Map<string, number>();
  for (const row of rows) {
    const attemptDate = new Date(new Date(row.attempted_at).toLocaleString('en-US', { timeZone: IST }));
    if (attemptDate < monday) continue;
    const key = istDateKey(row.attempted_at);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const key = istDateKey(date.toISOString());
    return {
      key,
      label: formatter.format(date),
      count: counts.get(key) ?? 0,
    };
  });
}

/**
 * Reuses the existing profile readiness formula:
 * overall = accuracy * 0.75 + min(25, study_days * 0.5)
 */
export function buildReadinessBreakdown(
  uniqueQuestions: number,
  accuracyPercent: number,
  studyDays: number,
): ReadinessBreakdown {
  const locked = uniqueQuestions < READINESS_MIN_UNIQUE_QUESTIONS;
  const accuracy = clampPercent(accuracyPercent);
  const consistency = clampPercent((Math.min(25, studyDays * 0.5) / 25) * 100);
  const coverage = clampPercent((uniqueQuestions / 50) * 100);
  const overall = locked
    ? 0
    : clampPercent(Math.round(accuracy * 0.75 + Math.min(25, studyDays * 0.5)));

  return {
    overall,
    label: readinessLabelFromScore(overall),
    locked,
    coverage,
    accuracy,
    consistency,
  };
}

export function buildPracticeHref(input: {
  subject_slug?: string | null;
  topic_slug?: string | null;
  subtopic_slug?: string | null;
}): string | null {
  const subject = input.subject_slug?.trim();
  const topic = input.topic_slug?.trim();
  const subtopic = input.subtopic_slug?.trim();
  if (!subject) return null;
  if (subject && topic && subtopic) {
    return `/subjects/${subject}/${topic}/practice/${subtopic}`;
  }
  if (subject && topic) return `/subjects/${subject}/${topic}/practice`;
  return `/subjects/${subject}`;
}

export function pickContinuePracticeHref(data: ContinuePracticeInput): string {
  const recent = data.recent_attempts?.[0];
  if (recent?.subject_slug && recent.topic_slug) {
    const href = buildPracticeHref({
      subject_slug: recent.subject_slug,
      topic_slug: recent.topic_slug,
    });
    if (href) return href;
  }

  const weakness = data.weaknesses.find((item) => item.subject_slug && item.topic_slug);
  if (weakness?.subject_slug && weakness.topic_slug) {
    const href = buildPracticeHref({
      subject_slug: weakness.subject_slug,
      topic_slug: weakness.topic_slug,
    });
    if (href) return href;
  }

  return '/subjects';
}

export function groupRecentActivity(attempts: RecentAttemptLike[], limit = 2): GroupedActivityItem[] {
  const groups = new Map<string, GroupedActivityItem>();

  for (const attempt of attempts) {
    const title =
      typeof attempt.topic_title === 'string'
        ? attempt.topic_title
        : attempt.topic_title?.en || 'Practice';
    const key = `${title}:${attempt.topic_slug ?? 'unknown'}`;
    const existing = groups.get(key);
    const href =
      attempt.subject_slug && attempt.topic_slug
        ? buildPracticeHref({ subject_slug: attempt.subject_slug, topic_slug: attempt.topic_slug })
        : null;

    if (!existing) {
      groups.set(key, {
        title,
        correct: attempt.is_correct ? 1 : 0,
        total: 1,
        created_at: attempt.attempted_at,
        href,
      });
      continue;
    }

    existing.total += 1;
    if (attempt.is_correct) existing.correct += 1;
    if (new Date(attempt.attempted_at).getTime() > new Date(existing.created_at).getTime()) {
      existing.created_at = attempt.attempted_at;
    }
  }

  return [...groups.values()]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export function readinessStageLabel(scoreLabel: string, language: 'en' | 'hi' = 'en'): string {
  const en: Record<string, string> = {
    'Needs Work': 'Foundation stage',
    Average: 'Building stage',
    Good: 'Progressing stage',
    Excellent: 'Exam ready stage',
  };
  const hi: Record<string, string> = {
    'Needs Work': 'आधार चरण',
    Average: 'विकास चरण',
    Good: 'प्रगति चरण',
    Excellent: 'परीक्षा के लिए तैयार',
  };
  const map = language === 'hi' ? hi : en;
  return map[scoreLabel] ?? scoreLabel;
}

export function formatRelativeTime(value: string, language: 'en' | 'hi' = 'en'): string {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return language === 'hi' ? 'अभी' : 'Just now';
  if (mins < 60) {
    return language === 'hi'
      ? `${mins} मिनट पहले`
      : `${mins} min${mins > 1 ? 's' : ''} ago`;
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return language === 'hi'
      ? `${hours} घंट${hours > 1 ? 'े' : 'ा'} पहले`
      : `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) return language === 'hi' ? 'कल' : 'Yesterday';
  if (days < 7) {
    return language === 'hi' ? `${days} दिन पहले` : `${days} days ago`;
  }
  try {
    return new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: IST,
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export const READINESS_FORMULA_EXPLANATION = {
  en: 'Exam readiness combines your accuracy (75% weight) with study consistency from active days (up to 25 points). Coverage reflects unique questions attempted. Complete at least 10 unique questions to unlock your score.',
  hi: 'परीक्षा तैयारी आपकी सटीकता (75% भार) और सक्रिय दिनों की निरंतरता (अधिकतम 25 अंक) को मिलाती है। कवरेज में अद्वितीय प्रश्न शामिल हैं। स्कोर अनलॉक करने के लिए कम से कम 10 अद्वितीय प्रश्न पूरे करें।',
} as const;

export function weeklyQuestionsTotal(days: WeeklyActivityDay[]): number {
  return days.reduce((sum, day) => sum + day.count, 0);
}

export function formatJoinedMonthYear(value: string, language: 'en' | 'hi' = 'en'): string {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-IN', {
      month: 'long',
      year: 'numeric',
      timeZone: IST,
    }).format(new Date(value));
  } catch {
    return value;
  }
}
