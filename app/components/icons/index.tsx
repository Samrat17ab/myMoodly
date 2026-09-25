import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base(props: IconProps) {
  const { size = 20, ...rest } = props;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };
}

/** Line-icon set replacing every unicode glyph used as an icon in the legacy UI. */

export function IconBack(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M14.5 5.5c-2.8 2-6.2 4.6-9 6.5 2.8 1.9 6.2 4.5 9 6.5" />
    </svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 12.5l4.5 4.5L19.5 7" />
    </svg>
  );
}

export function IconSend(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 18.5V6M12 6c-1.9 1.9-3.4 3.3-5.3 4.9M12 6c1.9 1.9 3.4 3.3 5.3 4.9" />
    </svg>
  );
}

export function IconMore(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="6.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconHelp(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 19c-3.6-2.6-7-5.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 3.6-3.4 6.4-7 9Z" />
    </svg>
  );
}

export function IconSound(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 10v4h3.2L12 17.5v-11L7.2 10H4Z" />
      <path d="M16 9.2a4 4 0 0 1 0 5.6M18.5 6.7a7.7 7.7 0 0 1 0 10.6" />
    </svg>
  );
}

export function IconSoundOff(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 10v4h3.2L12 17.5v-11L7.2 10H4Z" />
      <path d="M16 10l4 4M20 10l-4 4" />
    </svg>
  );
}

export function IconScene(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="8" cy="8" r="2" />
      <path d="M3.5 18l5-6 3.2 3.6L15 11l5.5 7Z" />
    </svg>
  );
}

/** "Someone who feels similar" — two close, aligned circles. */
export function IconSimilar(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="9.5" cy="12" r="4.2" />
      <circle cx="14.5" cy="12" r="4.2" />
    </svg>
  );
}

/** "Someone in a different headspace" — two circles drawn apart. */
export function IconDifferent(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="6.3" cy="12" r="3.3" />
      <circle cx="17.7" cy="12" r="3.3" />
      <path d="M10.6 12h2.8" strokeDasharray="0.5 3" />
    </svg>
  );
}

/** Thank-you leaf, offered at the end of a conversation. */
export function IconLeaf(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 18C5 11 9.5 5.5 18 5c.6 8.4-5 13-12 13Z" />
      <path d="M7 17c2.6-3.4 4.6-6 8.5-9.6" />
    </svg>
  );
}

export function IconReport(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 4v16" />
      <path d="M6 5c3-1.4 5 1.4 8 0v7c-3 1.4-5-1.4-8 0Z" />
    </svg>
  );
}

export function IconBlock(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M7 17l10-10" />
    </svg>
  );
}

export function IconEnd(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M13 8l4.5 4-4.5 4M17 12H9" />
    </svg>
  );
}

export function IconPhone(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 4.5c1 0 2.6.3 3 1.3.4 1 .6 2 .9 2.7.2.5 0 .9-.3 1.2l-1 .9c.9 2 2.4 3.5 4.4 4.4l.9-1c.3-.3.7-.5 1.2-.3.7.3 1.7.5 2.7.9 1 .4 1.3 2 1.3 3 0 1-.8 1.9-1.8 1.9C10.8 19.4 4.6 13.2 4.1 6.3 4.1 5.3 5 4.5 6 4.5Z" />
    </svg>
  );
}

export function IconPlay(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 5.5v13l10-6.5Z" />
    </svg>
  );
}

/** Energy: quiet vs buzzing. */
export function IconEnergyHigh(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 16l3.5-8 3 6 2.5-5 3 5 3.5-6" />
    </svg>
  );
}

export function IconEnergyLow(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 12c2 0 2-2.4 4-2.4s2 2.4 4 2.4 2-2.4 4-2.4 2 2.4 4 2.4" />
    </svg>
  );
}

/** Pleasantness: a gentle, easy arc. */
export function IconPleasant(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 10c1.8 3.4 4.2 5 6 5s4.2-1.6 6-5" />
    </svg>
  );
}

export function IconUnpleasant(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 15c1.4-2.2 2.6-1 4-1.4 1-.3 1.4-2 2-2s1 1.7 2 2c1.4.4 2.6-.8 4 1.4" />
    </svg>
  );
}
