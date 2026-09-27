'use client';

import { motion } from 'framer-motion';
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { IconClose } from './Icons';
import { EASE_OUT } from './lib/motion';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** A glass sheet that rises from the bottom (centred on desktop). Render inside AnimatePresence. */
export function Sheet({ title, onClose, children }: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const last = document.activeElement;
    closeRef.current?.focus();
    return () => {
      if (last instanceof HTMLElement) last.focus();
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <motion.div className="mm-sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="mm-sheet"
        onKeyDown={onKeyDown}
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { duration: 0.55, ease: EASE_OUT } }}
        exit={{ y: 30, opacity: 0, transition: { duration: 0.3 } }}
      >
        <button ref={closeRef} type="button" className="mm-iconbtn mm-sheet__close" onClick={onClose} aria-label="Close">
          <IconClose />
        </button>
        <h2 id={titleId} className="mm-sheet__title">
          {title}
        </h2>
        {children}
      </motion.div>
    </motion.div>
  );
}
