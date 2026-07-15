'use client';

import { useEffect, useState } from 'react';

interface DelayedRouteLoaderProps {
  children: React.ReactNode;
  delay?: number;
}

export default function DelayedRouteLoader({ children, delay = 180 }: DelayedRouteLoaderProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [delay]);

  return isVisible ? <>{children}</> : null;
}
