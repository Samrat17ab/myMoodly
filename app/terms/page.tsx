import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions | myMoodly",
  description:
    "The terms that govern using myMoodly's mood check-ins and anonymous conversations.",
};

const effectiveDate = "July 31, 2026";

export default function TermsAndConditions() {
  return (
    <main className="legal-page">
      <header className="legal-header">
        <Link className="brand legal-brand" href="/" aria-label="myMoodly home">
          <span>m</span>
          <b>myMoodly</b>
        </Link>
        <Link className="legal-home-link" href="/">
          Back to myMoodly
        </Link>
      </header>

      <article className="legal-document">
        <div className="legal-intro">
          <p className="overline">TERMS OF USE</p>
          <h1>Terms &amp; Conditions</h1>
          <p className="legal-effective">Effective and last updated: {effectiveDate}</p>
          <p>
            These Terms &amp; Conditions (&quot;Terms&quot;) govern your use of
            myMoodly, an 18+ mood check-in and anonymous conversation service
            operated by Samrat Lamsal in Nepal. By creating an account or
            using myMoodly, you agree to these Terms and to our{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </div>

        <section>
          <h2>1. Eligibility</h2>
          <p>
            myMoodly is available only to people aged 18 or older. By using
            myMoodly, you confirm that you are at least 18 and that you have
            the legal capacity to agree to these Terms. We may suspend or
            terminate accounts we reasonably believe belong to someone under
            18.
          </p>
        </section>

        <section>
          <h2>2. Your account</h2>
          <p>
            You sign in with a one-time email code or a Google account. You
            are responsible for keeping access to your email or Google
            account secure, and for all activity that happens under your
            myMoodly account. Tell us promptly if you suspect unauthorized
            access.
          </p>
        </section>

        <section>
          <h2>3. The nature of the service</h2>
          <p>
            myMoodly connects people for anonymous, mood-based conversations
            based on the information you share, such as your mood, emotion,
            and match preferences. Conversation partners are shown an
            anonymous display name, not your real identity. myMoodly does not
            verify the identity, intentions, or statements of any user, and
            cannot guarantee the accuracy of anything another user says.
          </p>
          <p>
            myMoodly is <strong>not</strong> a healthcare provider, therapy
            service, or crisis service. If you are in immediate danger or may
            harm yourself or someone else, contact your local emergency
            service or an appropriate crisis resource instead of relying on
            myMoodly.
          </p>
        </section>
        <section>
          <h2>4. Anonymous but reportable</h2>
          <p>
            Conversations are anonymous to other users, but myMoodly retains
            information needed to investigate abuse, safety concerns, and
            violations of these Terms, as described in our{" "}
            <Link href="/privacy">Privacy Policy</Link>. Anonymity does not
            mean immunity: users who violate these Terms may be warned,
            suspended, or permanently removed from myMoodly, and myMoodly may
            disclose information where reasonably necessary to protect users,
            comply with law, or respond to a valid legal request.
          </p>
        </section>

        <section>
          <h2>5. Acceptable use</h2>
          <p>While using myMoodly, you agree not to:</p>
          <ul>
            <li>harass, threaten, abuse, or attempt to identify or locate another user without consent;</li>
            <li>share sexual content involving minors, or otherwise use myMoodly to exploit or endanger anyone;</li>
            <li>promote self-harm, violence, illegal activity, or discrimination;</li>
            <li>impersonate another person or misrepresent your age, gender, or identity in a way meant to deceive or harm others;</li>
            <li>solicit money, sell products or services, or attempt to move conversations to another platform for commercial purposes;</li>
            <li>attempt to disrupt, reverse-engineer, scrape, or gain unauthorized access to myMoodly or its systems; or</li>
            <li>use myMoodly for any unlawful purpose or in a way that violates the rights of others.</li>
          </ul>
        </section>

        <section>
          <h2>6. Content you share</h2>
          <p>
            You are solely responsible for anything you write or share in a
            check-in note or conversation message. Do not share information
            you want to keep private &mdash; a conversation partner may see
            and copy anything you send them. We do not pre-screen messages,
            but we may review reported content, remove content, and take
            action against accounts that violate these Terms.
          </p>
        </section>

        <section>
          <h2>7. Reporting and enforcement</h2>
          <p>
            If another user violates these Terms or makes you feel unsafe,
            you can end the conversation and report it through myMoodly or by
            emailing{" "}
            <a href="mailto:lamsalsamrat831@gmail.com">
              lamsalsamrat831@gmail.com
            </a>
            . We may investigate reports, warn or suspend accounts, permanently
            remove accounts, and take other action we reasonably consider
            necessary to protect users and the service.
          </p>
        </section>

        <section>
          <h2>8. Termination</h2>
          <p>
            You may stop using myMoodly and delete your account at any time
            from your profile settings or by contacting us. We may suspend or
            terminate your access, with or without notice, if we reasonably
            believe you have violated these Terms, created risk or legal
            exposure for myMoodly or other users, or if we discontinue the
            service.
          </p>
        </section>

        <section>
          <h2>9. Disclaimers</h2>
          <p>
            myMoodly is provided &quot;as is&quot; and &quot;as available,&quot;
            without warranties of any kind, whether express or implied,
            including implied warranties of merchantability, fitness for a
            particular purpose, and non-infringement. We do not guarantee
            that myMoodly will be uninterrupted, secure, or error-free, or
            that any conversation partner or match will be suitable, safe, or
            accurately represented.
          </p>
        </section>

        <section>
          <h2>10. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, myMoodly and Samrat
            Lamsal are not liable for any indirect, incidental, special,
            consequential, or punitive damages, or for any loss of data,
            goodwill, or other intangible losses, arising from your use of
            myMoodly or interactions with other users, even if advised of the
            possibility of such damages. Nothing in these Terms limits
            liability that cannot be limited under applicable law.
          </p>
        </section>

        <section>
          <h2>11. Changes to the service and these Terms</h2>
          <p>
            We may change, suspend, or discontinue any part of myMoodly at
            any time. We may also update these Terms as myMoodly changes; the
            revised Terms will be posted at this same URL with a new
            effective date, and continued use of myMoodly after changes take
            effect means you accept the updated Terms. We will provide
            additional notice when required by law or when a change
            materially affects your rights.
          </p>
        </section>

        <section>
          <h2>12. Governing law</h2>
          <p>
            These Terms are governed by the laws of Nepal, without regard to
            conflict-of-law principles. Any dispute arising from these Terms
            or your use of myMoodly will be subject to the exclusive
            jurisdiction of the courts of Nepal.
          </p>
        </section>

        <section>
          <h2>13. Contact</h2>
          <p>For questions about these Terms, contact:</p>
          <address>
            <strong>myMoodly / Samrat Lamsal</strong>
            <br />
            Nepal
            <br />
            <a href="mailto:lamsalsamrat831@gmail.com">
              lamsalsamrat831@gmail.com
            </a>
          </address>
        </section>

        <footer className="legal-footer">
          <Link href="/">Return to myMoodly</Link>
          <span>© 2026 myMoodly</span>
        </footer>
      </article>
    </main>
  );
}
