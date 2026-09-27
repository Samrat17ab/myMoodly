'use client';

import { COUNTRIES, LANGUAGES, type Profile } from '@/app/lib/profile';
import { IconCheck } from '../Icons';

export type ProfileValue = Profile;

const GENDERS = ['Woman', 'Man', 'Non-binary', 'Prefer not to say', 'Self-describe'];

/** Age, gender, country and languages: shared by onboarding and settings. */
export function ProfileFields({ profile, setProfile }: { profile: ProfileValue; setProfile: (p: ProfileValue) => void }) {
  const toggle = (l: string) =>
    setProfile({ ...profile, languages: profile.languages.includes(l) ? profile.languages.filter((x) => x !== l) : [...profile.languages, l] });

  return (
    <div className="mm-fieldgrid">
      <label className="mm-field">
        <span>
          Age <span className="mm-field__hint">18+ only</span>
        </span>
        <input className="mm-input" type="number" min={18} max={100} inputMode="numeric" value={profile.age} onChange={(e) => setProfile({ ...profile, age: e.target.value })} placeholder="Your age" />
      </label>
      <label className="mm-field">
        Gender
        <select className="mm-input" value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })}>
          <option value="">Choose an option</option>
          {GENDERS.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </label>
      {profile.gender === 'Self-describe' && (
        <label className="mm-field mm-field--full">
          How you describe yourself
          <input className="mm-input" value={profile.customGender} onChange={(e) => setProfile({ ...profile, customGender: e.target.value })} />
        </label>
      )}
      <label className="mm-field">
        Country
        <select className="mm-input" value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })}>
          {COUNTRIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <fieldset className="mm-fieldset">
        <legend className="mm-field__legend">
          Languages you know <span className="mm-field__hint">Optional</span>
        </legend>
        <div className="mm-chiprow">
          {LANGUAGES.map((l) => {
            const on = profile.languages.includes(l);
            return (
              <button key={l} type="button" className={`mm-choicepill${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => toggle(l)}>
                {on && <IconCheck size={16} />}
                {l}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
