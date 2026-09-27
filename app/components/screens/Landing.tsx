"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Brand } from "@/app/components/shared/Brand";
import { Moodlight } from "@/app/components/shared/Moodlight";
import { MoodMapField, type MoodValue } from "@/app/components/shared/MoodMapField";
import { MotionButton } from "@/app/components/shared/MotionButton";
import { Sanctuary } from "@/app/components/sanctuary/Sanctuary";
import { IconCheck, IconHelp } from "@/app/components/icons";
import { entrance, reducedEntrance } from "@/app/lib/motion";
import { useReducedMotionSafe } from "@/app/hooks/useReducedMotionSafe";

const FEELINGS = ["quietly hopeful", "a little lost", "genuinely excited", "tired but okay", "unusually calm", "on edge"];

const PRIVACY_POINTS = [
  { title: "No public profile", body: "Nothing you write is ever tied to your name." },
  { title: "No followers, no feed", body: "Just the one conversation, for as long as it lasts." },
  { title: "Contact details removed", body: "Automatically stripped from anything you type, before anyone sees it." },
  { title: "Google sign-in, minimal", body: "Only your account identifier and verified email. Never Gmail, Drive, contacts, or your calendar." },
];

const FAQS = [
  { q: "Is myMoodly free?", a: "Yes. Everyone gets 10 conversations a day at no cost." },
  {
    q: "Is this therapy, or a crisis line?",
    a: "No. myMoodly is peer support between two anonymous adults. If you're in crisis, use “Need help now” for real, local resources.",
  },
  { q: "Will the person I talk to know who I am?", a: "No. There's no name, no photo, and no profile — just how you're feeling right now." },
  { q: "What if someone is unkind?", a: "You can report or block anyone, right from the conversation, at any time." },
];

const revealEase = [0.22, 1, 0.36, 1] as const;
const reveal = {
  hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, delay: i * 0.08, ease: revealEase },
  }),
};
const staggerGroup = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } };
// Reduced-motion equivalents: still a real transition (so content isn't
// jarringly instant), just no drift/blur and no stagger delay. Every
// property `reveal` can set (y, filter) is named explicitly here too --
// the server always renders as if motion were not reduced, so a
// reduced-motion client hydrates straight onto `reveal.hidden`'s inline
// style, and framer-motion only ever clears properties the target variant
// actually names.
const reducedReveal = {
  hidden: { opacity: 0, y: 0, filter: "blur(0px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.2 } },
};
const reducedStaggerGroup = { hidden: {}, visible: {} };

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
  const reduced = useReducedMotionSafe();
  const activeReveal = reduced ? reducedReveal : reveal;
  const activeStagger = reduced ? reducedStaggerGroup : staggerGroup;

  return (
    <main className="landing-shell">
      <section className="landing-hero">
        <Sanctuary mood={preview.pleasant >= 0.5 ? "pleasant-high" : "unpleasant-low"} showControls={false} />
        <div className="landing-hero-content">
          <nav className="landing-nav">
            <Brand />
            <MotionButton className="text-button" onClick={onSignIn}>
              Sign in
            </MotionButton>
          </nav>
          <motion.div variants={reduced ? reducedEntrance : entrance} initial="hidden" animate="visible" custom={0} className="landing-hero-copy">
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
              <MotionButton className="primary large" onClick={onCheckIn}>
                Check in with yourself
              </MotionButton>
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
        {/* Purely decorative, infinitely-looping ambient motion -- pinned to
            invisible under reduced motion instead of looping forever. Kept
            structurally identical either way (only the animate/transition
            props differ) so the reduced-motion branch -- which depends on
            window.matchMedia and so can differ between the server render
            and the first client paint -- can't cause a hydration mismatch. */}
        <div className="landing-feelings" aria-hidden>
          {FEELINGS.map((feeling, i) => (
            <motion.span
              key={feeling}
              className="drifting-feeling"
              initial={{ opacity: 0, y: 20 }}
              animate={reduced ? { opacity: 0 } : { opacity: [0, 0.85, 0], y: -60 }}
              transition={reduced ? { duration: 0 } : { duration: 9, repeat: Infinity, delay: i * 3.1, ease: "easeInOut" }}
              style={{ left: `${8 + i * 15}%` }}
            >
              {feeling}
            </motion.span>
          ))}
        </div>
        <MotionButton className="landing-help-pill" onClick={onHelp}>
          <IconHelp size={15} /> Need help now?
        </MotionButton>
      </section>

      <section id="how-it-works" className="landing-section how-it-works">
        <motion.div
          className="landing-section-head"
          variants={activeReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <h2>A private check-in, then a real conversation.</h2>
          <p>
            myMoodly gives adults a structured way to name how they feel, choose the kind of perspective they want,
            and get matched by mood and shared language. myMoodly is not therapy, medical care, or a crisis service.
          </p>
        </motion.div>
        <motion.div
          className="bento-steps"
          variants={activeStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.div className="bento-step bento-step-lead" variants={activeReveal}>
            <div className="aurora-field" aria-hidden />
            <span>01</span>
            <h3>Name your mood</h3>
            <p>Place how you feel on a simple map, then pick the word that fits closest. You can add a short note.</p>
          </motion.div>
          <motion.div className="bento-step" variants={activeReveal}>
            <span>02</span>
            <h3>Choose a headspace</h3>
            <p>Talk to someone who feels similar, or someone in a different headspace. Either way, no profiles.</p>
          </motion.div>
          <motion.div className="bento-step" variants={activeReveal}>
            <span>03</span>
            <h3>Talk, anonymously</h3>
            <p>You&apos;re matched by mood and shared language, for one private, one-to-one conversation.</p>
          </motion.div>
        </motion.div>
      </section>

      <section className="landing-section try-it">
        <motion.div
          className="landing-section-head"
          variants={activeReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <h2>Try the mood map</h2>
          <p>No sign-in needed. Move the light and watch the space respond — this is the first thing you&apos;ll do.</p>
        </motion.div>
        <motion.div
          className="try-it-panel"
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={reduced ? { duration: 0.2 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="aurora-field" aria-hidden />
          <MoodMapField value={preview} onChange={setPreview} size={240} layoutId="landing-preview-moodlight" />
          <p className="try-it-readout">
            You&apos;d be checking in as <b>{moodLabel(preview)}</b>.
          </p>
        </motion.div>
      </section>

      <section className="landing-section privacy-section">
        <motion.div
          className="landing-section-head"
          variants={activeReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <h2>What stays private</h2>
        </motion.div>
        <motion.div
          className="bento-privacy"
          variants={activeStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {PRIVACY_POINTS.map((point) => (
            <motion.div className="bento-privacy-tile" key={point.title} variants={activeReveal}>
              <span className="bento-privacy-icon">
                <IconCheck size={16} />
              </span>
              <b>{point.title}</b>
              <p>{point.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="landing-section what-it-is">
        <motion.blockquote
          variants={activeReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          myMoodly is peer support: two anonymous adults, talking. It is not therapy, medical care, or a crisis
          service, and it&apos;s built for people 18 and over.
        </motion.blockquote>
      </section>

      <section className="landing-section faq-section">
        <motion.div
          className="landing-section-head"
          variants={activeReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <h2>A few questions</h2>
        </motion.div>
        <div className="faq-list">
          {FAQS.map((item, i) => (
            <div className="faq-item" key={item.q}>
              <button type="button" aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {item.q}
                <motion.span className="faq-chevron" animate={{ rotate: openFaq === i ? 45 : 0 }} transition={{ duration: 0.25 }}>
                  +
                </motion.span>
              </button>
              <motion.div
                initial={false}
                animate={{ height: openFaq === i ? "auto" : 0, opacity: openFaq === i ? 1 : 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: "hidden" }}
              >
                <p>{item.a}</p>
              </motion.div>
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
