"use client";

import { useState } from "react";

// â”€â”€ Bilingual Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CONTENT = {
  en: {
    lang: "EN",
    badge: "About Us",
    heroTitle1: "Practice Smarter,",
    heroTitle2: "Score Higher.",
    heroSub:
      "QuestionWale is India's most focused exam practice platform â€” built for UPSC & State PSC aspirants who believe in consistent, structured preparation.",
    storyBadge: "Our Story",
    storyH: "We saw a gap. We built the bridge.",
    storyP1:
      "While preparing for competitive exams, one thing became clear â€” quality practice material was either scattered across the internet or locked behind expensive paywalls.",
    storyP2:
      "Students from smaller cities had the dedication but not the resources. They needed one structured platform to practice topic by topic â€” without distractions.",
    storyP3:
      "QuestionWale was born from that need. And this mission continues every day.",
    quote: '"Success has no shortcut â€” but the right direction makes all the difference."',
    quoteBy: "â€” QuestionWale",
    offerBadge: "What We Offer",
    offerH: "Everything in one place",
    features: [
      { icon: "ðŸ—‚ï¸", title: "Topic-wise MCQ Practice", desc: "Break down every subject into subtopics and practice with laser focus." },
      { icon: "ðŸ“Š", title: "3 Difficulty Levels", desc: "Easy to Hard â€” build both speed and accuracy systematically." },
      { icon: "ðŸ’¡", title: "Detailed Explanations", desc: "Not just the answer â€” understand the concept behind every question." },
      { icon: "ðŸŽ“", title: "UPSC + State PSC", desc: "Questions curated for both levels â€” relevant patterns, real exam style." },
      { icon: "ðŸ“±", title: "Mobile Friendly", desc: "Study anywhere, anytime â€” perfectly optimized for all devices." },
      { icon: "ðŸ”„", title: "Regular Updates", desc: "New questions and topics are added consistently every week." },
    ],
    forWhoBadge: "For Who",
    forWhoH: "This platform is for you if...",
    audience: [
      "UPSC Civil Services Aspirants",
      "State PSC Students (UP, MP, Bihar, Rajasthan & more)",
      "BA Economics & Commerce Students",
      "Self-study Students",
      "Teachers & Educators",
    ],
    valuesBadge: "Our Values",
    values: [
      { icon: "ðŸŽ¯", title: "Accuracy", desc: "Every question is verified and sourced from authentic references." },
      { icon: "ðŸ“š", title: "Depth", desc: "Detailed explanations with every MCQ â€” not just the answer." },
      { icon: "ðŸ†“", title: "Free Access", desc: "No paywalls. Equal access for every student, everywhere." },
      { icon: "ðŸ”„", title: "Consistency", desc: "New questions and topics added regularly â€” never stale." },
    ],
    contactBadge: "Contact",
    contactH: "Let's talk",
    contactSub: "Suggestions, feedback, or any question â€” we're always listening.",
    contactItems: [
      { icon: "âœ‰ï¸", label: "Email", value: "hello@questionwale.in" },
      { icon: "ðŸ“±", label: "Telegram", value: "@QuestionWale" },
      { icon: "ðŸ“¸", label: "Instagram", value: "@questionwale" },
    ],
    contactNote: "Your suggestions help us make QuestionWale better every day.",
    formName: "Your Name",
    formNamePh: "e.g. Rahul Sharma",
    formEmail: "Email Address",
    formEmailPh: "your@email.com",
    formMsg: "Your Message",
    formMsgPh: "Write your suggestion or question...",
    formBtn: "Send Message â†’",
    successTitle: "Message received!",
    successSub: "We'll get back to you soon.",
    statsItems: [
      { number: "500+", label: "Questions" },
      { number: "12+", label: "Topics" },
      { number: "3", label: "Difficulty Levels" },
      { number: "Free", label: "Forever" },
    ],
  },
  hi: {
    lang: "à¤¹à¤¿",
    badge: "à¤¹à¤®à¤¾à¤°à¥‡ à¤¬à¤¾à¤°à¥‡ à¤®à¥‡à¤‚",
    heroTitle1: "Smart à¤¤à¤°à¥€à¤•à¥‡ à¤¸à¥‡ Practice à¤•à¤°à¥‹,",
    heroTitle2: "à¤Šà¤à¤šà¥‡ Marks à¤²à¤¾à¤“à¥¤",
    heroSub:
      "QuestionWale â€” à¤­à¤¾à¤°à¤¤ à¤•à¤¾ à¤¸à¤¬à¤¸à¥‡ focused exam practice platform, UPSC à¤”à¤° State PSC aspirants à¤•à¥‡ à¤²à¤¿à¤ à¤¬à¤¨à¤¾à¤¯à¤¾ à¤—à¤¯à¤¾ à¤œà¥‹ structured à¤¤à¥ˆà¤¯à¤¾à¤°à¥€ à¤®à¥‡à¤‚ à¤µà¤¿à¤¶à¥à¤µà¤¾à¤¸ à¤°à¤–à¤¤à¥‡ à¤¹à¥ˆà¤‚à¥¤",
    storyBadge: "à¤¹à¤®à¤¾à¤°à¥€ à¤•à¤¹à¤¾à¤¨à¥€",
    storyH: "à¤à¤• à¤•à¤®à¥€ à¤¦à¥‡à¤–à¥€, à¤à¤• à¤°à¤¾à¤¸à¥à¤¤à¤¾ à¤¬à¤¨à¤¾à¤¯à¤¾à¥¤",
    storyP1:
      "Competitive exams à¤•à¥€ à¤¤à¥ˆà¤¯à¤¾à¤°à¥€ à¤•à¤°à¤¤à¥‡ à¤µà¤•à¥à¤¤ à¤à¤• à¤¬à¤¾à¤¤ à¤¬à¤¾à¤°-à¤¬à¤¾à¤° à¤¦à¤¿à¤–à¥€ â€” quality practice material à¤¯à¤¾ à¤¤à¥‹ internet à¤ªà¤° à¤¬à¤¿à¤–à¤°à¤¾ à¤¹à¥à¤† à¤¥à¤¾, à¤¯à¤¾ à¤«à¤¿à¤° à¤®à¤¹à¤‚à¤—à¥‡ paywalls à¤•à¥‡ à¤ªà¥€à¤›à¥‡ à¤¬à¤‚à¤¦ à¤¥à¤¾à¥¤",
    storyP2:
      "à¤›à¥‹à¤Ÿà¥‡ à¤¶à¤¹à¤°à¥‹à¤‚ à¤•à¥‡ students à¤®à¥‡à¤‚ à¤®à¥‡à¤¹à¤¨à¤¤ à¤•à¥€ à¤•à¥‹à¤ˆ à¤•à¤®à¥€ à¤¨à¤¹à¥€à¤‚ à¤¥à¥€ â€” à¤¬à¤¸ à¤à¤• structured platform à¤šà¤¾à¤¹à¤¿à¤ à¤¥à¤¾ à¤œà¤¹à¤¾à¤ topic-by-topic practice à¤¹à¥‹ à¤¸à¤•à¥‡, à¤¬à¤¿à¤¨à¤¾ à¤•à¤¿à¤¸à¥€ distraction à¤•à¥‡à¥¤",
    storyP3:
      "QuestionWale à¤‰à¤¸à¥€ à¤œà¤¼à¤°à¥‚à¤°à¤¤ à¤¸à¥‡ à¤œà¤¨à¥à¤®à¤¾à¥¤ à¤”à¤° à¤¯à¤¹ mission à¤†à¤œ à¤­à¥€ à¤œà¤¾à¤°à¥€ à¤¹à¥ˆà¥¤",
    quote: '"à¤¸à¤«à¤²à¤¤à¤¾ à¤•à¤¾ à¤•à¥‹à¤ˆ shortcut à¤¨à¤¹à¥€à¤‚ à¤¹à¥‹à¤¤à¤¾ â€” à¤²à¥‡à¤•à¤¿à¤¨ à¤¸à¤¹à¥€ à¤¦à¤¿à¤¶à¤¾ à¤¸à¤¬ à¤•à¥à¤› à¤¬à¤¦à¤² à¤¦à¥‡à¤¤à¥€ à¤¹à¥ˆà¥¤"',
    quoteBy: "â€” QuestionWale",
    offerBadge: "à¤¹à¤® à¤•à¥à¤¯à¤¾ à¤¦à¥‡à¤¤à¥‡ à¤¹à¥ˆà¤‚",
    offerH: "à¤¸à¤¬ à¤•à¥à¤› à¤à¤• à¤œà¤—à¤¹",
    features: [
      { icon: "ðŸ—‚ï¸", title: "Topic-wise MCQ Practice", desc: "à¤¹à¤° subject à¤•à¥‹ subtopics à¤®à¥‡à¤‚ à¤¤à¥‹à¤¡à¤¼à¤•à¤° focused practice à¤•à¤°à¥‹à¥¤" },
      { icon: "ðŸ“Š", title: "3 Difficulty Levels", desc: "Easy à¤¸à¥‡ Hard à¤¤à¤• â€” speed à¤”à¤° accuracy à¤¦à¥‹à¤¨à¥‹à¤‚ à¤¬à¤¢à¤¼à¤¾à¤“à¥¤" },
      { icon: "ðŸ’¡", title: "Detailed Explanations", desc: "à¤¸à¤¿à¤°à¥à¤« à¤œà¤µà¤¾à¤¬ à¤¨à¤¹à¥€à¤‚ â€” à¤¹à¤° question à¤•à¥‡ à¤ªà¥€à¤›à¥‡ à¤•à¤¾ concept à¤¸à¤®à¤à¥‹à¥¤" },
      { icon: "ðŸŽ“", title: "UPSC + State PSC", desc: "à¤¦à¥‹à¤¨à¥‹à¤‚ levels à¤•à¥‡ à¤²à¤¿à¤ relevant questions â€” real exam pattern à¤®à¥‡à¤‚à¥¤" },
      { icon: "ðŸ“±", title: "Mobile Friendly", desc: "à¤•à¤¹à¥€à¤‚ à¤­à¥€, à¤•à¤­à¥€ à¤­à¥€ â€” à¤¹à¤° device à¤ªà¤° perfectly à¤•à¤¾à¤® à¤•à¤°à¤¤à¤¾ à¤¹à¥ˆà¥¤" },
      { icon: "ðŸ”„", title: "Regular Updates", desc: "à¤¹à¤° à¤¹à¤«à¥à¤¤à¥‡ à¤¨à¤ questions à¤”à¤° topics add à¤¹à¥‹à¤¤à¥‡ à¤°à¤¹à¤¤à¥‡ à¤¹à¥ˆà¤‚à¥¤" },
    ],
    forWhoBadge: "à¤•à¤¿à¤¸à¤•à¥‡ à¤²à¤¿à¤ à¤¹à¥ˆ",
    forWhoH: "à¤¯à¤¹ platform à¤†à¤ªà¤•à¥‡ à¤²à¤¿à¤ à¤¹à¥ˆ à¤…à¤—à¤°...",
    audience: [
      "UPSC Civil Services Aspirants",
      "State PSC Students (UP, MP, Bihar, Rajasthan à¤†à¤¦à¤¿)",
      "BA Economics à¤”à¤° Commerce à¤•à¥‡ Students",
      "Self-study à¤•à¤°à¤¨à¥‡ à¤µà¤¾à¤²à¥‡ Students",
      "Teachers à¤”à¤° Educators",
    ],
    valuesBadge: "à¤¹à¤®à¤¾à¤°à¥€ Values",
    values: [
      { icon: "ðŸŽ¯", title: "Accuracy", desc: "à¤¹à¤° question verified à¤”à¤° authentic sources à¤¸à¥‡ à¤²à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾ à¤¹à¥ˆà¥¤" },
      { icon: "ðŸ“š", title: "Depth", desc: "à¤¹à¤° MCQ à¤•à¥‡ à¤¸à¤¾à¤¥ detailed explanation â€” à¤¸à¤¿à¤°à¥à¤« answer à¤¨à¤¹à¥€à¤‚à¥¤" },
      { icon: "ðŸ†“", title: "Free Access", desc: "à¤•à¥‹à¤ˆ paywall à¤¨à¤¹à¥€à¤‚à¥¤ à¤¹à¤° student à¤•à¥‡ à¤²à¤¿à¤ equal accessà¥¤" },
      { icon: "ðŸ”„", title: "Consistency", desc: "à¤¨à¤ questions regularly add à¤¹à¥‹à¤¤à¥‡ à¤¹à¥ˆà¤‚ â€” content à¤•à¤­à¥€ à¤ªà¥à¤°à¤¾à¤¨à¤¾ à¤¨à¤¹à¥€à¤‚à¥¤" },
    ],
    contactBadge: "à¤¸à¤‚à¤ªà¤°à¥à¤• à¤•à¤°à¥‡à¤‚",
    contactH: "à¤¬à¤¾à¤¤ à¤•à¤°à¤¤à¥‡ à¤¹à¥ˆà¤‚",
    contactSub: "Suggestion, feedback, à¤¯à¤¾ à¤•à¥‹à¤ˆ à¤¸à¤µà¤¾à¤² â€” à¤¹à¤® à¤¹à¤®à¥‡à¤¶à¤¾ à¤¸à¥à¤¨à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤¤à¥ˆà¤¯à¤¾à¤° à¤¹à¥ˆà¤‚à¥¤",
    contactItems: [
      { icon: "âœ‰ï¸", label: "Email", value: "hello@questionwale.in" },
      { icon: "ðŸ“±", label: "Telegram", value: "@QuestionWale" },
      { icon: "ðŸ“¸", label: "Instagram", value: "@questionwale" },
    ],
    contactNote: "à¤†à¤ªà¤•à¥‡ suggestions à¤¸à¥‡ à¤¹à¤® QuestionWale à¤•à¥‹ à¤”à¤° à¤¬à¥‡à¤¹à¤¤à¤° à¤¬à¤¨à¤¾à¤¤à¥‡ à¤°à¤¹à¤¤à¥‡ à¤¹à¥ˆà¤‚à¥¤",
    formName: "à¤†à¤ªà¤•à¤¾ à¤¨à¤¾à¤®",
    formNamePh: "à¤œà¥ˆà¤¸à¥‡: à¤°à¤¾à¤¹à¥à¤² à¤¶à¤°à¥à¤®à¤¾",
    formEmail: "Email Address",
    formEmailPh: "aapka@email.com",
    formMsg: "à¤†à¤ªà¤•à¤¾ Message",
    formMsgPh: "à¤…à¤ªà¤¨à¤¾ suggestion à¤¯à¤¾ à¤¸à¤µà¤¾à¤² à¤²à¤¿à¤–à¥‡à¤‚...",
    formBtn: "Message à¤­à¥‡à¤œà¥‹ â†’",
    successTitle: "Message à¤®à¤¿à¤² à¤—à¤¯à¤¾!",
    successSub: "à¤¹à¤® à¤œà¤²à¥à¤¦ à¤¹à¥€ à¤†à¤ªà¤¸à¥‡ contact à¤•à¤°à¥‡à¤‚à¤—à¥‡à¥¤",
    statsItems: [
      { number: "500+", label: "Questions" },
      { number: "12+", label: "Topics" },
      { number: "3", label: "Difficulty Levels" },
      { number: "Free", label: "à¤¹à¤®à¥‡à¤¶à¤¾ à¤•à¥‡ à¤²à¤¿à¤" },
    ],
  },
};

type Lang = "en" | "hi";

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AboutPage() {
  const [lang, setLang] = useState<Lang>("hi");
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const c = CONTENT[lang];

  const handleSubmit = () => {
    if (form.name && form.email && form.message) setSubmitted(true);
  };

  return (
    <main
      className="bg-white min-h-screen text-gray-900"
      style={{ fontFamily: lang === "hi" ? "'Noto Sans Devanagari', 'Outfit', sans-serif" : "'Outfit', sans-serif" }}
    >
      <style>{`
        html { scroll-behavior: smooth; }
        .fade-in { animation: fadeUp 0.6s ease both; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* â”€â”€ Language Toggle â”€â”€ */}
      <div className="flex justify-end px-6 md:px-16 pt-6">
        <div className="flex items-center bg-purple-50 border border-purple-200 rounded-full p-1 gap-1">
          {(["hi", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                lang === l
                  ? "bg-purple-700 text-white shadow"
                  : "text-purple-500 hover:text-purple-700"
              }`}
            >
              {l === "hi" ? "à¤¹à¤¿à¤‚à¤¦à¥€" : "English"}
            </button>
          ))}
        </div>
      </div>

      {/* â”€â”€ Hero â”€â”€ */}
      <section className="relative px-6 md:px-16 pt-14 pb-28 overflow-hidden">
        <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-purple-50 rounded-full blur-3xl opacity-70 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[280px] h-[280px] bg-purple-100 rounded-full blur-2xl opacity-50 translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="relative max-w-3xl fade-in">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[3px] uppercase text-purple-600 bg-purple-50 border border-purple-200 px-4 py-1.5 rounded-full mb-7">
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
            {c.badge}
          </span>

          {/* Logo wordmark */}
          <div className="mb-5">
            <span className="text-2xl font-extrabold tracking-tight">
              <span className="text-purple-700">Question</span>
              <span className="text-gray-900">Wale</span>
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6">
            {c.heroTitle1}
            <br />
            <span className="text-purple-700 relative inline-block">
              {c.heroTitle2}
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 400 8" fill="none" preserveAspectRatio="none">
                <path d="M0 6 Q200 1 400 6" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </span>
          </h1>
          <p className="text-base md:text-lg text-gray-500 leading-relaxed max-w-xl">{c.heroSub}</p>
        </div>
      </section>

      {/* â”€â”€ Stats â”€â”€ */}
      <section className="px-6 md:px-16 py-12 bg-purple-700">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
          {c.statsItems.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">{s.number}</p>
              <p className="text-sm text-purple-200 mt-1.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* â”€â”€ Our Story â”€â”€ */}
      <section className="px-6 md:px-16 py-24 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-xs font-bold tracking-[3px] uppercase text-purple-600 mb-4 block">{c.storyBadge}</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight mb-7">{c.storyH}</h2>
            <div className="space-y-4 text-gray-500 leading-relaxed text-[15px]">
              <p>{c.storyP1}</p>
              <p>{c.storyP2}</p>
              <p className="font-semibold text-gray-700">{c.storyP3}</p>
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-8 border border-purple-200">
              <div className="text-5xl mb-5">ðŸ“–</div>
              <blockquote className="text-xl font-bold text-gray-800 leading-snug mb-4">{c.quote}</blockquote>
              <p className="text-sm text-purple-600 font-semibold">{c.quoteBy}</p>
            </div>
            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-purple-700 rounded-2xl opacity-10" />
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-purple-400 rounded-xl opacity-10" />
          </div>
        </div>
      </section>

      {/* â”€â”€ What We Offer â”€â”€ */}
      <section className="px-6 md:px-16 py-24 bg-gray-50/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold tracking-[3px] uppercase text-purple-600 mb-3 block">{c.offerBadge}</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">{c.offerH}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {c.features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-6 border-2 border-purple-100 hover:border-purple-500 hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgba(109,40,217,0.12)] transition-all duration-200 cursor-pointer group"
              >
                <div className="w-12 h-12 bg-purple-50 group-hover:bg-purple-100 rounded-xl flex items-center justify-center text-2xl mb-4 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ For Who + Values â”€â”€ */}
      <section className="px-6 md:px-16 py-24 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <span className="text-xs font-bold tracking-[3px] uppercase text-purple-600 mb-4 block">{c.forWhoBadge}</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight mb-9">{c.forWhoH}</h2>
            <div className="space-y-3.5">
              {c.audience.map((item) => (
                <div key={item} className="flex items-center gap-3.5">
                  <div className="w-6 h-6 rounded-full bg-purple-700 flex items-center justify-center flex-shrink-0">
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M2 5.5l2.5 2.5L9 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium text-[15px]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-bold tracking-[3px] uppercase text-purple-600 mb-4 block">{c.valuesBadge}</span>
            <div className="grid grid-cols-2 gap-4">
              {c.values.map((v) => (
                <div
                  key={v.title}
                  className="bg-white border-2 border-purple-100 rounded-2xl p-5 hover:border-purple-400 hover:shadow-[0_4px_20px_rgba(109,40,217,0.09)] transition-all duration-200"
                >
                  <span className="text-2xl mb-3 block">{v.icon}</span>
                  <h4 className="font-bold text-gray-900 mb-1 text-sm">{v.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ Contact â”€â”€ */}
      <section className="px-6 md:px-16 py-24 bg-purple-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold tracking-[3px] uppercase text-purple-600 mb-3 block">{c.contactBadge}</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">{c.contactH}</h2>
            <p className="text-gray-500 mt-3 text-sm max-w-md mx-auto">{c.contactSub}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Info */}
            <div className="space-y-5">
              {c.contactItems.map((ci) => (
                <div key={ci.label} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white border-2 border-purple-200 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {ci.icon}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{ci.label}</p>
                    <p className="text-gray-800 font-bold text-sm">{ci.value}</p>
                  </div>
                </div>
              ))}
              <div className="pt-5 border-t border-purple-200">
                <p className="text-sm text-gray-500 leading-relaxed">
                  {c.contactNote.split("QuestionWale")[0]}
                  <span className="text-purple-700 font-semibold">QuestionWale</span>
                  {c.contactNote.split("QuestionWale")[1]}
                </p>
              </div>

              {/* Closing */}
              <div className="mt-6 bg-purple-700 rounded-2xl p-6 text-white">
                <p className="text-lg font-bold leading-snug mb-1">Practice. Learn. Succeed.</p>
                <p className="text-purple-200 text-sm">
                  {lang === "hi"
                    ? "à¤¹à¤° à¤¸à¤µà¤¾à¤² à¤à¤• à¤•à¤¦à¤® à¤†à¤—à¥‡ à¤²à¥‡ à¤œà¤¾à¤¤à¤¾ à¤¹à¥ˆà¥¤"
                    : "Every question takes you one step closer."}
                </p>
              </div>
            </div>

            {/* Form */}
            {submitted ? (
              <div className="bg-white rounded-2xl border-2 border-purple-200 p-12 text-center shadow-[0_4px_24px_rgba(109,40,217,0.07)]">
                <div className="text-5xl mb-4">ðŸŽ‰</div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-2">{c.successTitle}</h3>
                <p className="text-gray-500 text-sm">{c.successSub}</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border-2 border-purple-100 p-8 shadow-[0_4px_24px_rgba(109,40,217,0.07)]">
                <div className="space-y-4">
                  {[
                    { label: c.formName, ph: c.formNamePh, key: "name", type: "text" },
                    { label: c.formEmail, ph: c.formEmailPh, key: "email", type: "email" },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">{field.label}</label>
                      <input
                        type={field.type}
                        placeholder={field.ph}
                        value={form[field.key as "name" | "email"]}
                        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-gray-300"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">{c.formMsg}</label>
                    <textarea
                      rows={4}
                      placeholder={c.formMsgPh}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all resize-none placeholder:text-gray-300"
                    />
                  </div>
                  <button
                    onClick={handleSubmit}
                    className="w-full bg-purple-700 hover:bg-purple-800 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all text-sm tracking-wide shadow-[0_4px_16px_rgba(109,40,217,0.3)]"
                  >
                    {c.formBtn}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
