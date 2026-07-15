import type { Metadata } from 'next';
import { isNonProductionDeployment } from '@/lib/env';

export const SITE_NAME = 'QuestionWale';
export const DEFAULT_DESCRIPTION =
  'QuestionWale exam prep and practice engine. Solve MCQs, topic quizzes, and previous-year questions to boost your competitive exam readiness.';
export const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://questionwale.com').replace(/\/$/, '');
export const DEFAULT_OG_IMAGE = '/logo/questionwale_logo.webp';

const forceNoIndex = isNonProductionDeployment();

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function canonical(path = '/') {
  return {
    alternates: {
      canonical: absoluteUrl(path),
    },
  } satisfies Pick<Metadata, 'alternates'>;
}

function baseSocialMetadata(
  title: string,
  description: string,
  path = '/',
  type: 'website' | 'article' = 'website',
): Metadata {
  return {
    openGraph: {
      title,
      description,
      type,
      url: absoluteUrl(path),
      siteName: SITE_NAME,
      images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE), alt: `${SITE_NAME} exam practice` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteUrl(DEFAULT_OG_IMAGE)],
    },
  };
}

export const siteMetadata: Metadata = {
  title: {
    default: `${SITE_NAME} — Government Exam MCQ Practice in Hindi & English`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(BASE_URL),
  ...canonical('/'),
  openGraph: {
    title: `${SITE_NAME} — Government Exam MCQ Practice in Hindi & English`,
    description: DEFAULT_DESCRIPTION,
    type: 'website',
    url: BASE_URL,
    siteName: SITE_NAME,
    images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE), alt: `${SITE_NAME} exam practice` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Government Exam MCQ Practice in Hindi & English`,
    description: DEFAULT_DESCRIPTION,
    images: [absoluteUrl(DEFAULT_OG_IMAGE)],
  },
  robots: forceNoIndex
    ? { index: false, follow: false }
    : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
};

/** Page metadata without duplicating the site name suffix (root layout adds it via template). */
export function buildPageMetadata(options: {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
}): Metadata {
  const { title, description, path, type = 'website', noIndex = false } = options;
  const robotsNoIndex = noIndex || forceNoIndex;

  return {
    title,
    description,
    ...canonical(path),
    ...baseSocialMetadata(title, description, path, type),
    ...(robotsNoIndex ? { robots: { index: false, follow: !forceNoIndex } } : {}),
  };
}

export function buildSubjectMetadata(subjectLabel: string, subjectPath?: string): Metadata {
  const title = `${subjectLabel} Topics & MCQ Practice`;
  const description = `Browse ${subjectLabel} topics, practice curated questions, and improve your competitive exam skills on ${SITE_NAME}.`;
  const path = subjectPath ?? `/${subjectLabel.toLowerCase().replace(/\s+/g, '-')}`;

  return buildPageMetadata({ title, description, path });
}

export function buildTopicMetadata(subjectLabel: string, topicName: string, topicPath?: string): Metadata {
  const title = `${topicName} — ${subjectLabel} Practice`;
  const description = `Practice ${topicName} questions for ${subjectLabel} on ${SITE_NAME} and strengthen your exam preparation with real MCQs.`;
  const path =
    topicPath ??
    `/${subjectLabel.toLowerCase().replace(/\s+/g, '-')}/topics/${topicName.toLowerCase().replace(/\s+/g, '-')}`;

  return buildPageMetadata({ title, description, path, type: 'article' });
}

export function buildExamMetadata(examName: string, examPath?: string): Metadata {
  const title = `${examName} Previous Year Questions`;
  const description = `Practice previous-year ${examName} questions on ${SITE_NAME} to improve speed, accuracy, and exam confidence.`;
  const path = examPath ?? '/subjects';

  return buildPageMetadata({ title, description, path });
}

export function buildQuizMetadata(examName: string, topicName: string, quizPath?: string): Metadata {
  const title = `${topicName} Quiz — ${examName}`;
  const description = `Take a quick ${topicName} quiz for ${examName} on ${SITE_NAME} and validate your exam readiness with realistic practice.`;
  const path = quizPath ?? '/subjects';

  return buildPageMetadata({ title, description, path, type: 'article' });
}

export function buildCatalogSubjectMetadata(
  subjectTitle: string,
  subjectSlug: string,
  description?: string,
): Metadata {
  return buildPageMetadata({
    title: `${subjectTitle} — Topics & MCQ Practice`,
    description:
      description ||
      `Practice ${subjectTitle} topics with exam-wise MCQs for UPSC, SSC, Railway and State exams.`,
    path: `/subjects/${subjectSlug}`,
  });
}

export function buildCatalogTopicMetadata(
  topicTitle: string,
  subjectTitle: string,
  subjectSlug: string,
  topicSlug: string,
  description?: string,
): Metadata {
  return buildPageMetadata({
    title: `${topicTitle} — ${subjectTitle}`,
    description: description || `Practice ${topicTitle} subtopics with MCQs on ${SITE_NAME}.`,
    path: `/subjects/${subjectSlug}/${topicSlug}`,
  });
}

export function buildPracticeMetadata(
  topicTitle: string,
  subjectTitle: string,
  path: string,
): Metadata {
  return buildPageMetadata({
    title: `${topicTitle} — MCQ Practice`,
    description: `Mixed MCQ practice for ${topicTitle} in ${subjectTitle}.`,
    path,
    noIndex: true,
  });
}

/** Public revision/learning pages — indexable when content is substantial and published. */
export function buildCatalogRevisionMetadata(options: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return buildPageMetadata({
    title: options.title,
    description: options.description,
    path: options.path,
    type: 'article',
  });
}
