import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Lora, Inter, Hind } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '../lib/LanguageContext';

const lora = Lora({ subsets: ['latin'], variable: '--font-lora', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const hind = Hind({ subsets: ['latin', 'devanagari'], weight: ['400', '500', '700'], variable: '--font-hind', display: 'swap' });

export const metadata: Metadata = {
  title: 'Testwale',
  description: 'Testwale exam prep and practice engine',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${lora.variable} ${hind.variable}`}>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body suppressHydrationWarning className={`min-h-screen bg-white text-gray-900 antialiased ${hind.className}`}>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
