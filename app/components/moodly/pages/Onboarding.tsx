'use client';

import Link from 'next/link';
import { IconCheck } from '../Icons';
import { PageShell } from './PageShell';
import { ProfileFields, type ProfileValue } from './ProfileFields';

interface Props {
  profile: ProfileValue;
  setProfile: (p: ProfileValue) => void;
  onDone: () => void;
}

export function Onboarding({ profile, setProfile, onDone }: Props) {
  return (
    <PageShell topbarExtra={<span className="mm-fine mm-hide-sm">Private setup &middot; about a minute</span>}>
      <div className="mm-page__head">
        <h1 className="mm-display mm-display--lg">Just enough to keep myMoodly safe.</h1>
        <p className="mm-lede">This information is never shown to anyone you match with.</p>
      </div>
      <ProfileFields profile={profile} setProfile={setProfile} />
      <label className="mm-check">
        <input type="checkbox" checked={profile.terms} onChange={(e) => setProfile({ ...profile, terms: e.target.checked })} />
        <span>
          I agree to the <Link href="/terms">Terms &amp; Conditions</Link> and acknowledge the <Link href="/privacy">Privacy Policy</Link>. I understand
          myMoodly is 18+, anonymous but reportable, and not a crisis service.
        </span>
      </label>
      <div className="mm-page__actions">
        <button type="button" className="mm-btn mm-btn--primary" onClick={onDone}>
          <IconCheck size={18} /> Complete setup
        </button>
      </div>
    </PageShell>
  );
}
