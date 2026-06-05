'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export default function Template({ children, disableTopPadding = false }: { children: ReactNode; disableTopPadding?: boolean }) {
  return (
    <div className={`${disableTopPadding ? 'min-h-screen' : 'pt-16 min-h-screen'} bg-[#F8FAFC] text-slate-900`}>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: 'easeInOut', duration: 0.4 }}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </div>
  );
}
