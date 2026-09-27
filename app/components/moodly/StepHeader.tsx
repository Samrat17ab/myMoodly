'use client';

import { HelpButton } from './HelpButton';
import { IconBack } from './Icons';

interface Props {
  step: number;
  total: number;
  onBack: () => void;
}

/** Same header on every check-in step: back, progress, help. Never clipped. */
export function StepHeader({ step, total, onBack }: Props) {
  return (
    <header className="mm-stepheader">
      <button type="button" className="mm-iconbtn" onClick={onBack} aria-label="Back">
        <IconBack />
      </button>
      <div className="mm-stepheader__progress" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step} aria-label={`Step ${step} of ${total}`}>
        <span className="mm-stepheader__label">
          Step {step} of {total}
        </span>
        <span className="mm-stepheader__bars">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`mm-stepheader__bar${i < step ? ' is-done' : ''}`} />
          ))}
        </span>
      </div>
      <HelpButton className="mm-hide-sm" />
      <HelpButton variant="icon" className="mm-show-sm" />
    </header>
  );
}
