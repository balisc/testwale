'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Files } from 'lucide-react';

export default function SscCglStageExplorer({ language }: { language: 'en' | 'hi' }) {
  const copy = language === 'hi'
    ? {
        badge: 'SSC CGL स्टेज',
        title: 'पहले अपना टियर चुनें',
        body: 'टियर 1 और टियर 2 के पाठ्यक्रम अलग रखे गए हैं। टियर 2 खोलने पर पेपर 1, 2 और 3 अलग दिखाई देंगे।',
        tier1: 'टियर 1', tier1Body: '4 विषय • 28 टॉपिक • 153 उपविषय',
        tier2: 'टियर 2', tier2Body: 'पेपर 1 • पेपर 2 • पेपर 3', open: 'खोलें',
      }
    : {
        badge: 'SSC CGL stages',
        title: 'Choose your tier first',
        body: 'Tier 1 and Tier 2 use separate syllabus views. Tier 2 then separates Paper 1, Paper 2 and Paper 3.',
        tier1: 'Tier 1', tier1Body: '4 subjects • 28 topics • 153 subtopics',
        tier2: 'Tier 2', tier2Body: 'Paper 1 • Paper 2 • Paper 3', open: 'Open stage',
      };

  return (
    <section id="ssc-cgl-stages" className="mt-12 scroll-mt-24 rounded-[2rem] border border-violet-100 bg-white p-5 shadow-[0_18px_60px_rgba(76,29,149,0.06)] sm:p-8 lg:p-10" aria-labelledby="ssc-cgl-stage-heading">
      <span className="inline-flex rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-violet-700">{copy.badge}</span>
      <h2 id="ssc-cgl-stage-heading" className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">{copy.title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{copy.body}</p>
      <div className="mt-7 grid gap-4 md:grid-cols-2">
        {[
          { href: '/ssc-cgl/tier-1/subjects', title: copy.tier1, body: copy.tier1Body, Icon: BookOpen },
          { href: '/ssc-cgl/tier-2/paper-1/subjects', title: copy.tier2, body: copy.tier2Body, Icon: Files },
        ].map(({ href, title, body, Icon }) => (
          <Link key={href} href={href} className="group flex min-h-40 items-center gap-4 rounded-3xl border border-slate-200 bg-[#FCFBFF] p-5 transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 sm:p-6">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><Icon className="h-7 w-7" aria-hidden="true" /></span>
            <span className="min-w-0 flex-1"><span className="block text-xl font-extrabold">{title}</span><span className="mt-2 block text-sm leading-6 text-slate-600">{body}</span><span className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-violet-700">{copy.open}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" /></span></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
