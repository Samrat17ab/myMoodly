"use client";
import { useState } from "react";
import Link from "next/link";
import { MotionButton } from "@/app/components/shared/MotionButton";
import { Modal } from "@/app/components/shared/Modal";
import { Sanctuary } from "@/app/components/sanctuary/Sanctuary";
import { IconBack, IconCheck } from "@/app/components/icons";
import { COUNTRIES, LANGUAGES, initialsFor, type Profile } from "@/app/lib/profile";

export function Settings({
  profile,
  setProfile,
  email,
  nickname,
  usage,
  busy,
  onBack,
  onSave,
  onSignOut,
  onDeleteAccount,
  feedbackSending,
  onSendFeedback,
}: {
  profile: Profile;
  setProfile: (p: Profile) => void;
  email: string;
  nickname: string;
  usage: number;
  busy: boolean;
  onBack: () => void;
  onSave: () => void;
  onSignOut: () => void;
  onDeleteAccount: () => void;
  feedbackSending: boolean;
  onSendFeedback: (body: string, afterSend: () => void) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const toggleLanguage = (l: string) =>
    setProfile({
      ...profile,
      languages: profile.languages.includes(l) ? profile.languages.filter((x) => x !== l) : [...profile.languages, l],
    });

  return (
    <section className="settings-view">
      <Sanctuary mode="softened" showControls={false} />
      <MotionButton className="back" onClick={onBack} aria-label="Back">
        <IconBack size={16} />
      </MotionButton>
      <p className="settings-eyebrow">Account settings</p>
      <h1>Your private profile</h1>
      <p className="settings-lede">These details are never visible to conversation partners.</p>

      <div className="settings-card">
        <span className="settings-avatar">{initialsFor(nickname, email)}</span>
        <div>
          <b>Signed in as</b>
          <p>{email}</p>
          <p>
            Conversation partners see you as <b>{nickname || "…"}</b> &middot; changes every 24 hours
          </p>
        </div>
      </div>
      <div className="settings-card">
        <span className="settings-avatar settings-avatar--usage">{usage}/10</span>
        <div>
          <b>Today&apos;s connections</b>
          <p>{usage} of 10 free connections used &middot; resets at midnight UTC</p>
        </div>
      </div>

      <div className="field-grid">
        <label className="field">
          Age <span className="field-hint">18+ only</span>
          <input
            type="number"
            min="18"
            max="100"
            value={profile.age}
            onChange={(e) => setProfile({ ...profile, age: e.target.value })}
            placeholder="Your age"
          />
        </label>
        <label className="field">
          Gender
          <select value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })}>
            <option value="">Choose an option</option>
            <option>Woman</option>
            <option>Man</option>
            <option>Non-binary</option>
            <option>Prefer not to say</option>
            <option>Self-describe</option>
          </select>
        </label>
        {profile.gender === "Self-describe" && (
          <label className="field field-full">
            How you describe yourself
            <input
              value={profile.customGender}
              onChange={(e) => setProfile({ ...profile, customGender: e.target.value })}
            />
          </label>
        )}
        <label className="field">
          Country
          <select value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })}>
            {COUNTRIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <fieldset className="field-full language-field">
          <legend>
            Languages you know <span className="field-hint">Optional</span>
          </legend>
          <div className="language-chips">
            {LANGUAGES.map((l) => {
              const on = profile.languages.includes(l);
              return (
                <MotionButton
                  key={l}
                  type="button"
                  className={`language-chip${on ? " is-on" : ""}`}
                  onClick={() => toggleLanguage(l)}
                >
                  {on && <IconCheck size={13} />}
                  {l}
                </MotionButton>
              );
            })}
          </div>
        </fieldset>
      </div>
      <MotionButton className="primary" disabled={busy} onClick={onSave}>
        Save changes
      </MotionButton>

      <div className="settings-card settings-feedback">
        <div>
          <b>Send feedback to the myMoodly team</b>
          <p>Tell us what&apos;s missing, what&apos;s confusing, or what would make this better for you.</p>
          <div className="note-box">
            <textarea
              value={feedbackText}
              maxLength={1000}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="What would make myMoodly better for you?"
            />
            <span>{feedbackText.length}/1000</span>
          </div>
          <MotionButton
            className="primary"
            disabled={feedbackSending || !feedbackText.trim()}
            onClick={() => onSendFeedback(feedbackText.trim(), () => setFeedbackText(""))}
          >
            {feedbackSending ? "Sending…" : "Send feedback"}
          </MotionButton>
        </div>
      </div>

      <div className="settings-actions">
        <MotionButton className="text-button" disabled={busy} onClick={onSignOut}>
          {busy ? "Working…" : "Sign out"}
        </MotionButton>
        <MotionButton className="text-button danger" disabled={busy} onClick={() => setConfirmDelete(true)}>
          Delete account &amp; data
        </MotionButton>
      </div>

      {confirmDelete && (
        <Modal title="Delete your account?" onClose={() => setConfirmDelete(false)}>
          <p className="modal-copy">
            This permanently deletes your profile, mood check-ins, and conversation history. This can&apos;t be
            undone. Any feedback you&apos;ve sent us or reports tied to your account are kept as safety records, as
            described in our <Link href="/privacy">Privacy Policy</Link>.
          </p>
          <MotionButton
            className="primary wide danger-solid"
            disabled={busy}
            onClick={() => {
              setConfirmDelete(false);
              onDeleteAccount();
            }}
          >
            {busy ? "Deleting…" : "Yes, delete everything"}
          </MotionButton>
          <MotionButton className="text-button" disabled={busy} onClick={() => setConfirmDelete(false)}>
            Cancel
          </MotionButton>
        </Modal>
      )}
    </section>
  );
}
