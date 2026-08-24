import { BarChart3, BookOpen, Brain, Calculator, Globe2, Languages, Landmark, Monitor } from 'lucide-react';

export default function SscCglNodeIcon({ code, className = 'h-6 w-6' }: { code: string; className?: string }) {
  const value = code.toUpperCase();
  const Icon = value.includes('REASON') || value.includes('INTELLIGENCE')
    ? Brain
    : value.includes('AWARENESS') || value.includes('GEOGRAPH')
      ? Globe2
      : value.includes('QUANT') || value.includes('MATH')
        ? Calculator
        : value.includes('ENGLISH') || value.includes('LANGUAGE')
          ? Languages
          : value.includes('COMPUTER')
            ? Monitor
            : value.includes('STATISTIC')
              ? BarChart3
              : value.includes('FINANCE') || value.includes('ECONOM')
                ? Landmark
                : BookOpen;
  return <Icon className={className} aria-hidden="true" />;
}
