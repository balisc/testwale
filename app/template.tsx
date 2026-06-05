'use client';

import { ReactNode } from 'react';

interface TemplateProps {
  children: ReactNode;
}

export default function Template({ children }: TemplateProps) {
  return <div className="min-h-screen animate-fade-up-in">{children}</div>;
}
