'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { CLOSE_HOUR_IST, OPEN_HOUR_IST } from '@/app/lib/openHours';
import { EASE_OUT } from '../lib/motion';
import { downloadOpenHoursCalendar } from './calendar';
import type { LiveOpenHours } from './useOpenHours';

const HOUR = 3_600_000;
// Hours the app is closed each day (3 AM to 9 PM).
const CLOSED_SPAN = (OPEN_HOUR_IST - CLOSE_HOUR_IST) * HOUR;

const pad = (n: number) => String(n).padStart(2, '0');
// Always 12-hour ("9:15 PM"), to match the "9 PM – 3 AM IST" wording.
const localTime = (ms: number) => new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const viewerIsOnIst = () => new Date().getTimezoneOffset() === -330;

function split(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return { h: Math.floor(total / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 };
}

/** One digit that rolls up when it changes. */
function Digit({ value, still }: { value: string; still: boolean }) {
  if (still) return <span className="mm-night__digit">{value}</span>;
  return (
    <span className="mm-night__digit">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: '55%', opacity: 0, filter: 'blur(3px)' }}
          animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: '-55%', opacity: 0, filter: 'blur(3px)' }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Clock({ ms, still }: { ms: number; still: boolean }) {
  const { h, m, s } = split(ms);
  const groups = [pad(h), pad(m), pad(s)];
  const units = ['hours', 'minutes', 'seconds'];
  return (
    <div className="mm-night__clock" aria-hidden="true">
      {groups.map((g, i) => (
        <span key={units[i]} className="mm-night__group">
          <span className="mm-night__pair">
            {g.split('').map((d, j) => (
              <Digit key={j} value={d} still={still} />
            ))}
          </span>
          <span className="mm-night__unit">{units[i]}</span>
          {i < 2 && <span className="mm-night__colon">:</span>}
        </span>
      ))}
    </div>
  );
}

const STARS = [
  [34, 30, 1.2], [62, 18, 0.9], [96, 40, 1.1], [150, 14, 1], [184, 34, 1.3], [212, 22, 0.8], [124, 56, 0.8], [200, 60, 1],
] as const;

/** The moon rises toward its peak at opening time, then sets toward 3 AM. */
function Moonrise({ hours, still, bloom }: { hours: LiveOpenHours; still: boolean; bloom: number }) {
  // 0 = moonrise (3 AM), 0.5 = peak (9 PM), 1 = moonset (3 AM next morning).
  const t = hours.open
    ? 0.5 + 0.5 * Math.min(1, (hours.now - hours.opensAt) / (hours.closesAt - hours.opensAt))
    : 0.5 * Math.min(1, Math.max(0, 1 - (hours.opensAt - hours.now) / CLOSED_SPAN));
  const angle = Math.PI * (1 - t);
  const cx = 120 + 100 * Math.cos(angle);
  const cy = 112 - 86 * Math.sin(angle);
  const night = hours.open ? 1 : Math.max(0.15, t * 2);

  return (
    <svg className="mm-night__sky" viewBox="0 0 240 124" aria-hidden="true">
      <defs>
        <radialGradient id="mm-moon-glow">
          <stop offset="0%" stopColor="var(--mm-night-moon)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--mm-night-moon)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mm-moon-face" cx="38%" cy="34%">
          <stop offset="0%" stopColor="#fffdf6" />
          <stop offset="70%" stopColor="var(--mm-night-moon)" />
          <stop offset="100%" stopColor="color-mix(in srgb, var(--mm-night-moon) 70%, #8a7f6a)" />
        </radialGradient>
      </defs>
      {STARS.map(([x, y, r], i) => (
        <circle
          key={i}
          className={still ? undefined : 'mm-night__star'}
          cx={x}
          cy={y}
          r={r}
          style={{ opacity: night * (0.5 + (i % 3) * 0.2), animationDelay: `${i * 0.7}s` }}
        />
      ))}
      <path className="mm-night__arc" d="M20 112 A100 86 0 0 1 220 112" pathLength={1} />
      <path className="mm-night__arc mm-night__arc--done" d="M20 112 A100 86 0 0 1 220 112" pathLength={1} style={{ strokeDasharray: `${t} 1` }} />
      <line className="mm-night__horizon" x1="6" y1="112" x2="234" y2="112" />
      <circle cx={cx} cy={cy} r={hours.open ? 30 : 22} fill="url(#mm-moon-glow)" className={still ? undefined : 'mm-night__glow'} />
      <circle cx={cx} cy={cy} r={hours.open ? 11 : 9} fill="url(#mm-moon-face)" />
      {bloom > 0 && !still && (
        <motion.circle
          key={bloom}
          cx={cx}
          cy={cy}
          fill="none"
          stroke="var(--mm-night-moon)"
          strokeWidth={1.5}
          initial={{ r: 10, opacity: 0.8 }}
          animate={{ r: 70, opacity: 0 }}
          transition={{ duration: 1.8, ease: EASE_OUT }}
        />
      )}
    </svg>
  );
}

const CalendarIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3.5" y="5" width="17" height="15" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
);

interface Props {
  hours: LiveOpenHours;
  /** hero: the landing page; card: the signed-in home screen */
  variant?: 'hero' | 'card';
  className?: string;
}

/** Countdown to tonight's opening, or the live "we're open" state. */
export function NightCountdown({ hours, variant = 'card', className }: Props) {
  const reduce = useReducedMotion() ?? false;
  const [bloom, setBloom] = useState(0);
  const wasOpen = useRef(hours.open);

  // A soft bloom when the night opens while someone's watching.
  useEffect(() => {
    if (hours.open && !wasOpen.current) setBloom((b) => b + 1);
    wasOpen.current = hours.open;
  }, [hours.open]);

  const remaining = (hours.open ? hours.closesAt : hours.opensAt) - hours.now;
  const { h, m } = split(remaining);
  const onIst = viewerIsOnIst();
  const spoken = hours.open
    ? `myMoodly is open now, until 3 AM IST. ${h} hours ${m} minutes left tonight.`
    : `myMoodly opens in ${h} hours ${m} minutes, at 9 PM IST${onIst ? '' : `, ${localTime(hours.opensAt)} your time`}.`;

  return (
    <motion.section
      className={`mm-night mm-night--${variant} mm-glass${hours.open ? ' is-open' : ''} ${className ?? ''}`}
      initial={reduce ? false : { opacity: 0, y: 14, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.9, ease: EASE_OUT }}
      aria-label="Opening hours"
    >
      <Moonrise hours={hours} still={reduce} bloom={bloom} />
      <div className="mm-night__body">
        <p className="mm-sr-only" role="status">{spoken}</p>
        {hours.open ? (
          <>
            <p className="mm-night__status">
              <span className="mm-night__pulse" aria-hidden="true" />
              We&apos;re open
            </p>
            <p className="mm-night__title">Until 3 AM IST</p>
            <p className="mm-night__fine">
              {h > 0 ? `${h}h ${m}m` : `${m} min`} left tonight{onIst ? '' : ` (until ${localTime(hours.closesAt)} your time)`}. Come as you are.
            </p>
          </>
        ) : (
          <>
            <p className="mm-night__status">Opens tonight in</p>
            <Clock ms={remaining} still={reduce} />
            <p className="mm-night__fine">
              Every night, 9 PM – 3 AM IST
              {!onIst && (
                <>
                  <br />
                  That&apos;s {localTime(hours.opensAt)} – {localTime(hours.closesAt)} your time
                </>
              )}
            </p>
          </>
        )}
        <button type="button" className="mm-btn mm-btn--glass mm-btn--sm mm-night__cal" onClick={() => downloadOpenHoursCalendar(hours.opensAt, hours.closesAt)}>
          <CalendarIcon /> {hours.open ? 'Remind me nightly' : 'Add to calendar'}
        </button>
      </div>
    </motion.section>
  );
}
