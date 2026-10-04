import Link from "next/link";

// Plain <a> on purpose: the app reads its starting screen from the URL when it
// first loads, and a client-side <Link> transition hands it the old blog URL,
// which leaves visitors on the landing page instead of the sign-in screen.
export const SIGN_IN_HREF = "/signin";

/** A quiet one-line invitation inside an article. */
export function CheckInInline() {
  return (
    <aside className="mm-cta-inline">
      <span className="mm-cta-inline__light" aria-hidden="true" />
      <p>
        Want to talk it through? <strong>Check in</strong> and chat anonymously with one real person.
      </p>
      <a href={SIGN_IN_HREF} className="mm-cta-inline__link">
        Check in
        <span aria-hidden="true" className="mm-cta-inline__arrow">
          →
        </span>
      </a>
    </aside>
  );
}

/** The closing invitation at the end of an article or the blog index. */
export function CheckInPanel({ heading = "Reading helps. Talking helps too." }: { heading?: string }) {
  return (
    <section className="mm-cta-panel" aria-labelledby="mm-cta-panel-title">
      <div className="mm-cta-panel__glow" aria-hidden="true" />
      <p className="mm-cta-panel__overline">myMoodly</p>
      <h2 id="mm-cta-panel-title" className="mm-cta-panel__title">
        {heading}
      </h2>
      <p className="mm-cta-panel__text">
        Name how you feel, then talk it through with one real person for twenty minutes. Anonymous, no profile, nothing
        to keep up.
      </p>
      <div className="mm-cta-panel__actions">
        <a href={SIGN_IN_HREF} className="mm-btn mm-btn--primary">
          Check in
        </a>
        <Link href="/#how" className="mm-link">
          See how it works
        </Link>
      </div>
      <p className="mm-fine">Free, for adults 18 and over. Not a crisis service.</p>
    </section>
  );
}
