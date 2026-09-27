'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { IconBack, IconGoogle, IconScene, IconShield } from '../Icons';
import { Sanctuary } from '../sanctuary/Sanctuary';
import { useSanctuary } from '../sanctuary/SanctuaryProvider';

interface Props {
  /** starts the existing Google sign-in */
  onGoogle: () => void;
  onBack: () => void;
  loading?: boolean;
  error?: string | null;
  termsHref?: string;
  privacyHref?: string;
  /** optional extra sign-in method (the email-code flow, when it's enabled) */
  children?: ReactNode;
}

export function SignInPanel({ onGoogle, onBack, loading, error, termsHref = '/terms', privacyHref = '/privacy', children }: Props) {
  const { scene, ready } = useSanctuary();
  return (
    <div className="mm-auth">
      <section className="mm-auth__scene">
        <Sanctuary fixed={false} />
        <div className="mm-auth__scene-scrim" aria-hidden="true" />
        <header className="mm-auth__top">
          <button type="button" className="mm-iconbtn mm-iconbtn--on-scene" onClick={onBack} aria-label="Back">
            <IconBack />
          </button>
          <span className="mm-auth__brand">myMoodly</span>
        </header>
        <div className="mm-auth__quote">
          <p className="mm-display mm-display--md mm-rise">Sometimes all you need is someone who gets it.</p>
          <p className="mm-auth__sub mm-rise mm-d1">A private place to talk, without the pressure.</p>
        </div>
        {ready && (
          <p className="mm-auth__scene-name">
            <IconScene size={18} /> {scene.title}
          </p>
        )}
      </section>

      <section className="mm-auth__form">
        <div className="mm-auth__inner">
          <h1 className="mm-display mm-display--lg mm-rise">Let&apos;s find you a quiet corner.</h1>
          <p className="mm-lede mm-rise mm-d1">Sign in to check in with yourself and talk anonymously. Your name and photo are never shown to anyone.</p>
          <button type="button" className="mm-google mm-rise mm-d2" onClick={onGoogle} disabled={loading}>
            <IconGoogle />
            {loading ? 'Opening Google…' : 'Continue with Google'}
          </button>
          {error && (
            <p className="mm-error" role="alert">
              {error}
            </p>
          )}
          {children}
          <p className="mm-fine mm-rise mm-d3">
            By continuing you agree to the <Link href={termsHref} className="mm-link">Terms</Link> and{' '}
            <Link href={privacyHref} className="mm-link">Privacy Policy</Link>, and understand that myMoodly is peer support, not a crisis service.
          </p>
          <div className="mm-auth__note mm-rise mm-d3">
            <IconShield size={22} />
            <p>From Google we use an account ID and your verified email, only to keep your account secure. We never touch Gmail, Drive, Contacts or Calendar.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
