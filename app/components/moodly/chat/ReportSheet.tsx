'use client';

import { Sheet } from '../Sheet';

const REPORT_REASONS = ['Harassment or bullying', 'Sexual content', 'Hate or discrimination', 'Sharing personal information', 'Something else'];

interface Props {
  done: boolean;
  sending: boolean;
  onSubmit: (reason: string) => void;
  onClose: () => void;
  onContinue: () => void;
}

export function ReportSheet({ done, sending, onSubmit, onClose, onContinue }: Props) {
  return (
    <Sheet title={done ? 'Report received' : 'Report conversation'} onClose={onClose}>
      {done ? (
        <>
          <p className="mm-sheet__text">Thank you. Your report was recorded and this person won&apos;t be matched with you again.</p>
          <button type="button" className="mm-btn mm-btn--primary mm-btn--block" onClick={onContinue}>
            Continue
          </button>
        </>
      ) : (
        <>
          <p className="mm-sheet__text">What happened? Your report is private and recorded against this person&apos;s account.</p>
          <div className="mm-report__list">
            {REPORT_REASONS.map((reason) => (
              <button key={reason} type="button" className="mm-choicepill" disabled={sending} onClick={() => onSubmit(reason)}>
                {reason}
              </button>
            ))}
          </div>
        </>
      )}
    </Sheet>
  );
}
