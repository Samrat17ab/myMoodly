'use client';

import { useSvgId } from '../../lib/useSvgId';

const GRASS = [
  'M880 900Q884 860 876 826', 'M896 900Q898 868 906 840', 'M912 900Q910 874 918 852',
  'M1240 900Q1244 850 1236 818', 'M1256 900Q1258 862 1268 834', 'M1274 900Q1272 870 1280 848',
  'M1380 900Q1384 862 1376 830', 'M140 900Q144 866 136 838', 'M156 900Q158 872 166 850',
];

/** Day: clouds drifting over a wide meadow, horses grazing far away. */
export function DayMeadow() {
  const id = useSvgId('meadow');
  return (
    <div className="mm-scene mm-scene--day">
      <svg className="mm-scene__svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#A8C7D7" />
            <stop offset="0.5" stopColor="#D6E5E3" />
            <stop offset="0.68" stopColor="#EDF2E8" />
          </linearGradient>
          <symbol id={`${id}-horse`} viewBox="0 0 40 24">
            <path d="M6 8C10 5 24 5 30 8C33 9 35 12 38 18L36 19C34 15 32 13 30 13L29 22H27L26 14H12L11 22H9L9 14C7 13 5 12 4 10L2 15H1L2 9C3 8 4 8 6 8Z" />
          </symbol>
        </defs>
        <rect width="1440" height="900" fill={`url(#${id}-sky)`} />
        <path d="M0 560C200 520 380 530 560 548C760 568 940 520 1120 510C1260 502 1360 520 1440 530V900H0Z" fill="#BACFB3" />
        <path d="M0 620C180 590 360 600 540 616C720 632 900 598 1080 594C1240 590 1360 606 1440 616V900H0Z" fill="#96B58F" />
        <g className="mm-anim-graze" fill="#3E5144">
          <use href={`#${id}-horse`} x="1010" y="590" width="30" height="18" />
          <use href={`#${id}-horse`} x="1060" y="596" width="26" height="16" />
        </g>
        <path d="M0 700C220 670 420 690 620 706C820 722 1020 688 1220 684C1320 682 1400 690 1440 696V900H0Z" fill="#71A077" />
        <path d="M0 800C240 770 480 786 720 800C960 814 1200 786 1440 790V900H0Z" fill="#4F8260" />
        <g stroke="#3F6F55" strokeWidth="2" fill="none" strokeLinecap="round">
          {GRASS.map((d, i) => (
            <path key={i} className="mm-anim-sway" d={d} style={{ animationDelay: `${-i * 0.7}s` }} />
          ))}
        </g>
        <g className="mm-anim-fly">
          <g transform="translate(0 200)" stroke="#40595A" strokeWidth="1.6" fill="none" strokeLinecap="round">
            <path d="M0 0q7-6 14 0q7-6 14 0" />
            <path d="M40 16q5-4 10 0q5-4 10 0" />
          </g>
        </g>
      </svg>
      <span className="mm-cloud" style={{ top: '13%', width: 380, height: 90, animationDelay: '-40s' }} />
      <span className="mm-cloud" style={{ top: '23%', width: 260, height: 64, animationDuration: '210s', animationDelay: '-120s' }} />
      <span className="mm-cloud" style={{ top: '8%', width: 300, height: 70, animationDuration: '190s', animationDelay: '-150s' }} />
    </div>
  );
}
