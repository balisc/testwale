'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '@/lib/useBodyScrollLock';

type ModalPortalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Extra classes for the centered panel wrapper. */
  panelClassName?: string;
  labelledBy?: string;
  zClassName?: string;
};

/**
 * Viewport-centered modal with backdrop + body scroll lock.
 * Portals to document.body so parent overflow/transform cannot offset it.
 */
export default function ModalPortal({
  open,
  onClose,
  children,
  panelClassName = '',
  labelledBy,
  zClassName = 'z-[300]',
}: ModalPortalProps) {
  const [mounted, setMounted] = useState(false);
  useBodyScrollLock(open);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${zClassName} flex items-center justify-center p-4`}
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-slate-900/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`relative z-10 my-auto max-h-[min(92dvh,100%)] w-full overflow-y-auto overscroll-contain ${panelClassName}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
