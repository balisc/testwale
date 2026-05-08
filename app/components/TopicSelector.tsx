'use client';

type TopicSelectorProps = {
  subject: string;
  topics: string[];
  selectedTopic: string;
  onTopicChange: (topic: string) => void;
};

export default function TopicSelector({ subject, topics, selectedTopic, onTopicChange }: TopicSelectorProps) {
  if (!subject || !topics.length) {
    return null;
  }

  return (
    <section className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-amber-300">Topics</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Choose a topic for {subject}</h2>
        </div>
        {selectedTopic ? (
          <button
            type="button"
            onClick={() => onTopicChange('')}
            className="rounded-full border border-white/10 bg-slate-900 px-4 py-2 text-sm text-slate-200 transition hover:border-amber-300 hover:text-white"
          >
            Show all topics
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {topics.map((topic) => {
          const isSelected = topic === selectedTopic;
          return (
            <button
              key={topic}
              type="button"
              onClick={() => onTopicChange(topic)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                isSelected
                  ? 'border-amber-400 bg-amber-400 text-slate-950'
                  : 'border-white/10 bg-slate-800 text-slate-200 hover:border-amber-300 hover:bg-slate-700'
              }`}
            >
              {topic}
            </button>
          );
        })}
      </div>
    </section>
  );
}
