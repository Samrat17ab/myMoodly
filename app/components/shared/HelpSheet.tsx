"use client";
import { motion } from "framer-motion";
import { IconBack, IconHelp, IconPhone } from "@/app/components/icons";

function ResourceCard({ title, number, note }: { title: string; number: string; note: string }) {
  return (
    <div className="resource-card">
      <span>
        <IconPhone size={16} />
      </span>
      <div>
        <b>{title}</b>
        <small>{note}</small>
      </div>
      <a href={/^\d/.test(number) ? `tel:${number.replace(/\D/g, "")}` : `https://${number}`}>{number}</a>
    </div>
  );
}

export function HelpSheet({ country, onBack }: { country: string; onBack: () => void }) {
  return (
    <motion.section
      className="resource-view"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <button type="button" className="back" onClick={onBack} aria-label="Back">
        <IconBack size={16} />
      </button>
      <div className="resource-head">
        <span>
          <IconHelp size={22} />
        </span>
        <div>
          <h1>Need help right now?</h1>
          <p>myMoodly isn&apos;t a crisis service, but you don&apos;t have to face this moment alone.</p>
        </div>
      </div>
      <div className="resource-layout">
        <div>
          <h3>Emergency contacts for {country}</h3>
          {country === "Nepal" ? (
            <>
              <ResourceCard title="National Suicide Prevention Helpline" number="1166" note="Free, nationwide support" />
              <ResourceCard title="Police emergency" number="100" note="For immediate danger" />
              <ResourceCard title="Ambulance" number="102" note="Emergency medical support" />
            </>
          ) : (
            <>
              <ResourceCard title="Local emergency services" number="112 / 911" note="Use the number available in your country" />
              <ResourceCard title="Find a crisis centre" number="findahelpline.com" note="Verified helplines in 175+ countries" />
            </>
          )}
          <p className="resource-foot">If a number doesn&apos;t connect, call your local emergency service or go to the nearest emergency department.</p>
        </div>
        <aside>
          <h3>While you reach out</h3>
          <p>Move to a place where other people are nearby.</p>
          <p>Put distance between you and anything you could use to hurt yourself.</p>
          <p>Text or call someone you trust and say: &quot;I need you with me right now.&quot;</p>
        </aside>
      </div>
    </motion.section>
  );
}
