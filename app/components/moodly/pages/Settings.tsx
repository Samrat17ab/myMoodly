'use client';

import { AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { initialsFor } from '@/app/lib/profile';
import { IconBack } from '../Icons';
import { Sheet } from '../Sheet';
import { PageShell, type HeaderNav } from './PageShell';
import { ProfileFields, type ProfileValue } from './ProfileFields';

interface Props {
  nav: HeaderNav;
  profile: ProfileValue;
  setProfile: (p: ProfileValue) => void;
  email: string;
  nickname: string;
  usage: number;
  limit: number;
  busy: boolean;
  onBack: () => void;
  onSave: () => void;
  onSignOut: () => void;
  onDeleteAccount: () => void;
  feedbackSending: boolean;
  onSendFeedback: (body: string, afterSend: () => void) => void;
}

export function Settings({ nav, profile, setProfile, email, nickname, usage, limit, busy, onBack, onSave, onSignOut, onDeleteAccount, feedbackSending, onSendFeedback }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [feedback, setFeedback] = useState('');

  return (
    <PageShell nav={nav}>
      <button type="button" className="mm-iconbtn mm-page__back" onClick={onBack} aria-label="Back">
        <IconBack />
      </button>
      <div className="mm-page__head">
        <h1 className="mm-display mm-display--lg">Your private profile</h1>
        <p className="mm-lede">These details are never visible to conversation partners.</p>
      </div>

      <div className="mm-summary">
        <span className="mm-summary__badge">{initialsFor(nickname, email)}</span>
        <div className="mm-summary__text">
          <span className="mm-summary__title">Signed in as</span>
          <p className="mm-summary__detail">{email}</p>
          <p className="mm-summary__detail">
            Conversation partners see you as <b>{nickname || '…'}</b> &middot; changes every 24 hours
          </p>
        </div>
      </div>
      <div className="mm-summary">
        <span className="mm-summary__badge">
          {usage}/{limit}
        </span>
        <div className="mm-summary__text">
          <span className="mm-summary__title">Today&apos;s connections</span>
          <p className="mm-summary__detail">
            {usage} of {limit} free connections used &middot; resets at midnight UTC
          </p>
        </div>
      </div>

      <section className="mm-page__section" aria-label="Profile">
        <ProfileFields profile={profile} setProfile={setProfile} />
        <div className="mm-page__actions">
          <button type="button" className="mm-btn mm-btn--primary" disabled={busy} onClick={onSave}>
            Save changes
          </button>
        </div>
      </section>

      <section className="mm-page__section">
        <h2 className="mm-display mm-display--sm">Send feedback to the myMoodly team</h2>
        <p className="mm-body">Tell us what&apos;s missing, what&apos;s confusing, or what would make this better for you.</p>
        <label className="mm-field">
          <span className="mm-sr-only">Your feedback</span>
          <textarea className="mm-textarea" value={feedback} maxLength={1000} rows={4} onChange={(e) => setFeedback(e.target.value)} placeholder="What would make myMoodly better for you?" />
          <span className="mm-field__hint">{feedback.length}/1000</span>
        </label>
        <div className="mm-page__actions">
          <button type="button" className="mm-btn mm-btn--glass" disabled={feedbackSending || !feedback.trim()} onClick={() => onSendFeedback(feedback.trim(), () => setFeedback(''))}>
            {feedbackSending ? 'Sending…' : 'Send feedback'}
          </button>
        </div>
      </section>

      <section className="mm-page__section">
        <div className="mm-page__actions">
          <button type="button" className="mm-btn mm-btn--quiet" disabled={busy} onClick={onSignOut}>
            {busy ? 'Working…' : 'Sign out'}
          </button>
          <button type="button" className="mm-btn mm-btn--quiet mm-danger-link" disabled={busy} onClick={() => setConfirmDelete(true)}>
            Delete account &amp; data
          </button>
        </div>
      </section>

      <AnimatePresence>
        {confirmDelete && (
          <Sheet title="Delete your account?" onClose={() => setConfirmDelete(false)}>
            <p className="mm-sheet__text">
              This permanently deletes your profile, mood check-ins, and conversation history. This can&apos;t be undone. Any feedback you&apos;ve sent us or reports tied to your account are kept
              as safety records, as described in our <Link href="/privacy">Privacy Policy</Link>.
            </p>
            <button
              type="button"
              className="mm-btn mm-btn--primary mm-btn--block mm-btn--danger"
              disabled={busy}
              onClick={() => {
                setConfirmDelete(false);
                onDeleteAccount();
              }}
            >
              {busy ? 'Deleting…' : 'Yes, delete everything'}
            </button>
            <button type="button" className="mm-btn mm-btn--quiet mm-btn--block" disabled={busy} onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
          </Sheet>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
