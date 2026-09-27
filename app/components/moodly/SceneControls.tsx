'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { IconScene, IconSoundOff, IconSoundOn } from './Icons';
import { SCENES } from './lib/scenes';
import { useSanctuary } from './sanctuary/SanctuaryProvider';
import { EASE_OUT } from './lib/motion';

/** Bottom-left: current scene, a scene picker, and the sound toggle (off by default). */
export function SceneControls({ className }: { className?: string }) {
  const { scene, pinned, setPinned, soundOn, toggleSound, still, setStill, ready } = useSanctuary();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  if (!ready) return null;

  return (
    <div ref={wrap} className={`mm-scenectl ${className ?? ''}`}>
      <button type="button" className="mm-scenectl__scene" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="dialog">
        <IconScene size={18} />
        <span>{scene.title}</span>
      </button>
      <button
        type="button"
        className={`mm-scenectl__sound${soundOn ? ' is-on' : ''}`}
        onClick={toggleSound}
        aria-pressed={soundOn}
        aria-label={soundOn ? 'Turn ambient sound off' : 'Turn ambient sound on'}
      >
        {soundOn ? <IconSoundOn size={18} /> : <IconSoundOff size={18} />}
        <span>{soundOn ? scene.audioLabel : 'Sound off'}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="mm-scenectl__menu"
            role="dialog"
            aria-label="Choose a scene"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.2 } }}
          >
            <button type="button" className={`mm-scenectl__opt${!pinned ? ' is-on' : ''}`} onClick={() => setPinned(null)}>
              Follow the time of day
            </button>
            {SCENES.map((s) => (
              <button key={s.id} type="button" className={`mm-scenectl__opt${pinned === s.id ? ' is-on' : ''}`} onClick={() => setPinned(s.id)}>
                <span className={`mm-scenectl__thumb mm-scenectl__thumb--${s.family}`} aria-hidden="true" />
                {s.title}
              </button>
            ))}
            <label className="mm-scenectl__still">
              <input type="checkbox" checked={still} onChange={(e) => setStill(e.target.checked)} />
              Keep the scene still
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
