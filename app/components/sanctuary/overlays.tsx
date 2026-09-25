// Lightweight CSS-driven overlay effects layered on top of a scene's gradient
// poster. No media dependency — see SCENES_README.md for the real assets
// these are standing in for. Positions/delays are derived deterministically
// from index (not Math.random()) so server and client render identically.

function seeded(i: number, salt = 0) {
  const n = (i + 1) * 9301 + salt * 49297;
  return ((n * 9301 + 49297) % 233280) / 233280;
}

export function Clouds() {
  const items = Array.from({ length: 3 });
  return (
    <div className="sanctuary-layer sanctuary-clouds" aria-hidden>
      {items.map((_, i) => (
        <div
          key={i}
          className="sanctuary-cloud"
          style={{
            top: `${8 + seeded(i) * 30}%`,
            width: `${220 + seeded(i, 1) * 180}px`,
            opacity: 0.35 + seeded(i, 2) * 0.25,
            animationDuration: `${70 + seeded(i, 3) * 50}s`,
            animationDelay: `${-seeded(i, 4) * 60}s`,
          }}
        />
      ))}
    </div>
  );
}

export function Stars() {
  const items = Array.from({ length: 36 });
  return (
    <div className="sanctuary-layer sanctuary-stars" aria-hidden>
      {items.map((_, i) => (
        <span
          key={i}
          className="sanctuary-star"
          style={{
            top: `${seeded(i) * 70}%`,
            left: `${seeded(i, 1) * 100}%`,
            animationDelay: `${seeded(i, 2) * 6}s`,
            animationDuration: `${3 + seeded(i, 3) * 3}s`,
          }}
        />
      ))}
      <span className="sanctuary-shooting-star" />
    </div>
  );
}

export function Aurora() {
  return (
    <div className="sanctuary-layer sanctuary-aurora" aria-hidden>
      <div className="sanctuary-aurora-ribbon a1" />
      <div className="sanctuary-aurora-ribbon a2" />
    </div>
  );
}

export function Mist() {
  return (
    <div className="sanctuary-layer sanctuary-mist" aria-hidden>
      <div className="sanctuary-mist-band m1" />
      <div className="sanctuary-mist-band m2" />
    </div>
  );
}

export function Fireflies() {
  const items = Array.from({ length: 12 });
  return (
    <div className="sanctuary-layer sanctuary-fireflies" aria-hidden>
      {items.map((_, i) => (
        <span
          key={i}
          className="sanctuary-firefly"
          style={{
            top: `${40 + seeded(i) * 50}%`,
            left: `${seeded(i, 1) * 100}%`,
            animationDelay: `${seeded(i, 2) * 5}s`,
            animationDuration: `${5 + seeded(i, 3) * 4}s`,
          }}
        />
      ))}
    </div>
  );
}

export function Rain() {
  const items = Array.from({ length: 24 });
  return (
    <div className="sanctuary-layer sanctuary-rain" aria-hidden>
      {items.map((_, i) => (
        <span
          key={i}
          className="sanctuary-raindrop"
          style={{
            left: `${seeded(i) * 100}%`,
            animationDelay: `${-seeded(i, 1) * 2}s`,
            animationDuration: `${0.7 + seeded(i, 2) * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}

function BirdMark({ className }: { className: string }) {
  return (
    <svg className={className} width="20" height="10" viewBox="0 0 20 10" aria-hidden>
      <path
        d="M1 6c2-4 4.5-4 6-1 1.5-3 4-3 6 0M9 5c2-4 4.5-4 6-1 1.5-3 3-3 4-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Birds() {
  return (
    <div className="sanctuary-layer sanctuary-birds" aria-hidden>
      <BirdMark className="sanctuary-bird b1" />
      <BirdMark className="sanctuary-bird b2" />
    </div>
  );
}

export function Grass() {
  const items = Array.from({ length: 14 });
  return (
    <div className="sanctuary-layer sanctuary-grass" aria-hidden>
      {items.map((_, i) => (
        <span
          key={i}
          className="sanctuary-blade"
          style={{
            left: `${(i / 14) * 100 + seeded(i) * 3}%`,
            height: `${26 + seeded(i, 1) * 22}px`,
            animationDelay: `${-seeded(i, 2) * 4}s`,
          }}
        />
      ))}
    </div>
  );
}

export const OVERLAY_COMPONENTS = { clouds: Clouds, stars: Stars, aurora: Aurora, mist: Mist, fireflies: Fireflies, rain: Rain, birds: Birds, grass: Grass };
