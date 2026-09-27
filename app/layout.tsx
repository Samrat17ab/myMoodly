import type { Metadata, Viewport } from "next";
import { Newsreader, Figtree } from "next/font/google";
import "./globals.css";

const display = Newsreader({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});
const body = Figtree({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const SITE_URL = "https://mymoodly.space";
const TITLE = "myMoodly - Feel it. Share it. Let it move.";
const SHARE_DESCRIPTION = "Name how you feel, then talk it through anonymously with one real person. Free, for adults 18 and over.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description:
    "Private, anonymous, mood-based conversations with someone who gets where you are. Check in with how you feel and talk it through with one real person. Free, 18+.",
  applicationName: "myMoodly",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "myMoodly",
    capable: true,
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    title: TITLE,
    description: SHARE_DESCRIPTION,
    type: "website",
    url: SITE_URL,
    siteName: "myMoodly",
    locale: "en_US",
    // Absolute URL: link-preview crawlers don't reliably resolve relative ones.
    images: [{ url: `${SITE_URL}/og.jpg`, width: 1200, height: 628, alt: "myMoodly - anonymous conversations for how you really feel" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SHARE_DESCRIPTION,
    images: [`${SITE_URL}/og.jpg`],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0B443D",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // The font variables must live on <html>: the design tokens read them from
  // :root, and a custom property that's undefined where it's referenced
  // invalidates the whole font-family (the browser then falls back to Times).
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} data-tone="light" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
