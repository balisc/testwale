"use client";

import { useLayoutEffect, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePageChromeVisibility } from "../components/LayoutShell";

export const dynamic = 'force-static';

const OPTIONS = ["A", "B", "C", "D"];

export default function LoadingTestPage() {
  const setPageChromeVisible = usePageChromeVisibility();
  const [activeIndex, setActiveIndex] = useState(0);

  useLayoutEffect(() => {
    setPageChromeVisible(false);
    return () => setPageChromeVisible(true);
  }, [setPageChromeVisible]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % OPTIONS.length);
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const progressWidth = useMemo(() => `${((activeIndex + 1) / OPTIONS.length) * 100}%`, [activeIndex]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white text-slate-950 selection:bg-purple-400/20 selection:text-slate-950 font-sans">
      <div className="relative mx-auto grid min-h-screen w-full max-w-[1440px] gap-8 px-4 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-12">
        <section className="order-2 lg:order-1 relative animate-float overflow-hidden lg:p-10">
          <div className="pointer-events-none absolute right-[-10%] top-0 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="pointer-events-none absolute left-[-10%] bottom-8 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.04)] lg:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 bg-white text-xl font-bold uppercase tracking-[0.35em] text-slate-900 shadow-[0_20px_60px_rgba(168,85,247,0.08)]">
                  Q
                </div>
                <div className="flex-1 space-y-3">
                  <div className="h-3 w-40 rounded-full bg-slate-200 animate-pulse" />
                  <div className="h-3 w-28 rounded-full bg-slate-200 animate-pulse" />
                </div>
              </div>

              <div className="space-y-4">
                {OPTIONS.map((option, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <div
                      key={option}
                      className={`group flex items-center gap-4 rounded-[1.75rem] border px-5 py-4 transition duration-500 ${
                        isActive
                          ? "scale-[1.02] border-purple-300/40 bg-violet-50 shadow-[0_0_30px_rgba(168,85,247,0.12)]"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-3xl text-lg font-semibold transition ${
                          isActive
                            ? "bg-gradient-to-br from-fuchsia-400 to-violet-500 text-white shadow-[0_0_30px_rgba(168,85,247,0.2)]"
                            : "bg-slate-100 text-slate-900"
                        }`}
                      >
                        {option}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className={`h-3 rounded-full transition ${isActive ? "bg-slate-300 w-3/4" : "bg-slate-200 w-2/3 animate-pulse"}`} />
                        <div className={`h-2 rounded-full transition ${isActive ? "bg-slate-200 w-1/2" : "bg-slate-200 w-1/3 animate-pulse"}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <aside className="order-1 lg:order-2 relative flex min-h-[520px] flex-col justify-between overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_40px_90px_rgba(15,23,42,0.08)] lg:p-10">
          <div className="pointer-events-none absolute -right-16 top-8 h-48 w-48 rounded-full bg-pink-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-8 h-52 w-52 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="space-y-10 text-center">
            <div className="space-y-5">
              <div className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm sm:text-base">
                Government Exam Preparation
              </div>
              <h1 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl md:text-6xl lg:text-7xl">
                <Link href="/" className="mx-auto flex items-center justify-center gap-2.5 max-w-[23rem] truncate text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-950 hover:opacity-90 transition">
                  <Image src="/logo/questionwale_logo.webp" alt="QuestionWale logo" width={66} height={66} className="object-contain rounded" />
                  <span className="leading-tight">uestionWale</span>
                </Link>
              </h1>
            </div>

            <div className="space-y-5">
              <p className="text-3xl font-semibold leading-tight text-slate-950 sm:text-2xl">Loading your success path...</p>
            </div>

            <div className="space-y-4">
              <div className="rounded-full bg-slate-100 p-px">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400 transition-all duration-700" style={{ width: progressWidth }} />
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-700 animate-dot-wave" style={{ animationDelay: "0s" }} />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-700 animate-dot-wave" style={{ animationDelay: "0.15s" }} />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-700 animate-dot-wave" style={{ animationDelay: "0.3s" }} />
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6 text-center text-xl text-slate-600/80">
            Preparing future government officers, one question at a time
          </div>
        </aside>
      </div>

      <style jsx global>{`
        @keyframes floatCard {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes dotWave {
          0%, 100% {
            opacity: 0.35;
            transform: translateY(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }

        .animate-float {
          animation: floatCard 7s ease-in-out infinite;
        }

        .animate-dot-wave {
          animation: dotWave 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
