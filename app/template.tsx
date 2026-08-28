'use client';

import { ReactNode } from 'react';

interface TemplateProps {
  children: ReactNode;
}

export default function Template({ children }: TemplateProps) {
  return <div className="min-h-screen">{children}</div>;
}
