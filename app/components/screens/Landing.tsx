"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Brand } from "@/app/components/shared/Brand";
import { Moodlight } from "@/app/components/shared/Moodlight";
import { MoodMapField, type MoodValue } from "@/app/components/shared/MoodMapField";
import { Sanctuary } from "@/app/components/sanctuary/Sanctuary";
import { IconHelp } from "@/app/components/icons";
import { entrance } from "@/app/lib/motion";

const FEELINGS = ["quietly hopeful", "a little lost", "genuinely excited", "tired but okay", "unusually calm", "on edge"];

const PRIVACY_POINTS = [
  "No public profile, and nothing you write is tied to your name.",
  "No followers, no likes, no feed — just the one conversation at a time.",
  "Contact details you type are removed automatically before anyone sees them.",
  "Google sign-in only reads your account identifier and verified email, to keep the app safe. It never touches Gmail, Drive, contacts, or your calendar.",
];

const FAQS = [
  {
    q: "Is myMoodly free?",
    a: "Yes. Everyone gets 10 conversations a day at no cost.",
  },
  {
    q: "Is this therapy, or a crisis line?",
    a: "No. myMoodly is peer support between two anonymous adults. If you're in crisis, use “Need help now” for real, local resources.",
  },
  {
    q: "Will the person I talk to know who I am?",
    a: "No. There's no name, no photo, and no profile — just how you're feeling right now.",
  },
  {
    q: "What if someone is unkind?",
    a: "You can report or block anyone, right from the conversation, at any time.",
  },
];

function moodLabel(value: MoodValue) {
  const energy = value.energy >= 0.5 ? "high energy" : "low energy";
  const pleasant = value.pleasant >= 0.5 ? "pleasant" : "unpleasant";
  return `${pleasant}, ${energy}`;
}

export function Landing({
  onCheckIn,
  onSignIn,
  onHelp,
}: {
  onCheckIn: () => void;
  onSignIn: () => void;
  onHelp: () => void;
}) {
  const [preview, setPreview] = useState<MoodValue>({ pleasant: 0.6, energy: 0.4 });
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="landing-shell">
      <section className="landing-hero">
        <Sanctuary mood={preview.pleasant >= 0.5 ? "pleasant-high" : "unpleasant-low"} showControls={false} />
        <div className="landing-hero-content">
          <nav className="landing-nav">
            <Brand />
            <button type="button" className="text-button" onClick={onSignIn}>
              Sign in
            </button>
          </nav>
          <motion.div variants={entrance} initial="hidden" animate="visible" custom={0} className="landing-hero-copy">
            <div className="eyebrow">
              <span />
              Private by design
            </div>
            <h1>
              Feel it. Share it.
              <br />
              <em>Let it move.</em>
            </h1>
            <p>
              myMoodly is an 18+ peer-support app that helps adults name their mood and connect anonymously for a
              private, one-to-one conversation with someone in a similar or different headspace.
            </p>
            <div className="landing-hero-actions">
              <button type="button" className="primary large" onClick={onCheckIn}>
                Check in with yourself
              </button>
              <a href="#how-it-works" className="text-button quiet">
                How it works
              </a>
            </div>
            <ul className="trust-row">
              <li>
                <span className="dot-bullet" /> No profiles
              </li>
              <li>
                <span className="dot-bullet" /> No followers
              </li>
              <li>
                <span className="dot-bullet" /> Just a real conversation
              </li>
            </ul>
          </motion.div>
          <div className="landing-moodlight">
            <Moodlight pleasant={0.65} energy={0.45} size={64} />
          </div>
        </div>
        <div className="landing-feelings" aria-hidden>
          {FEELINGS.map((feeling, i) => (
            <motion.span
              key={feeling}
              className="drifting-feeling"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: [0, 0.85, 0], y: -60 }}
              transition={{ duration: 9, repeat: Infinity, delay: i * 3.1, ease: "easeInOut" }}
              style={{ left: `${8 + i * 15}%` }}
            >
              {feeling}
            </motion.span>
          ))}
        </div>
        <button type="button" className="landing-help-pill" onClick={onHelp}>
          <IconHelp size={15} /> Need help now?
        </button>
      </section>

      <section id="how-it-works" className="landing-section how-it-works">
        <div className="landing-section-head">
          <h2>A private check-in, then a real conversation.</h2>
          <p>
            myMoodly gives adults a structured way to name how they feel, choose the kind of perspective they want,
            and get matched by mood and shared language. myMoodly is not therapy, medical care, or a crisis service.
          </p>
        </div>
        <ol className="how-it-works-steps">
          <li>
            <span>01</span>
            <h3>Name your mood</h3>
            <p>Place how you feel on a simple map, then pick the word that fits closest. You can add a short note.</p>
          </li>
          <li>
            <span>02</span>
            <h3>Choose a headspace</h3>
            <p>Talk to someone who feels similar, or someone in a different headspace. Either way, no profiles.</p>
          </li>
          <li>
            <span>03</span>
            <h3>Talk, anonymously</h3>
            <p>You&apos;re matched by mood and shared language, for one private, one-to-one conversation.</p>
          </li>
        </ol>
      </section>

      <section className="landing-section try-it">
        <div className="landing-section-head">
          <h2>Try the mood map</h2>
          <p>No sign-in needed. Move the light and watch the space respond — this is the first thing you&apos;ll do.</p>
        </div>
        <div className="try-it-panel">
          <MoodMapField value={preview} onChange={setPreview} size={240} layoutId="landing-preview-moodlight" />
          <p className="try-it-readout">You&apos;d be checking in as <b>{moodLabel(preview)}</b>.</p>
        </div>
      </section>

      <section className="landing-section privacy-section">
        <div className="landing-section-head">
          <h2>What stays private</h2>
        </div>
        <ul className="privacy-list">
          {PRIVACY_POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>

      <section className="landing-section what-it-is">
        <blockquote>
          myMoodly is peer support: two anonymous adults, talking. It is not therapy, medical care, or a crisis
          service, and it&apos;s built for people 18 and over.
        </blockquote>
      </section>

      <section className="landing-section faq-section">
        <div className="landing-section-head">
          <h2>A few questions</h2>
        </div>
        <div className="faq-list">
          {FAQS.map((item, i) => (
            <div className="faq-item" key={item.q}>
              <button type="button" aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {item.q}
              </button>
              {openFaq === i && <p>{item.a}</p>}
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms</Link>
        <button type="button" className="text-button" onClick={onHelp}>
          Need help now?
        </button>
      </footer>
    </main>
  );
}
