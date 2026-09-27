'use client';

import { IconHelp } from './Icons';

export const OPEN_HELP_EVENT = 'mm:open-help';

export function openHelp() {
  window.dispatchEvent(new CustomEvent(OPEN_HELP_EVENT));
}

interface Props {
  variant?: 'pill' | 'icon' | 'inline';
  className?: string;
  label?: string;
}

/** "Need help now?" is on every screen. It opens the single <HelpSheet /> mounted at the app root. */
export function HelpButton({ variant = 'pill', className, label = 'Need help now?' }: Props) {
  if (variant === 'icon') {
    return (
      <button type="button" className={`mm-help mm-help--icon ${className ?? ''}`} onClick={openHelp} aria-label={label}>
        <IconHelp size={19} />
      </button>
    );
  }
  return (
    <button type="button" className={`mm-help mm-help--${variant} ${className ?? ''}`} onClick={openHelp}>
      {variant === 'pill' && <IconHelp size={17} />}
      {label}
    </button>
  );
}
