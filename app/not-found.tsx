import type { Metadata } from "next";
import Link from "next/link";
import { StatusPage } from "./components/moodly/pages/StatusPage";

export const metadata: Metadata = {
  title: "Page not found | myMoodly",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <StatusPage title="This page wandered off.">
      <p className="mm-lede">The link may be old or mistyped. Nothing you shared is affected.</p>
      <div className="mm-page__actions">
        <Link href="/" className="mm-btn mm-btn--primary">
          Back to myMoodly
        </Link>
      </div>
    </StatusPage>
  );
}
