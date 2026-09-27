'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { HelpButton } from '../HelpButton';
import { IconMore, IconSend } from '../Icons';
import { Sanctuary } from '../sanctuary/Sanctuary';
import { bubbleIn, EASE_OUT } from '../lib/motion';
import type { ChatMessage, ChatPerson } from './types';

interface Props {
  me: ChatPerson;
  partner: ChatPerson;
  messages: ChatMessage[];
  partnerTyping?: boolean;
  partnerPresent?: boolean;
  /** overrides "Here with you" / "Reconnecting" */
  presenceLabel?: string;
  /** from the existing session timer */
  secondsLeft: number;
  totalSeconds: number;
  /** existing send call; the server already strips contact details */
  onSend: (text: string) => void;
  onTyping?: () => void;
  onEnd: () => void;
  onReport: () => void;
  onBlock: () => void;
  starters?: string[];
  /** shown in place of the default "a couple of minutes left" line (e.g. the keep-chatting prompt) */
  endingNotice?: ReactNode;
}

const DEFAULT_STARTERS = ["What's been sitting with you today?", 'Do you want to vent, or talk it through?', 'What does tonight look like for you?'];

export function ChatShell({ me, partner, messages, partnerTyping, partnerPresent = true, presenceLabel, secondsLeft, totalSeconds, onSend, onTyping, onEnd, onReport, onBlock, starters = DEFAULT_STARTERS, endingNotice }: Props) {
  const [draft, setDraft] = useState('');
  const [menu, setMenu] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, partnerTyping]);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [menu]);

  // Auto-grow the composer up to 5 lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [draft]);

  const send = () => {
    const t = draft.trim();
    if (!t) return;
    onSend(t);
    setDraft('');
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const minsLeft = Math.max(0, Math.ceil(secondsLeft / 60));
  const frac = totalSeconds > 0 ? Math.max(0, Math.min(1, secondsLeft / totalSeconds)) : 0;
  const C = 62.83;
  const ending = secondsLeft <= 120;
  const iSpoke = messages.some((m) => m.fromMe);

  return (
    <div className="mm-chat">
      <Sanctuary mode="recede" />
      <div className="mm-chat__panel">
        <header className="mm-chat__header">
          <div className="mm-chat__who">
            <span className="mm-chat__avatar" style={{ '--mm-ring': partner.color } as CSSProperties}>
              {partner.initials}
            </span>
            <span className="mm-chat__who-text">
              <span className="mm-chat__name">{partner.name}</span>
              <span className="mm-chat__presence">
                <span className={`mm-presence-dot${partnerPresent ? ' is-on' : ''}`} />
                {presenceLabel ?? (partnerPresent ? 'Here with you' : 'Reconnecting')}
              </span>
            </span>
          </div>
          <div className="mm-chat__tools">
            <div className={`mm-timer${ending ? ' is-ending' : ''}`} aria-label={`${minsLeft} minutes left in this conversation`}>
              <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
                <circle cx="13" cy="13" r="10" className="mm-timer__track" />
                <circle cx="13" cy="13" r="10" className="mm-timer__fill" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform="rotate(-90 13 13)" />
              </svg>
              <span className="mm-hide-sm">{minsLeft} min left</span>
            </div>
            <div className="mm-chat__menuwrap" ref={menuRef}>
              <button type="button" className="mm-iconbtn" onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} aria-label="Conversation options">
                <IconMore />
              </button>
              <AnimatePresence>
                {menu && (
                  <motion.div
                    role="menu"
                    className="mm-chat__menu"
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: EASE_OUT } }}
                    exit={{ opacity: 0, y: -4, transition: { duration: 0.15 } }}
                  >
                    <button type="button" role="menuitem" onClick={() => { setMenu(false); onEnd(); }}>End conversation</button>
                    <button type="button" role="menuitem" onClick={() => { setMenu(false); onReport(); }}>Report</button>
                    <button type="button" role="menuitem" className="is-danger" onClick={() => { setMenu(false); onBlock(); }}>Block {partner.name}</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="mm-chat__scroll" aria-live="polite" aria-relevant="additions">
          <div className="mm-chat__checkins">
            <CheckInCard person={partner} lead={`${partner.name} checked in`} tint="them" />
            <CheckInCard person={me} lead="You checked in" tint="me" className="mm-hide-sm" />
          </div>
          <p className="mm-chat__notice">You&apos;re both anonymous. Phone numbers, emails and links are removed automatically.</p>

          {messages.map((m) => (
            <motion.div key={m.id} className={`mm-bubble-row${m.fromMe ? ' is-me' : ''}`} {...bubbleIn}>
              <div className="mm-bubble">{m.text}</div>
            </motion.div>
          ))}

          <AnimatePresence>
            {partnerTyping && (
              <motion.div className="mm-bubble-row" {...bubbleIn} exit={{ opacity: 0 }}>
                <div className="mm-bubble mm-bubble--typing" aria-label={`${partner.name} is typing`}>
                  <span className="mm-typing-dot" />
                  <span className="mm-typing-dot" />
                  <span className="mm-typing-dot" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!iSpoke && (
            <motion.div className="mm-chat__starters" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.4, duration: 0.8 } }}>
              <span className="mm-fine">If you&apos;re not sure how to start</span>
              {starters.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="mm-starter"
                  onClick={() => {
                    setDraft(s);
                    inputRef.current?.focus();
                  }}
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}
          {ending && secondsLeft > 0 && (endingNotice ?? <p className="mm-chat__notice mm-chat__notice--warm">A couple of minutes left. A good moment to say goodbye.</p>)}
          <div ref={endRef} />
        </div>

        <div className="mm-chat__composer-wrap">
          <div className="mm-composer">
            <label htmlFor="mm-message" className="mm-sr-only">
              Message
            </label>
            <textarea
              id="mm-message"
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                onTyping?.();
              }}
              onKeyDown={onKeyDown}
              placeholder="Say what's on your mind"
              className="mm-composer__input"
            />
            <button type="button" className={`mm-composer__send${draft.trim() ? ' is-ready' : ''}`} onClick={send} aria-label="Send message" disabled={!draft.trim()}>
              <IconSend />
            </button>
          </div>
          <div className="mm-chat__below">
            <HelpButton variant="inline" />
            <span className="mm-fine mm-hide-sm">Messages stay in this conversation only</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckInCard({ person, lead, tint, className }: { person: ChatPerson; lead: string; tint: 'me' | 'them'; className?: string }) {
  return (
    <div className={`mm-checkincard mm-checkincard--${tint} ${className ?? ''}`} style={{ '--mm-card': person.color } as CSSProperties}>
      <span className="mm-checkincard__dot" aria-hidden="true" />
      <span className="mm-checkincard__text">
        <span className="mm-checkincard__lead">
          {lead} {person.word ? <strong>{person.word.toLowerCase()}</strong> : null}
        </span>
        <span className="mm-checkincard__note">{person.note ? `"${person.note}"` : 'No note added'}</span>
      </span>
    </div>
  );
}
