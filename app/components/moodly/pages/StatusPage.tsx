'use client';

import type { ReactNode } from 'react';
import { HelpSheet } from '../HelpSheet';
import { SanctuaryProvider } from '../sanctuary/SanctuaryProvider';
import { PageShell } from './PageShell';

/** A standalone page (404, something went wrong) outside the main app. */
export function StatusPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <SanctuaryProvider>
      <PageShell>
        <div className="mm-page__head">
          <h1 className="mm-display mm-display--lg">{title}</h1>
          {children}
        </div>
      </PageShell>
      <HelpSheet />
    </SanctuaryProvider>
  );
}
