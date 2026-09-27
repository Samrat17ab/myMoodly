'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { Moodlight } from './Moodlight';
import { clampPoint, describeMood, moodColor, type MoodPoint } from './lib/mood';
import { softSpring } from './lib/motion';

interface Props {
  value: MoodPoint;
  onChange: (p: MoodPoint) => void;
  size?: 'lg' | 'md' | 'sm';
  /** dark = for use on the pine/night sections */
  tone?: 'light' | 'dark';
  showZones?: boolean;
  /** a faint marker, e.g. "when you came in" on the reflection screen */
  ghost?: MoodPoint;
  ghostLabel?: string;
  layoutId?: string;
  label?: string;
  className?: string;
}

/**
 * 2D mood field. Up = more energy, right = feels better.
 * Tap, drag, or use arrow keys (Shift for bigger steps).
 */
export function MoodMap({ value, onChange, size = 'lg', tone = 'light', showZones = true, ghost, ghostLabel, layoutId, label = 'Mood map', className }: Props) {
  const dragging = useRef(false);
  const reduce = useReducedMotion();
  const color = moodColor(value);
  const d = describeMood(value);
  const lightSize = size === 'lg' ? 72 : size === 'md' ? 60 : 44;

  const fromEvent = (e: PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onChange(clampPoint({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }));
  };
  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    fromEvent(e);
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (dragging.current) fromEvent(e);
  };
  const end = (e: PointerEvent<HTMLButtonElement>) => {
    dragging.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = e.shiftKey ? 0.12 : 0.05;
    let { x, y } = value;
    if (e.key === 'ArrowLeft') x -= step;
    else if (e.key === 'ArrowRight') x += step;
    else if (e.key === 'ArrowUp') y -= step;
    else if (e.key === 'ArrowDown') y += step;
    else return;
    e.preventDefault();
    onChange(clampPoint({ x, y }));
  };

  return (
    <button
      type="button"
      className={`mm-moodmap mm-moodmap--${size} mm-moodmap--${tone} ${className ?? ''}`}
      style={{ '--mm-map-glow': color } as CSSProperties}
      aria-label={`${label}. Your light says ${d.label}. Use the arrow keys to move it.`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onKeyDown={onKeyDown}
    >
      <span className="mm-moodmap__axis mm-moodmap__axis--v" />
      <span className="mm-moodmap__axis mm-moodmap__axis--h" />
      <span className="mm-moodmap__edge mm-moodmap__edge--top">More energy</span>
      <span className="mm-moodmap__edge mm-moodmap__edge--bottom">Less energy</span>
      <span className="mm-moodmap__edge mm-moodmap__edge--left">Harder</span>
      <span className="mm-moodmap__edge mm-moodmap__edge--right">Better</span>
      {showZones && (
        <>
          <span className="mm-moodmap__zone mm-moodmap__zone--tl">stirred up</span>
          <span className="mm-moodmap__zone mm-moodmap__zone--tr">bright</span>
          <span className="mm-moodmap__zone mm-moodmap__zone--bl">heavy</span>
          <span className="mm-moodmap__zone mm-moodmap__zone--br">settled</span>
        </>
      )}
      {ghost && (
        <span className="mm-moodmap__ghost" style={{ left: `${ghost.x * 100}%`, top: `${ghost.y * 100}%` }}>
          <span className="mm-moodmap__ghost-dot" />
          {ghostLabel && <span className="mm-moodmap__ghost-label">{ghostLabel}</span>}
        </span>
      )}
      <motion.span
        className="mm-moodmap__light"
        initial={false}
        animate={{ left: `${value.x * 100}%`, top: `${value.y * 100}%` }}
        transition={reduce ? { duration: 0 } : softSpring}
      >
        <span className="mm-moodmap__light-inner">
          <Moodlight color={color} size={lightSize} pulse layoutId={layoutId} />
        </span>
      </motion.span>
    </button>
  );
}
