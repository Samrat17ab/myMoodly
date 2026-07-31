import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | myMoodly",
  description:
    "How myMoodly collects, uses, stores, and protects personal information.",
};

const effectiveDate = "July 31, 2026";

export default function PrivacyPolicy() {
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
          <p className="overline">YOUR PRIVACY</p>
          <h1>Privacy Policy</h1>
          <p className="legal-effective">Effective and last updated: {effectiveDate}</p>
          <p>
            myMoodly is an 18+ mood check-in and anonymous conversation service
            operated by Samrat Lamsal in Nepal. This policy explains what
            information myMoodly collects, why it is used, when it is shared,
            how long it is kept, and the choices available to you.
          </p>
        </div>

        <section>
          <h2>1. Information we collect</h2>
          <h3>Information you provide</h3>
          <ul>
            <li>
              <strong>Account information:</strong> your email address when you
              sign in with a magic link or Google.
            </li>
            <li>
              <strong>Private profile information:</strong> age, gender choice
              (including an optional self-description), country, languages, and
              acceptance of myMoodly&apos;s terms.
            </li>
            <li>
              <strong>Mood and conversation information:</strong> energy level,
              mood category, emotion, match preference, optional check-in note,
              conversation messages, and post-conversation feedback.
            </li>
            <li>
              <strong>Support information:</strong> information you include in
              an email or other request sent to us.
            </li>
          </ul>

          <h3>Information received from Google</h3>
          <p>
            If you choose Continue with Google, myMoodly requests only the
            <strong> openid</strong>, <strong>email</strong>, and
            <strong> profile</strong> permissions. Google provides a unique
            account identifier, your email address, and confirmation that the
            email is verified. myMoodly uses this information only to create,
            connect, and secure your myMoodly account. myMoodly does not access your
            Gmail messages, Google Drive files, contacts, calendar, password, or
            other Google content.
          </p>

          <h3>Information collected automatically</h3>
          <p>
            myMoodly and its hosting providers may process limited technical data,
            such as IP address, browser and device information, request times,
            security events, and cookie data, to deliver the service, maintain
            sessions, prevent abuse, and diagnose failures.
          </p>
        </section>

        <section>
          <h2>2. How we use information</h2>
          <p>We use information to:</p>
          <ul>
            <li>authenticate users and maintain secure sessions;</li>
            <li>confirm that users meet myMoodly&apos;s 18+ requirement;</li>
            <li>provide mood check-ins and match users by mood and language;</li>
            <li>deliver anonymous conversations and show conversation history;</li>
            <li>operate safety, reporting, fraud-prevention, and abuse controls;</li>
            <li>measure daily usage and improve reliability and user experience;</li>
            <li>respond to support, privacy, and legal requests; and</li>
            <li>comply with applicable law and protect users and the service.</li>
          </ul>
          <p>
            myMoodly does not sell personal information, use Google user data for
            advertising, or use private conversation content to train
            advertising or general-purpose AI models.
          </p>
        </section>

        <section>
          <h2>3. Anonymity and other users</h2>
          <p>
            Conversation partners see an anonymous display name and the
            information shown within the conversation, such as your selected
            emotion, optional note, and messages. They do not receive your
            email address, age, gender, country, or Google account identifier
            from myMoodly. However, anything you voluntarily write in a note or
            message may be seen and copied by the other participant. Do not
            share information you want to keep private.
          </p>
        </section>

        <section>
          <h2>4. When information is shared</h2>
          <p>We may disclose information only in these circumstances:</p>
          <ul>
            <li>
              <strong>Service providers:</strong> Cloudflare provides hosting,
              database, networking, and security services; Google provides
              OAuth authentication when you choose Google sign-in; and email
              providers deliver magic-link and support emails. They process
              information on our behalf or under their own applicable terms.
            </li>
            <li>
              <strong>Safety and legal reasons:</strong> when reasonably
              necessary to investigate abuse, protect a person from harm,
              enforce our rules, comply with law, or respond to a valid legal
              request.
            </li>
            <li>
              <strong>Business changes:</strong> as part of a merger,
              acquisition, financing, reorganization, or transfer of the
              service, subject to appropriate confidentiality protections and
              notice where required.
            </li>
            <li>
              <strong>With your direction:</strong> when you request or clearly
              consent to a disclosure.
            </li>
          </ul>
          <p>We do not sell or rent personal information.</p>
        </section>

        <section>
          <h2>5. Cookies and session security</h2>
          <p>
            myMoodly uses strictly necessary cookies to protect the Google OAuth
            flow and keep you signed in. Authentication tokens and OAuth state
            values are stored in hashed or short-lived form where applicable.
            These cookies are required for account access and security; myMoodly
            does not currently use advertising cookies.
          </p>
        </section>

        <section>
          <h2>6. Retention</h2>
          <p>
            Account, profile, check-in, conversation, and feedback information
            may be retained while your account is active and afterward for as
            long as reasonably needed to provide the service, preserve safety
            records, resolve disputes, enforce agreements, and meet legal
            obligations. Expired authentication sessions and one-time OAuth or
            magic-link records are periodically removed. When we complete a
            verified deletion request, we delete or anonymize associated
            information unless retention is required for security or legal
            reasons. Backup copies may remain for a limited period before being
            overwritten.
          </p>
        </section>

        <section>
          <h2>7. Security</h2>
          <p>
            We use reasonable technical and organizational safeguards,
            including HTTPS, access controls, signed or hashed authentication
            credentials, short-lived OAuth state, and protected hosting.
            However, no online service can guarantee absolute security. Please
            avoid sharing identifying, financial, medical-record, or other
            highly sensitive information in conversations.
          </p>
        </section>

        <section>
          <h2>8. Your choices and rights</h2>
          <p>
            Depending on where you live, you may have rights to access, correct,
            delete, restrict, or receive a copy of your personal information,
            or to object to certain processing. You may also revoke myMoodly&apos;s
            Google access from your Google Account permissions. Revoking Google
            access stops future Google sign-in but does not automatically delete
            information already stored by myMoodly.
          </p>
          <p>
            To exercise a privacy right or request account deletion, email{" "}
            <a href="mailto:lamsalsamrat831@gmail.com">
              lamsalsamrat831@gmail.com
            </a>
            . We may need to verify that you control the relevant account before
            fulfilling the request.
          </p>
        </section>

        <section>
          <h2>9. Age restriction</h2>
          <p>
            myMoodly is intended only for people aged 18 or older. We do not
            knowingly collect personal information from anyone under 18. If you
            believe a person under 18 has provided information to myMoodly,
            contact us so we can investigate and delete it where appropriate.
          </p>
        </section>

        <section>
          <h2>10. International processing</h2>
          <p>
            myMoodly is operated from Nepal and uses service providers that may
            process information in other countries. Those countries may have
            privacy laws different from the laws where you live. We use
            reasonable safeguards appropriate to the nature of the information
            and the service.
          </p>
        </section>

        <section>
          <h2>11. Health and crisis information</h2>
          <p>
            myMoodly is a peer conversation service, not a healthcare provider,
            medical service, therapy service, or crisis service. Information
            entered into myMoodly may reveal sensitive details about your mood or
            wellbeing. If you are in immediate danger or may harm yourself or
            someone else, contact your local emergency service or an appropriate
            crisis resource.
          </p>
        </section>

        <section>
          <h2>12. Changes to this policy</h2>
          <p>
            We may update this policy as myMoodly changes. The revised policy will
            be posted at this same URL with a new effective date. We will provide
            additional notice when required by law or when a change materially
            affects how personal information is used.
          </p>
        </section>

        <section>
          <h2>13. Contact</h2>
          <p>For privacy questions, requests, or complaints, contact:</p>
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
