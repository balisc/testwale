'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface TemplateProps {
  children: ReactNode;
}

export default function Template({ children }: TemplateProps) {
  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ease: 'easeInOut', duration: 0.4 }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
}
