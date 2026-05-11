'use client';

type Topic = {
  en: string;
  hi: string;
};

type TopicCardProps = {
  topic: Topic;
  onSelect: (topic: Topic) => void;
  language: 'en' | 'hi';
};

export default function TopicCard({ topic, onSelect, language }: TopicCardProps) {
  const displayText = language === 'hi' ? topic.hi : topic.en;
  const fallbackText = language === 'hi' ? topic.en : topic.hi;
  const topicName = displayText || fallbackText;

  return (
    <button
      onClick={() => onSelect(topic)}
      className="group rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-950 p-6 shadow-lg transition duration-300 hover:border-emerald-400/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]"
    >
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-2xl bg-emerald-400/10 p-4 transition group-hover:bg-emerald-400/20">
          <span className="text-3xl text-emerald-300">📚</span>
        </div>
        <h3 className="text-lg font-semibold text-white group-hover:text-emerald-300">{topicName}</h3>
        <p className="text-xs text-slate-400">Click to practice</p>
      </div>
    </button>
  );
}
