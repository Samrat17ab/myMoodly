'use client';

import { useSvgId } from '../../lib/useSvgId';

/** Golden hour: a calm shore, slow waves washing in. */
export function GoldenShore() {
  const id = useSvgId('shore');
  return (
    <div className="mm-scene mm-scene--golden">
      <svg className="mm-scene__svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E9D6C0" />
            <stop offset="0.5" stopColor="#EEC9A6" />
            <stop offset="0.62" stopColor="#E6BCA2" />
          </linearGradient>
          <linearGradient id={`${id}-sea`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#C9C6B8" />
            <stop offset="1" stopColor="#7B9A97" />
          </linearGradient>
          <radialGradient id={`${id}-sun`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#FFF1D8" stopOpacity="1" />
            <stop offset="1" stopColor="#FFF1D8" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className="mm-anim-ken">
          <rect width="1440" height="570" fill={`url(#${id}-sky)`} />
          <circle cx="1120" cy="560" r="320" fill={`url(#${id}-sun)`} opacity="0.8" />
          <circle className="mm-anim-breathe" cx="1120" cy="556" r="56" fill="#FFF3DE" />
          <path d="M0 540C60 520 120 500 190 504C250 508 290 530 340 548L360 566H0Z" fill="#8D8F83" opacity="0.8" />
          <rect y="562" width="1440" height="200" fill={`url(#${id}-sea)`} />
          <ellipse cx="1120" cy="640" rx="60" ry="80" fill="#FFF0D8" opacity="0.35" />
          <g stroke="#FFF6E8" strokeWidth="2" strokeLinecap="round" opacity="0.7" fill="none">
            <path className="mm-anim-wave" d="M1040 600H1200" />
            <path className="mm-anim-wave" d="M1070 626H1170" style={{ animationDelay: '-3s' }} />
            <path className="mm-anim-wave" d="M300 660C360 654 420 654 480 660" style={{ animationDelay: '-5s' }} />
            <path className="mm-anim-wave" d="M700 690C780 684 860 684 940 690" style={{ animationDelay: '-2s' }} />
          </g>
          <path className="mm-anim-wash" d="M0 752C240 730 480 744 720 750C960 756 1200 732 1440 744V790H0Z" fill="#F4E9D8" />
          <rect y="768" width="1440" height="132" fill="#E6D4BA" />
        </g>
      </svg>
    </div>
  );
}
