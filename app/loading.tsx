// Client-side component to animate selection cycling
"use client";
import React, { useEffect, useLayoutEffect, useState } from "react";
import Image from "next/image";
import { usePageChromeVisibility } from "./components/LayoutShell";

const OPTIONS = ["A", "B", "C", "D"];

export default function Loading(): JSX.Element {
  const setPageChromeVisible = usePageChromeVisibility();
  const [selected, setSelected] = useState<number>(0);

  useLayoutEffect(() => {
    setPageChromeVisible(false);
    return () => setPageChromeVisible(true);
  }, [setPageChromeVisible]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSelected((s) => (s + 1) % OPTIONS.length);
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.4),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(59,0,102,0.9),_rgba(10,4,30,1))] text-white">
      <div className="mx-auto w-full max-w-[1600px] px-6 py-10 lg:px-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 items-center">

          {/* Left: Clean MCQ Card Mockup */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_30px_90px_rgba(10,8,30,0.24)] backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 text-white font-bold text-lg shadow-lg">
                  Q
                </div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-3/4 rounded-full bg-white/20 animate-pulse" />
                  <div className="h-3 w-1/2 rounded-full bg-white/15 animate-pulse" />
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {OPTIONS.map((opt, idx) => {
                  const isSelected = selected === idx;
                  return (
                    <div
                      key={opt}
                      className={
                        "relative flex items-center gap-3 rounded-2xl border p-3 transition-all duration-500 " +
                        (isSelected
                          ? "border-purple-400/50 bg-purple-500/15 shadow-[0_20px_50px_rgba(139,92,246,0.18)]"
                          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10")
                      }
                    >
                      <div
                        className={
                          "flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold transition-colors duration-500 " +
                          (isSelected
                            ? "bg-gradient-to-br from-purple-400 to-indigo-600 text-white"
                            : "bg-white/10 text-white/80")
                        }
                      >
                        {opt}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className={"h-3 rounded-full transition-all duration-500 " + (isSelected ? "bg-white/25 w-40" : "bg-white/12 w-28 animate-pulse")} />
                        <div className={"h-2 rounded-full transition-all duration-500 " + (isSelected ? "bg-white/20 w-32" : "bg-white/10 w-24 animate-pulse")} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Branding & Typography */}
          <div className="lg:col-span-7 flex flex-col justify-center px-4">
            <div className="w-full max-w-xl">
              <div className="flex items-center gap-3 mb-3">
                <Image
                  src="/logo/questionwale_logo.webp"
                  alt="Questionwale logo"
                  width={42}
                  height={42}
                  className="h-10 w-10 object-contain"
                  priority
                />
                <span className="text-4xl font-extrabold tracking-tight text-purple-200">uestionwale</span>
              </div>

              <p className="mt-3 text-xs uppercase tracking-widest text-white/60 font-medium">GOVERNMENT EXAM PREPARATION</p>
              <h2 className="mt-6 text-3xl sm:text-4xl font-semibold text-white">Loading your success path...</h2>

              <div className="mt-6 flex items-center gap-2" role="status" aria-live="polite">
                <span className="h-3 w-3 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "0s" }} />
                <span className="h-3 w-3 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.12s" }} />
                <span className="h-3 w-3 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0.24s" }} />
              </div>

              <p className="mt-8 max-w-lg text-sm text-white/70">Preparing future government officers, one question at a time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
