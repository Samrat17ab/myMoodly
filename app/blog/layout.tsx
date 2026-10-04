import Link from "next/link";
import { SIGN_IN_HREF } from "@/app/components/blog/CheckInCta";
import { Logo } from "@/app/components/moodly/Logo";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mm-blog">
      <header className="mm-blog-header">
        <div className="mm-blog-header__inner">
          <Logo size={34} />
          <nav className="mm-blog-header__nav" aria-label="Blog">
            <Link href="/blog" className="mm-blog-header__link">
              Blog
            </Link>
            <a href={SIGN_IN_HREF} className="mm-btn mm-btn--primary mm-btn--sm">
              Check in
            </a>
          </nav>
        </div>
      </header>

      {children}

      <footer className="mm-blog-footer">
        <p className="mm-blog-footer__care">
          myMoodly is peer support, not a crisis service. If you might be in danger, call your local emergency number or
          see our <Link href="/help">support lines</Link>.
        </p>
        <div className="mm-blog-footer__row">
          <Logo size={28} compact />
          <nav className="mm-blog-footer__nav" aria-label="Footer">
            <Link href="/">How it works</Link>
            <Link href="/blog">Blog</Link>
            <a href="/blog/feed.xml">RSS</a>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </nav>
          <span className="mm-fine">© {new Date().getFullYear()} myMoodly</span>
        </div>
      </footer>
    </div>
  );
}
