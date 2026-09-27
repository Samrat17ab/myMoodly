import { makeStars } from '../lib/stars';

export function Stars({ count = 70, seed = 7, maxY = 70 }: { count?: number; seed?: number; maxY?: number }) {
  const stars = makeStars(count, seed, maxY);
  return (
    <div className="mm-stars">
      {stars.map((s, i) => (
        <span
          key={i}
          className="mm-star"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r, height: s.r, animationDelay: `${s.d}s` }}
        />
      ))}
    </div>
  );
}
