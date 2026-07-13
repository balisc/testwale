'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/** One-shot viewport reveal; respects prefers-reduced-motion. */
export function Reveal({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduce(mq.matches);
    if (mq.matches) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} ${
        reduce
          ? ''
          : `transition-[opacity,transform] duration-500 ease-out ${
              visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
            }`
      }`}
    >
      {children}
    </div>
  );
}
