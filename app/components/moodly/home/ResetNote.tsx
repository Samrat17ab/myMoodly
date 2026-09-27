'use client';

import { useEffect, useState } from 'react';
import { nextResetLocalLabel } from '@/app/lib/time';

/** "Resets at 5:45 am your time": the backend resets at midnight UTC, shown in local time. */
export function ResetNote({ remaining, limit }: { remaining: number; limit: number }) {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const readLocalReset = () => setTime(nextResetLocalLabel());
    readLocalReset();
  }, []);
  if (remaining <= 0) {
    return <p className="mm-fine">You&apos;ve had all {limit} conversations for today. {time ? `More open up at ${time} your time.` : ''}</p>;
  }
  return (
    <p className="mm-fine">
      {remaining} {remaining === 1 ? 'conversation' : 'conversations'} left today.{time ? ` Resets at ${time} your time.` : ''}
    </p>
  );
}
