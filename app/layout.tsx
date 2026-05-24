import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '../lib/LanguageContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta-sans', display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'Questionwale',
    template: '%s | Questionwale',
  },
  description: 'Questionwale exam prep and practice engine. Solve MCQs, topic quizzes, and previous-year questions to boost your competitive exam readiness.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://questionwale.com'),
  openGraph: {
    title: 'Questionwale',
    description: 'Questionwale exam prep and practice engine. Solve MCQs, topic quizzes, and previous-year questions to boost your competitive exam readiness.',
    type: 'website',
    siteName: 'Questionwale',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://questionwale.com'}/og-image.png`,
        alt: 'Questionwale exam practice',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Questionwale',
    description: 'Questionwale exam prep and practice engine. Solve MCQs, topic quizzes, and previous-year questions to boost your competitive exam readiness.',
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${plusJakarta.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased font-body">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
