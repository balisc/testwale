import type { Metadata } from 'next';

export const SITE_NAME = 'Questionwale';
export const DEFAULT_DESCRIPTION =
  'Questionwale exam prep and practice engine. Solve MCQs, topic quizzes, and previous-year questions to boost your competitive exam readiness.';
export const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://questionwale.com').replace(/\/$/, '');
export const DEFAULT_OG_IMAGE = '/logo/questionwale_logo.webp';

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

function baseSocialMetadata(title: string, description: string, path = '/', type: 'website' | 'article' = 'website'): Metadata {
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
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(BASE_URL),
  ...canonical('/'),
  openGraph: {
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    type: 'website',
    url: BASE_URL,
    siteName: SITE_NAME,
    images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE), alt: `${SITE_NAME} exam practice` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [absoluteUrl(DEFAULT_OG_IMAGE)],
  },
  robots: {
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

export function buildSubjectMetadata(subjectLabel: string, subjectPath?: string): Metadata {
  const title = `${subjectLabel} Topics`;
  const description = `Browse ${subjectLabel} topics, practice curated questions, and improve your competitive exam skills on ${SITE_NAME}.`;
  const path = subjectPath ?? `/${subjectLabel.toLowerCase().replace(/\s+/g, '-')}`;

  return {
    title,
    description,
    ...canonical(path),
    ...baseSocialMetadata(title, description, path),
  };
}

export function buildTopicMetadata(subjectLabel: string, topicName: string, topicPath?: string): Metadata {
  const title = `${topicName} Practice Questions | ${subjectLabel}`;
  const description = `Practice ${topicName} questions for ${subjectLabel} on ${SITE_NAME} and strengthen your exam preparation with real MCQs.`;
  const path = topicPath ?? `/${subjectLabel.toLowerCase().replace(/\s+/g, '-')}/topics/${topicName.toLowerCase().replace(/\s+/g, '-')}`;

  return {
    title,
    description,
    ...canonical(path),
    ...baseSocialMetadata(title, description, path, 'article'),
  };
}

export function buildExamMetadata(examName: string, examPath?: string): Metadata {
  const title = `${examName} Previous Year Questions`;
  const description = `Practice previous-year ${examName} questions on ${SITE_NAME} to improve speed, accuracy, and exam confidence.`;
  const path = examPath ?? '/subjects';

  return {
    title,
    description,
    ...canonical(path),
    ...baseSocialMetadata(title, description, path),
  };
}

export function buildQuizMetadata(examName: string, topicName: string, quizPath?: string): Metadata {
  const title = `${topicName} Quiz | ${examName}`;
  const description = `Take a quick ${topicName} quiz for ${examName} on ${SITE_NAME} and validate your exam readiness with realistic practice.`;
  const path = quizPath ?? '/subjects';

  return {
    title,
    description,
    ...canonical(path),
    ...baseSocialMetadata(title, description, path, 'article'),
  };
}
