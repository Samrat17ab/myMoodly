"use client";

import Link from "next/link";
import { useEffect } from "react";
import { StatusPage } from "./components/moodly/pages/StatusPage";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage title="Something went quiet on our side.">
      <p className="mm-lede">This screen hit an error. Trying again usually fixes it. If you were in a conversation, it may have ended.</p>
      <div className="mm-page__actions">
        <button type="button" className="mm-btn mm-btn--primary" onClick={reset}>
          Try again
        </button>
        <Link href="/home" className="mm-link">
          Go to home
        </Link>
      </div>
    </StatusPage>
  );
}
