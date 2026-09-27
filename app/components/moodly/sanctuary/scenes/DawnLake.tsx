'use client';

import { useSvgId } from '../../lib/useSvgId';

const TREES: [number, number, number, number][] = [
  [8, 552, 22, 66], [30, 530, 30, 88], [62, 560, 20, 58], [84, 540, 26, 78], [112, 566, 18, 52],
  [132, 548, 24, 70], [160, 574, 16, 46], [180, 560, 20, 60], [204, 580, 14, 42], [222, 572, 18, 50],
  [1188, 584, 16, 46], [1210, 566, 22, 64], [1238, 574, 18, 54], [1262, 548, 26, 80], [1292, 562, 22, 64],
  [1318, 538, 30, 90], [1352, 556, 24, 70], [1380, 540, 28, 86], [1412, 560, 24, 68],
];

/** Dawn: mist lifting off a mountain lake. The rising sun is the Moodlight. */
export function DawnLake() {
  const id = useSvgId('dawn');
  return (
    <div className="mm-scene mm-scene--dawn">
      <svg className="mm-scene__svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#BCD1D5" />
            <stop offset="0.42" stopColor="#E2E2D6" />
            <stop offset="0.66" stopColor="#F6E5CD" />
          </linearGradient>
          <linearGradient id={`${id}-lake`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#EADFCB" />
            <stop offset="0.3" stopColor="#BACAC4" />
            <stop offset="1" stopColor="#5F827C" />
          </linearGradient>
          <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#FFF4DD" stopOpacity="0.95" />
            <stop offset="1" stopColor="#FFF4DD" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}-sun`} cx="0.36" cy="0.32" r="0.7">
            <stop offset="0" stopColor="#FFF9EC" />
            <stop offset="0.45" stopColor="#F4D9A6" />
            <stop offset="1" stopColor="#DDB173" />
          </radialGradient>
          <filter id={`${id}-blur`}>
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <symbol id={`${id}-tree`} viewBox="0 0 20 60">
            <path d="M10 0L16 18H13L18 34H14L20 52H11V60H9V52H0L6 34H2L7 18H4Z" />
          </symbol>
        </defs>
        <g className="mm-anim-ken">
          <rect width="1440" height="600" fill={`url(#${id}-sky)`} />
          <circle className="mm-anim-halo" cx="1010" cy="500" r="330" fill={`url(#${id}-glow)`} opacity="0.8" />
          <circle className="mm-anim-breathe" cx="1010" cy="500" r="60" fill={`url(#${id}-sun)`} />
          <path d="M0 520C160 470 260 430 380 450C470 465 520 400 620 380C720 360 800 440 900 450C1000 460 1100 380 1210 390C1300 398 1380 450 1440 470V600H0Z" fill="#B3C4C1" opacity="0.8" />
          <path d="M0 560C120 530 220 500 330 520C430 540 520 490 640 500C760 510 860 555 980 548C1100 541 1200 505 1310 515C1370 520 1410 535 1440 540V602H0Z" fill="#809E98" />
          <rect y="598" width="1440" height="302" fill={`url(#${id}-lake)`} />
          <path d="M0 600C120 626 220 650 330 634C430 620 520 668 640 660C760 652 860 612 980 618C1100 624 1200 660 1310 650C1370 645 1410 632 1440 628V600Z" fill="#8FA8A2" opacity="0.4" />
          <ellipse cx="1010" cy="690" rx="46" ry="140" fill="#FFF3DC" opacity="0.4" filter={`url(#${id}-blur)`} />
          <g stroke="#FFF8EC" strokeWidth="2" strokeLinecap="round">
            <line className="mm-anim-ripple" x1="950" y1="646" x2="1070" y2="646" />
            <line className="mm-anim-ripple" x1="975" y1="676" x2="1045" y2="676" style={{ animationDelay: '-2s' }} />
            <line className="mm-anim-ripple" x1="930" y1="712" x2="1090" y2="712" style={{ animationDelay: '-4s' }} />
            <line className="mm-anim-ripple" x1="990" y1="752" x2="1030" y2="752" style={{ animationDelay: '-1s' }} />
          </g>
          <path d="M0 612C80 603 170 606 270 614C300 617 330 620 350 626V648H0Z" fill="#2E574E" />
          <path d="M1170 628C1240 612 1330 606 1440 604V648H1150Z" fill="#2E574E" />
          <g fill="#234A41">
            {TREES.map(([x, y, w, h], i) => (
              <use key={i} href={`#${id}-tree`} x={x} y={y} width={w} height={h} />
            ))}
          </g>
        </g>
        <g className="mm-anim-fly">
          <g transform="translate(0 250)" stroke="#3B544F" strokeWidth="1.6" fill="none" strokeLinecap="round">
            <path d="M0 0q7-6 14 0q7-6 14 0" />
            <path d="M36 14q5-4 10 0q5-4 10 0" />
            <path d="M18 30q4-3 8 0q4-3 8 0" />
          </g>
        </g>
      </svg>
      <span className="mm-mist" style={{ left: '-7%', top: '60%', width: '70%', height: 110 }} />
      <span className="mm-mist" style={{ left: '48%', top: '64%', width: '62%', height: 90, animationDelay: '-18s' }} />
    </div>
  );
}
