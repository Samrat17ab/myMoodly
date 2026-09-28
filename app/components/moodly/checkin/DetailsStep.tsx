'use client';

import { CONTACT_DETAILS_MESSAGE, findContactDetail } from '@/app/lib/contactDetails';
import { IconDifferent, IconSimilar } from '../Icons';
import { describeMood, type MoodPoint } from '../lib/mood';
import { MoodChip } from './MoodChip';
import type { Intent } from './types';

const MAX = 80;
const STARTERS = ['Long day', "Can't switch off", 'Just need to vent'];

interface Props {
  point: MoodPoint;
  word: string | null;
  note: string;
  onNote: (v: string) => void;
  intent: Intent;
  onIntent: (i: Intent) => void;
  remaining: number;
  submitting?: boolean;
  onSubmit: () => void;
}

export function DetailsStep({ point, word, note, onNote, intent, onIntent, remaining, submitting, onSubmit }: Props) {
  const d = describeMood(point);
  // The note is shown to the matched person; contact details can't go in it.
  const blocked = findContactDetail(note) !== null;
  return (
    <div className="mm-details">
      <MoodChip point={point} text={word ? `Feeling ${word.toLowerCase()}` : d.label} />
      <h1 className="mm-display mm-display--lg">Anything you&apos;d like them to know?</h1>

      <label htmlFor="mm-note" className="mm-fine mm-details__label">
        Optional. A few words help the conversation start gently.
      </label>
      <div className="mm-details__field">
        <textarea
          id="mm-note"
          className={`mm-textarea${blocked ? ' is-invalid' : ''}`}
          aria-invalid={blocked}
          aria-describedby={blocked ? 'mm-note-error' : undefined}
          value={note}
          maxLength={MAX}
          onChange={(e) => onNote(e.target.value.slice(0, MAX))}
          placeholder="Exam tomorrow and my head won't slow down"
          rows={3}
        />
        <span className="mm-details__count" aria-live="polite">
          {note.length}/{MAX}
        </span>
      </div>
      {blocked && (
        <p id="mm-note-error" className="mm-error mm-details__error" role="alert">
          {CONTACT_DETAILS_MESSAGE}
        </p>
      )}
      <div className="mm-details__starters">
        {STARTERS.map((s) => (
          <button key={s} type="button" className="mm-chip" onClick={() => onNote(s)}>
            {s}
          </button>
        ))}
        <span className="mm-fine mm-details__privacy">No phone numbers, emails, handles or links here.</span>
      </div>

      <h2 className="mm-display mm-display--sm mm-details__who">Who would feel right to talk to?</h2>
      <div className="mm-details__choices" role="radiogroup" aria-label="Who would feel right to talk to?">
        <button type="button" role="radio" aria-checked={intent === 'similar'} className={`mm-choice${intent === 'similar' ? ' is-on' : ''}`} onClick={() => onIntent('similar')}>
          <IconSimilar size={40} />
          <span className="mm-choice__text">
            <span className="mm-choice__title">Someone who feels similar</span>
            <span className="mm-choice__desc">Be met by someone in a close place. Less explaining, more understanding.</span>
          </span>
        </button>
        <button type="button" role="radio" aria-checked={intent === 'different'} className={`mm-choice${intent === 'different' ? ' is-on' : ''}`} onClick={() => onIntent('different')}>
          <IconDifferent size={40} />
          <span className="mm-choice__text">
            <span className="mm-choice__title">Someone in a different headspace</span>
            <span className="mm-choice__desc">A calmer or brighter view can help you step back from it.</span>
          </span>
        </button>
      </div>

      <div className="mm-details__submit">
        <button type="button" className="mm-btn mm-btn--primary" onClick={onSubmit} disabled={submitting || remaining <= 0 || blocked}>
          {submitting ? 'Finding someone…' : 'Find someone'}
        </button>
        <span className="mm-fine">
          {remaining > 0 ? `${remaining} ${remaining === 1 ? 'conversation' : 'conversations'} left today` : 'No conversations left today'}
        </span>
      </div>
    </div>
  );
}
