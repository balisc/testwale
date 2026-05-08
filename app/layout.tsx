import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Lora, Inter } from 'next/font/google';
import { LanguageProvider } from './components/LanguageContext';
import './globals.css';

const lora = Lora({ subsets: ['latin'], variable: '--font-lora', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'Testwale',
  description: 'Testwale exam prep and practice engine',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body className="min-h-screen bg-navy text-slate-100 antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
