'use client';

import { MoodMap } from '../MoodMap';
import { describeMood, QUADRANT_CENTER, QUADRANTS, QUADRANT_NAME, type MoodPoint } from '../lib/mood';

interface Props {
  point: MoodPoint;
  touched: boolean;
  onChange: (p: MoodPoint) => void;
  onNext: () => void;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function MoodMapStep({ point, touched, onChange, onNext }: Props) {
  const d = describeMood(point);
  return (
    <div className="mm-mapstep">
      <div className="mm-steptitle">
        <h1 className="mm-display mm-display--lg">Where are you right now?</h1>
        <p className="mm-lede">Tap the spot that feels closest. Up is more energy, right feels better.</p>
      </div>
      <div className="mm-mapstep__body">
        <MoodMap value={point} onChange={onChange} size="lg" layoutId="mm-checkin-light" className="mm-mapstep__map" />
        <div className="mm-mapstep__side">
          <div className="mm-mapstep__reading" aria-live="polite">
            <span className="mm-fine">{touched ? 'Your light says' : 'Your light is waiting'}</span>
            <span className="mm-display mm-display--md">{touched ? d.label : 'Somewhere in the middle'}</span>
            <p className="mm-body">{touched ? d.hint : 'Drag it, tap anywhere, or use the arrow keys.'}</p>
            {touched && <p className="mm-fine">Not quite right? Tap again, as often as you like.</p>}
          </div>
          <div className="mm-mapstep__quads">
            <span className="mm-fine">Or choose a feeling area</span>
            <div className="mm-mapstep__quadgrid">
              {QUADRANTS.map((q) => {
                const on = touched && d.quadrant === q;
                return (
                  <button key={q} type="button" className={`mm-choicepill${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => onChange(QUADRANT_CENTER[q])}>
                    {cap(QUADRANT_NAME[q])}
                  </button>
                );
              })}
            </div>
            <button type="button" className="mm-btn mm-btn--primary mm-btn--block" onClick={onNext} disabled={!touched}>
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
