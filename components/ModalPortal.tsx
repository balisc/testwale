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
  describedBy?: string;
  zClassName?: string;
  /** When false, backdrop clicks do not call onClose. Default true. */
  closeOnBackdropClick?: boolean;
  /** When false, Escape does not call onClose. Default true. */
  closeOnEscape?: boolean;
  backdropClassName?: string;
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
  describedBy,
  zClassName = 'z-[300]',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  backdropClassName = 'bg-slate-900/50',
}: ModalPortalProps) {
  const [mounted, setMounted] = useState(false);
  useBodyScrollLock(open);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, closeOnEscape]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${zClassName} flex items-center justify-center p-4`}
      role="presentation"
    >
      {closeOnBackdropClick ? (
        <button
          type="button"
          aria-label="Close"
          className={`absolute inset-0 ${backdropClassName}`}
          onClick={onClose}
        />
      ) : (
        <div aria-hidden className={`absolute inset-0 ${backdropClassName}`} />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={`relative z-10 my-auto max-h-[min(92dvh,100%)] w-full overflow-y-auto overscroll-contain ${panelClassName}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
