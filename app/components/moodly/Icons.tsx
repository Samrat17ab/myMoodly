import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const stroke = (size = 20): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
});

export const IconBack = ({ size, ...p }: IconProps) => (
  <svg {...stroke(size)} {...p}><path d="M14 5l-7 7 7 7" /></svg>
);
export const IconHelp = ({ size, ...p }: IconProps) => (
  <svg {...stroke(size)} {...p}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
);
export const IconSoundOn = ({ size, ...p }: IconProps) => (
  <svg {...stroke(size)} {...p}><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M17 8.5a5 5 0 0 1 0 7" /><path d="M19.5 6a8.5 8.5 0 0 1 0 12" /></svg>
);
export const IconSoundOff = ({ size, ...p }: IconProps) => (
  <svg {...stroke(size)} {...p}><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M17 9.5l4 5" /><path d="M21 9.5l-4 5" /></svg>
);
export const IconScene = ({ size, ...p }: IconProps) => (
  <svg {...stroke(size)} {...p}><path d="M3 19l6-9 4 5 3-4 5 8z" /><circle cx="17" cy="6" r="2" /></svg>
);
export const IconLeaf = ({ size, ...p }: IconProps) => (
  <svg {...stroke(size)} {...p}><path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15z" /><path d="M5 19l8-8" /></svg>
);
export const IconSimilar = ({ size, ...p }: IconProps) => (
  <svg {...stroke(size)} {...p}><circle cx="9" cy="12" r="6" /><circle cx="15" cy="12" r="6" /></svg>
);
export const IconDifferent = ({ size, ...p }: IconProps) => (
  <svg {...stroke(size)} {...p}><circle cx="6" cy="12" r="4" /><circle cx="18" cy="12" r="4" /><path d="M11 12h2" strokeDasharray="1 2" /></svg>
);
export const IconSend = ({ size, ...p }: IconProps) => (
  <svg {...stroke(size)} strokeWidth={1.8} {...p}><path d="M12 19V6" /><path d="M6 11l6-6 6 6" /></svg>
);
export const IconShield = ({ size, ...p }: IconProps) => (
  <svg {...stroke(size)} {...p}><path d="M12 3l7 3v5c0 5-3.2 8.4-7 10-3.8-1.6-7-5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>
);
export const IconClose = ({ size, ...p }: IconProps) => (
  <svg {...stroke(size)} {...p}><path d="M6 6l12 12" /><path d="M18 6L6 18" /></svg>
);
export const IconCheck = ({ size, ...p }: IconProps) => (
  <svg {...stroke(size)} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const IconPhone = ({ size, ...p }: IconProps) => (
  <svg {...stroke(size)} {...p}><path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z" /></svg>
);
export const IconMore = ({ size = 20, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
  </svg>
);
export const IconGoogle = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.6 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.5 5.8c4.4-4 6.8-10 6.8-17.2z" />
    <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.3.8-4.7l-7.8-6C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.8 6C6.6 42.6 14.6 48 24 48z" />
  </svg>
);
