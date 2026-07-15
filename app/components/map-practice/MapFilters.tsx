'use client';

import type { MapDifficulty, MapScope } from '@/lib/mapPractice';

type Props = {
  scope: MapScope;
  difficulty: MapDifficulty | 'all';
  topic: string;
  subtopic: string;
  timerEnabled: boolean;
  topics: string[];
  subtopics: string[];
  onScopeChange: (scope: MapScope) => void;
  onDifficultyChange: (difficulty: MapDifficulty | 'all') => void;
  onTopicChange: (topic: string) => void;
  onSubtopicChange: (subtopic: string) => void;
  onTimerToggle: (enabled: boolean) => void;
};

const scopeOptions: Array<{ value: MapScope; label: string }> = [
  { value: 'india', label: 'India' },
  { value: 'world', label: 'World' },
  { value: 'current', label: 'Current Affairs' },
];

const difficultyOptions: Array<{ value: MapDifficulty | 'all'; label: string }> = [
  { value: 'all', label: 'All Difficulties' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export default function MapFilters({
  scope,
  difficulty,
  topic,
  subtopic,
  timerEnabled,
  topics,
  subtopics,
  onScopeChange,
  onDifficultyChange,
  onTopicChange,
  onSubtopicChange,
  onTimerToggle,
}: Props) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        {scopeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onScopeChange(option.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
              scope === option.value
                ? 'bg-indigo-600 text-white'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {option.label}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={timerEnabled}
            onChange={(event) => onTimerToggle(event.target.checked)}
            className="h-4 w-4 accent-indigo-600"
          />
          30s timer mode
        </label>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Topic</span>
          <select
            value={topic}
            onChange={(event) => onTopicChange(event.target.value)}
            className="rounded-md border border-slate-300 px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
          >
            <option value="">All Topics</option>
            {topics.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subtopic</span>
          <select
            value={subtopic}
            onChange={(event) => onSubtopicChange(event.target.value)}
            className="rounded-md border border-slate-300 px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
          >
            <option value="">All Subtopics</option>
            {subtopics.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Difficulty</span>
          <select
            value={difficulty}
            onChange={(event) => onDifficultyChange(event.target.value as MapDifficulty | 'all')}
            className="rounded-md border border-slate-300 px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
          >
            {difficultyOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
