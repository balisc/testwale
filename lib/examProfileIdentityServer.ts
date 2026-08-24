import 'server-only';

import { unstable_cache } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { LocalizedText } from '@/types/polity';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ExamProfileRow = {
  id: string;
  code: string;
  slug: string;
  title: unknown;
  short_name: string | null;
  family_code: string | null;
  legacy_exam_tag: string | null;
  scope_status: string | null;
  is_selectable: boolean | null;
  is_active: boolean;
};

export type ActiveExamProfileIdentity = {
  examProfileId: string;
  contentExamId: string;
  examCode: string;
  examSlug: string;
  shortName: string | null;
  officialTitle: LocalizedText;
  questionTag: string;
  examTitle: LocalizedText;
};

function localizedText(value: unknown): LocalizedText {
  if (typeof value === 'string') return { en: value, hi: value };
  if (!value || typeof value !== 'object') return {};
  const row = value as Record<string, unknown>;
  return {
    en: typeof row.en === 'string' ? row.en : undefined,
    hi: typeof row.hi === 'string' ? row.hi : undefined,
  };
}

function displayTitle(shortName: string | null, title: LocalizedText): LocalizedText {
  const join = (value: string | undefined) => [shortName, value].filter(Boolean).join(' — ');
  return {
    en: join(title.en) || shortName || title.hi,
    hi: join(title.hi) || shortName || title.en,
  };
}

async function fetchActiveExamProfileIdentity(input: {
  examProfileId: string | null;
  examCode: string | null;
}): Promise<ActiveExamProfileIdentity | null> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('exam_profile_identity_not_configured');

  let query = admin
    .from('exam_profiles')
    .select(
      'id, code, slug, title, short_name, family_code, legacy_exam_tag, scope_status, is_selectable, is_active',
    )
    .eq('is_active', true);
  if (input.examProfileId) query = query.eq('id', input.examProfileId);
  if (input.examCode) query = query.eq('code', input.examCode);

  const profileResult = await query.limit(2);
  if (profileResult.error) {
    throw new Error(
      `exam_profile_identity_failed:${profileResult.error.code ?? 'database_error'}:${profileResult.error.message}`,
    );
  }
  if (profileResult.data.length !== 1) return null;

  const profile = profileResult.data[0] as ExamProfileRow;
  if (
    profile.is_selectable !== true
    || profile.scope_status !== 'scope_ready'
    || !profile.legacy_exam_tag
  ) return null;

  const [contentExamResult, versionResult] = await Promise.all([
    admin
      .from('exams')
      .select('id, code')
      .eq('code', profile.legacy_exam_tag)
      .eq('is_active', true)
      .limit(2),
    admin
      .from('exam_syllabus_versions')
      .select('id')
      .eq('exam_profile_id', profile.id)
      .eq('publication_status', 'published')
      .eq('is_current', true)
      .limit(2),
  ]);
  if (contentExamResult.error) {
    throw new Error(
      `exam_profile_content_exam_failed:${contentExamResult.error.code ?? 'database_error'}:${contentExamResult.error.message}`,
    );
  }
  if (versionResult.error) {
    throw new Error(
      `exam_profile_version_failed:${versionResult.error.code ?? 'database_error'}:${versionResult.error.message}`,
    );
  }
  if (contentExamResult.data.length !== 1 || versionResult.data.length !== 1) return null;

  const contentExam = contentExamResult.data[0]!;
  const officialTitle = localizedText(profile.title);
  return {
    examProfileId: profile.id,
    contentExamId: String(contentExam.id),
    examCode: profile.code,
    examSlug: profile.slug,
    shortName: profile.short_name,
    officialTitle,
    questionTag: String(contentExam.code || profile.family_code || profile.code),
    examTitle: displayTitle(profile.short_name, officialTitle),
  };
}

export function getActiveExamProfileIdentity(input: {
  examProfileId?: string | null;
  examCode?: string | null;
}): Promise<ActiveExamProfileIdentity | null> {
  const profileId = input.examProfileId?.trim() || null;
  const examCode = input.examCode?.trim().toUpperCase() || null;
  if ((!profileId && !examCode) || (profileId && !UUID_PATTERN.test(profileId))) {
    return Promise.resolve(null);
  }

  return unstable_cache(
    () => fetchActiveExamProfileIdentity({ examProfileId: profileId, examCode }),
    ['active-exam-profile-identity-v1', profileId ?? 'none', examCode ?? 'none'],
    { revalidate: 300, tags: ['exam-profile-identity'] },
  )();
}
