import type { Metadata } from 'next';

const SITE_NAME = 'Questionwale';
const DEFAULT_DESCRIPTION =
  'Questionwale exam prep and practice engine. Solve MCQs, topic quizzes, and previous-year questions to boost your competitive exam readiness.';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://questionwale.com';

export const siteMetadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    type: 'website',
    url: BASE_URL,
    siteName: SITE_NAME,
    images: [{ url: `${BASE_URL}/og-image.png`, alt: `${SITE_NAME} exam practice` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [`${BASE_URL}/og-image.png`],
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

export function buildSubjectMetadata(subjectLabel: string): Metadata {
  const title = `${subjectLabel} Topics | ${SITE_NAME}`;
  const description = `Browse ${subjectLabel} topics, practice curated questions, and improve your competitive exam skills on ${SITE_NAME}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: SITE_NAME,
    },
  };
}

export function buildTopicMetadata(subjectLabel: string, topicName: string): Metadata {
  const title = `${topicName} Practice Questions | ${subjectLabel} | ${SITE_NAME}`;
  const description = `Practice ${topicName} questions for ${subjectLabel} on ${SITE_NAME} and strengthen your exam preparation with real MCQs.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: SITE_NAME,
    },
  };
}

export function buildExamMetadata(examName: string): Metadata {
  const title = `${examName} Previous Year Questions | ${SITE_NAME}`;
  const description = `Practice previous-year ${examName} questions on ${SITE_NAME} to improve speed, accuracy, and exam confidence.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: SITE_NAME,
    },
  };
}

export function buildQuizMetadata(examName: string, topicName: string): Metadata {
  const title = `${topicName} Quiz | ${examName} | ${SITE_NAME}`;
  const description = `Take a quick ${topicName} quiz for ${examName} on ${SITE_NAME} and validate your exam readiness with realistic practice.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: SITE_NAME,
    },
  };
}
