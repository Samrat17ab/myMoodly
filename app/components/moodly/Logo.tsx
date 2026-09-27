import Link from 'next/link';

interface Props {
  href?: string;
  /** in-app navigation: renders a button instead of a link */
  onClick?: () => void;
  size?: number;
  compact?: boolean;
}

/** Uses the existing /logo-mark.svg from /public. */
export function Logo({ href = '/', onClick, size = 44, compact = false }: Props) {
  const inner = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.svg" alt="" width={size} height={size} className="mm-logo__mark" />
      {!compact && <span className="mm-logo__word">myMoodly</span>}
    </>
  );
  if (onClick) {
    return (
      <button type="button" className="mm-logo" onClick={onClick} aria-label="myMoodly home">
        {inner}
      </button>
    );
  }
  return (
    <Link href={href} className="mm-logo" aria-label="myMoodly home">
      {inner}
    </Link>
  );
}
