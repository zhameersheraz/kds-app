// Lightweight modal. Renders a backdrop + centered card.
// Dismissable via Escape key or backdrop click (configurable).

import React, { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, footer, dismissOnBackdrop = true, width = 'max-w-sm' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadein"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-ink/40 dark:bg-ink/70"
        onClick={dismissOnBackdrop ? onClose : undefined}
      />
      <div className={'card relative w-full ' + width + ' p-5 animate-fadein'}>
        {title ? <h2 className="font-display text-xl mb-3">{title}</h2> : null}
        <div className="text-sm text-ink/80 dark:text-paper/80">{children}</div>
        {footer ? <div className="mt-5 flex items-center justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}