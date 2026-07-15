'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const MEDIEVAL_SUBTOPICS = {
  subTopics: [
    {
      id: 'Tripartite Struggle (Palas, Pratiharas, and Rashtrakutas)',
      name: 'Topic 1: Tripartite Struggle for Kannauj (Palas, Pratiharas, and Rashtrakutas)',
    },
    {
      id: 'The Rajput Clans: Polity, Society, and Feudalism',
      name: 'Topic 2: The Rajput Clans: Polity, Society, and Feudalism',
    },
    {
      id: 'The Chola Empire: Administration and Maritime Power',
      name: 'Topic 3: The Chola Empire: Administration and Maritime Power',
    }
  ],
};

export default function MedievalSubtopicDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen((current) => !current);
  };

  return (
    <section className="max-w-4xl mx-auto">
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div
          role="button"
          tabIndex={0}
          aria-expanded={isOpen}
          onClick={toggleDropdown}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              toggleDropdown();
            }
          }}
          className="flex items-center justify-between gap-4 bg-white px-5 py-5 rounded-xl cursor-pointer transition duration-200 border border-slate-200 hover:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500 font-semibold">Medieval Indian History</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white border border-slate-200 text-[#7C3AED] shadow-sm transition duration-200">
            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            isOpen ? 'max-h-[1000px] opacity-100 py-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="space-y-3 px-5">
            {MEDIEVAL_SUBTOPICS.subTopics.map((subTopic) => (
              <div
                key={subTopic.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 transition duration-200 hover:border-[#7C3AED] hover:text-[#7C3AED]"
              >
                <p className="text-sm font-semibold text-slate-900 leading-6">{subTopic.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
