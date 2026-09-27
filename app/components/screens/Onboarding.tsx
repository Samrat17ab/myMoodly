"use client";
import Link from "next/link";
import { Brand } from "@/app/components/shared/Brand";
import { MotionButton } from "@/app/components/shared/MotionButton";
import { Sanctuary } from "@/app/components/sanctuary/Sanctuary";
import { IconCheck, IconHelp } from "@/app/components/icons";
import { COUNTRIES, LANGUAGES, type Profile } from "@/app/lib/profile";

export function Onboarding({
  profile,
  setProfile,
  onDone,
  toast,
  onHelp,
}: {
  profile: Profile;
  setProfile: (p: Profile) => void;
  onDone: () => void;
  toast: string;
  onHelp: () => void;
}) {
  const toggleLanguage = (l: string) =>
    setProfile({
      ...profile,
      languages: profile.languages.includes(l) ? profile.languages.filter((x) => x !== l) : [...profile.languages, l],
    });

  return (
    <section className="onboarding-view">
      <Sanctuary mode="softened" showControls={false} />
      <header className="onboarding-head">
        <Brand />
        <span className="onboarding-time">Private setup &middot; about a minute</span>
      </header>
      <div className="onboarding-card">
        <h1>Just enough to keep myMoodly safe.</h1>
        <p>This information is never shown to anyone you match with.</p>
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
        <label className="onboarding-terms">
          <input
            type="checkbox"
            checked={profile.terms}
            onChange={(e) => setProfile({ ...profile, terms: e.target.checked })}
          />
          <span>
            I agree to myMoodly&apos;s <Link href="/terms">Terms &amp; Conditions</Link> and acknowledge the{" "}
            <Link href="/privacy">Privacy Policy</Link>. I understand myMoodly is 18+, anonymous but reportable, and
            not a crisis service.
          </span>
        </label>
        <MotionButton className="primary large" onClick={onDone}>
          Complete setup
        </MotionButton>
      </div>
      {toast && <div className="toast">{toast}</div>}
      <MotionButton className="app-help-pill onboarding-help" onClick={onHelp}>
        <IconHelp size={14} /> Need help now?
      </MotionButton>
    </section>
  );
}
