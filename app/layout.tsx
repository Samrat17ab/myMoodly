import type { Metadata } from "next";
import { Newsreader, Figtree } from "next/font/google";
import "./globals.css";

const display = Newsreader({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});
const body = Figtree({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "myMoodly - Feel it. Share it. Let it move.",
  description:
    "Private, anonymous, mood-based conversations with someone who gets where you are.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "myMoodly",
    capable: true,
    statusBarStyle: "default",
  },
  openGraph: {
    title: "myMoodly - Feel it. Share it. Let it move.",
    description: "Anonymous conversations for how you really feel.",
    type: "website",
    images: [{ url: "/og.png", width: 1734, height: 907, alt: "myMoodly - anonymous conversations for how you really feel" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "myMoodly - Feel it. Share it. Let it move.",
    description: "Anonymous conversations for how you really feel.",
    images: ["/og.png"],
  },
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
