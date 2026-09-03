'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Files } from 'lucide-react';

export default function SscChslStageExplorer({ language }: { language: 'en' | 'hi' }) {
  const copy = language === 'hi'
    ? {
        badge: 'SSC CHSL टियर', title: 'पहले अपना टियर चुनें',
        body: 'Tier 1 और Tier 2 का पाठ्यक्रम और प्रश्न अभ्यास अलग-अलग दायरे में दिखाया जाता है।',
        tier1: 'Tier 1', tier1Body: 'रीजनिंग · गणित · अंग्रेज़ी · सामान्य जागरूकता',
        tier2: 'Tier 2', tier2Body: 'वस्तुनिष्ठ अनुभाग · कंप्यूटर ज्ञान · कौशल/टंकण दायरा', open: 'टियर खोलें',
      }
    : {
        badge: 'SSC CHSL tiers', title: 'Choose your tier first',
        body: 'Tier 1 and Tier 2 keep their syllabus scope and exact question practice separate.',
        tier1: 'Tier 1', tier1Body: 'Reasoning · Mathematics · English · General Awareness',
        tier2: 'Tier 2', tier2Body: 'Objective sections · Computer Knowledge · Skill/Typing scope', open: 'Open tier',
      };
  const cards = [
    { href: '/ssc-chsl/tier-1/subjects', title: copy.tier1, body: copy.tier1Body, Icon: BookOpen },
    { href: '/ssc-chsl/tier-2/subjects', title: copy.tier2, body: copy.tier2Body, Icon: Files },
  ];
  return (
    <section id="ssc-chsl-stages" className="mt-12 scroll-mt-24 rounded-[2rem] border border-violet-100 bg-white p-5 shadow-[0_18px_60px_rgba(76,29,149,0.06)] sm:p-8 lg:p-10" aria-labelledby="ssc-chsl-stage-heading">
      <span className="inline-flex rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-violet-700">{copy.badge}</span>
      <h2 id="ssc-chsl-stage-heading" className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">{copy.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{copy.body}</p>
      <div className="mt-7 grid gap-4 md:grid-cols-2">{cards.map(({ href, title, body, Icon }) => <Link key={href} href={href} className="group flex min-h-40 items-center gap-4 rounded-3xl border border-slate-200 bg-[#FCFBFF] p-5 transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 sm:p-6"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><Icon className="h-7 w-7" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block text-xl font-extrabold">{title}</span><span className="mt-2 block text-sm leading-6 text-slate-600">{body}</span><span className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-violet-700">{copy.open}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" /></span></span></Link>)}</div>
    </section>
  );
}
