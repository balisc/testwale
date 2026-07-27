import supabase from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { buildQuestionUrl } from '@/lib/slugGenerator';
import {
  buildProfileSavedData,
  type SavedBookmarkRow,
  type SavedFirstAttemptRow,
  type SavedNoteRow,
  type SavedRetryRow,
} from '@/lib/profileSavedCore';
import type { ProfileSavedData } from '@/lib/profileSavedTypes';

type LocalizedField = { en?: string; hi?: string } | string | null;

type FirstAttemptQueryRow = {
  question_id: string;
  is_correct: boolean;
  attempted_at: string;
  subject_id: string | null;
  topic_id: string | null;
  subjects: { slug?: string; title?: LocalizedField } | null;
  topics: { slug?: string; title?: LocalizedField } | null;
};

type RetryQueryRow = {
  question_id: string;
  is_correct: boolean;
  attempted_at: string;
};

type BookmarkQueryRow = {
  id: string;
  question_id: string;
  created_at: string;
  questions: {
    id: string;
    question_text?: LocalizedField;
    topics?: { slug?: string; title?: LocalizedField } | null;
    subtopics?: { title?: LocalizedField } | null;
    subjects?: { slug?: string; title?: LocalizedField } | null;
  } | null;
};

type NoteQueryRow = {
  id: string;
  title: string;
  note_text: string;
  created_at: string;
  updated_at: string;
  topic_id: string | null;
  question_id: string | null;
  topics: {
    slug?: string;
    title?: LocalizedField;
    subjects?: { slug?: string; title?: LocalizedField } | null;
  } | null;
  questions: {
    id: string;
    question_text?: LocalizedField;
    topics?: { slug?: string; title?: LocalizedField } | null;
    subtopics?: { title?: LocalizedField } | null;
    subjects?: { slug?: string; title?: LocalizedField } | null;
  } | null;
};

function readEnText(value: LocalizedField): string | null {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  return value.en ?? null;
}

function buildQuestionHref(
  question: {
    id: string;
    question_text?: LocalizedField;
  } | null,
  topic: { slug?: string; title?: LocalizedField } | null,
  subtopic: { title?: LocalizedField } | null,
): string | null {
  if (!question?.id) return null;
  const topicTitle = readEnText(topic?.title ?? null) ?? topic?.slug ?? '';
  const questionText = readEnText(question.question_text ?? null) ?? 'Question';
  if (!topicTitle) return null;
  return buildQuestionUrl(topicTitle, question.id, questionText, {
    language: 'en',
    subtopic: readEnText(subtopic?.title ?? null),
  });
}

async function fetchFirstAttempts(userId: string): Promise<SavedFirstAttemptRow[]> {
  const client = getSupabaseAdmin() ?? supabase;
  const { data, error } = await client
    .from('user_attempts')
    .select(
      `
      question_id,
      is_correct,
      attempted_at,
      subject_id,
      topic_id,
      subjects:subject_id ( slug, title ),
      topics:topic_id ( slug, title )
    `,
    )
    .eq('user_id', userId)
    .order('attempted_at', { ascending: false });

  if (error) {
    console.error('[profileSaved/fetchFirstAttempts]', error);
    return [];
  }

  return ((data ?? []) as FirstAttemptQueryRow[]).map((row) => {
    const subject = row.subjects;
    const topic = row.topics;
    return {
      question_id: String(row.question_id),
      is_correct: Boolean(row.is_correct),
      attempted_at: String(row.attempted_at),
      subject_id: row.subject_id != null ? String(row.subject_id) : null,
      topic_id: row.topic_id != null ? String(row.topic_id) : null,
      topic_title: readEnText(topic?.title ?? null),
      topic_slug: topic?.slug ?? null,
      subject_slug: subject?.slug ?? null,
      subject_title_en: readEnText(subject?.title ?? null),
    } satisfies SavedFirstAttemptRow;
  });
}

async function fetchRetries(userId: string): Promise<SavedRetryRow[]> {
  const client = getSupabaseAdmin() ?? supabase;
  const { data, error } = await client
    .from('user_question_attempts')
    .select('question_id, is_correct, attempted_at')
    .eq('user_id', userId)
    .order('attempted_at', { ascending: true });

  if (error) {
    console.error('[profileSaved/fetchRetries]', error);
    return [];
  }

  return ((data ?? []) as RetryQueryRow[]).map((row) => ({
    question_id: String(row.question_id),
    is_correct: Boolean(row.is_correct),
    attempted_at: String(row.attempted_at),
  }));
}

async function fetchBookmarks(userId: string): Promise<SavedBookmarkRow[]> {
  const client = getSupabaseAdmin() ?? supabase;
  const { data, error } = await client
    .from('user_bookmarks')
    .select(
      `
      id,
      question_id,
      created_at,
      questions:question_id (
        id,
        question_text,
        topics:topic_id ( slug, title ),
        subtopics:subtopic_id ( title ),
        subjects:subject_id ( slug, title )
      )
    `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('[profileSaved/fetchBookmarks]', error);
    return [];
  }

  return ((data ?? []) as BookmarkQueryRow[]).map((row) => {
    const question = row.questions;
    const topic = question?.topics ?? null;
    const subject = question?.subjects ?? null;
    const questionText = readEnText(question?.question_text ?? null);

    return {
      id: String(row.id),
      question_id: String(row.question_id),
      created_at: String(row.created_at),
      question_title_en: questionText,
      topic_title: readEnText(topic?.title ?? null),
      topic_slug: topic?.slug ?? null,
      subject_slug: subject?.slug ?? null,
      subject_title_en: readEnText(subject?.title ?? null),
      question_href: buildQuestionHref(
        question,
        topic,
        question?.subtopics ?? null,
      ),
    } satisfies SavedBookmarkRow;
  });
}

async function fetchNotes(userId: string): Promise<SavedNoteRow[]> {
  const client = getSupabaseAdmin() ?? supabase;
  const { data, error } = await client
    .from('user_notes')
    .select(
      `
      id,
      title,
      note_text,
      created_at,
      updated_at,
      topic_id,
      question_id,
      topics:topic_id ( slug, title, subjects:subject_id ( slug, title ) ),
      questions:question_id (
        id,
        question_text,
        topics:topic_id ( slug, title ),
        subtopics:subtopic_id ( title ),
        subjects:subject_id ( slug, title )
      )
    `,
    )
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('[profileSaved/fetchNotes]', error);
    return [];
  }

  return ((data ?? []) as NoteQueryRow[]).map((row) => {
    const topicJoin = row.topics;
    const question = row.questions;

    const topic = topicJoin ?? question?.topics ?? null;
    const subject = topicJoin?.subjects ?? question?.subjects ?? null;

    return {
      id: String(row.id),
      title: String(row.title ?? 'Untitled note'),
      note_text: String(row.note_text ?? ''),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
      topic_title: readEnText(topic?.title ?? null),
      topic_slug: topic?.slug ?? null,
      subject_slug: subject?.slug ?? null,
      subject_title_en: readEnText(subject?.title ?? null),
      question_href: question
        ? buildQuestionHref(question, question.topics ?? null, question.subtopics ?? null)
        : null,
    } satisfies SavedNoteRow;
  });
}

async function fetchReportedCount(userId: string): Promise<number> {
  const client = getSupabaseAdmin() ?? supabase;
  const { count, error } = await client
    .from('question_reports')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('[profileSaved/fetchReportedCount]', error);
    return 0;
  }

  return count ?? 0;
}

export async function getUserProfileSaved(userId: string): Promise<ProfileSavedData> {
  const [firstAttempts, retries, bookmarks, notes, reportedQuestions] = await Promise.all([
    fetchFirstAttempts(userId),
    fetchRetries(userId),
    fetchBookmarks(userId),
    fetchNotes(userId),
    fetchReportedCount(userId),
  ]);

  return buildProfileSavedData({
    firstAttempts,
    retries,
    bookmarks,
    notes,
    reportedQuestions,
  });
}
