'use client';

import { IconBack } from '../Icons';
import { HELP_FOOT, HELP_TIPS, resourcesFor } from '../lib/resources';
import { PageShell, type HeaderNav } from './PageShell';

interface Props {
  nav: HeaderNav | null;
  country: string;
  onBack: () => void;
  onLogo: () => void;
}

/** The /help page: the same content as the help sheet, for direct links. */
export function HelpPage({ nav, country, onBack, onLogo }: Props) {
  const resources = resourcesFor(country);
  return (
    <PageShell nav={nav} onLogo={onLogo}>
      <button type="button" className="mm-iconbtn mm-page__back" onClick={onBack} aria-label="Back">
        <IconBack />
      </button>
      <div className="mm-page__head">
        <h1 className="mm-display mm-display--lg">You don&apos;t have to hold this alone.</h1>
        <p className="mm-lede">
          If you are in immediate danger or thinking about ending your life, please call your local emergency number now. myMoodly is peer support, not a crisis service.
        </p>
      </div>
      <ul className="mm-sheet__list">
        {resources.map((r) => (
          <li key={r.name}>
            <a className="mm-sheet__resource" href={r.href} target={r.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
              <span className="mm-sheet__resource-name">
                {r.name} &middot; {r.detail}
              </span>
              <span className="mm-sheet__resource-detail">{r.note}</span>
            </a>
          </li>
        ))}
      </ul>
      <section className="mm-page__section">
        <h2 className="mm-display mm-display--sm">While you reach out</h2>
        <ul className="mm-help-tips">
          {HELP_TIPS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p className="mm-fine">{HELP_FOOT}</p>
      </section>
    </PageShell>
  );
}
