import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

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
  return (
    <html lang="en">
      <body className={geist.variable}>{children}</body>
    </html>
  );
}
