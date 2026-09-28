import Link from 'next/link';
import { HelpButton } from '../HelpButton';

export function PrivacySection({ privacyHref = '/privacy' }: { privacyHref?: string }) {
  return (
    <section className="mm-privacy">
      <div className="mm-privacy__main">
        <h2 className="mm-display mm-display--md">What stays private</h2>
        <div className="mm-privacy__grid">
          <p className="mm-body"><strong>No profile.</strong> No photo, no followers, no history anyone else can browse.</p>
          <p className="mm-body"><strong>A new name each time.</strong> You show up as something like Quiet Heron, never as you.</p>
          <p className="mm-body"><strong>Contact details removed.</strong> Phone numbers, emails and links are taken out of messages automatically.</p>
          <p className="mm-body">
            <strong>Why Google sign-in?</strong> We use an account ID and your verified email only to secure your account. We never access Gmail, Drive,
            Contacts or Calendar. <Link href={privacyHref} className="mm-link">Privacy policy</Link>
          </p>
        </div>
      </div>
      <aside className="mm-privacy__card">
        <h3 className="mm-display mm-display--sm">What myMoodly is, and isn&apos;t</h3>
        <p className="mm-body">It&apos;s peer support: a real person and a real conversation. It isn&apos;t therapy, medical care or a crisis service.</p>
        <p className="mm-body">If you feel unsafe or things feel like too much right now, please reach out to local emergency services or a helpline straight away.</p>
        <HelpButton variant="inline" className="mm-btn mm-btn--care" label="Find support now" />
      </aside>
    </section>
  );
}
