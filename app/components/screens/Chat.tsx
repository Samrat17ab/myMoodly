"use client";
import { useState } from "react";
import { Brand } from "@/app/components/shared/Brand";
import { moodColor, type MoodPoint } from "@/app/components/shared/Moodlight";
import { Modal } from "@/app/components/shared/Modal";
import {
  IconBlock,
  IconEnd,
  IconMore,
  IconReport,
  IconSend,
} from "@/app/components/icons";

export type ChatMessage = { id: string; mine: boolean; text: string; time: string };

const REPORT_REASONS = ["Harassment or bullying", "Sexual content", "Hate or discrimination", "Sharing personal information", "Something else"];
const CHAT_TOTAL_SECONDS = 1200;

function icebreakersFor(mode: "similar" | "different") {
  return mode === "similar"
    ? ["What's been sitting with you today?", "What would help most right now?", "Is there anything you haven't said out loud yet?"]
    : ["What does your day look like from where you're sitting?", "What's one thing going well for you?", "What would you tell yourself an hour ago?"];
}

export function Chat({
  partnerName,
  partnerInitials,
  partnerMood,
  partnerEmotion,
  partnerNote,
  myEmotion,
  myNote,
  mode,
  onlineCount,
  socketStatus,
  chatSeconds,
  extendRequestedByMe,
  extendRequestedByPartner,
  onRequestExtend,
  message,
  setMessage,
  onSend,
  messages,
  messageTime,
  onEndChat,
  onSubmitBlock,
  onHelp,
  report,
  reportDone,
  reportSending,
  onOpenReport,
  onCloseReport,
  onSubmitReport,
}: {
  partnerName: string;
  partnerInitials: string;
  partnerMood: MoodPoint;
  partnerEmotion: string;
  partnerNote: string;
  myEmotion: string;
  myNote: string;
  mode: "similar" | "different";
  onlineCount: number;
  socketStatus: "connecting" | "live" | "offline";
  chatSeconds: number;
  extendRequestedByMe: boolean;
  extendRequestedByPartner: boolean;
  onRequestExtend: () => void;
  message: string;
  setMessage: (v: string) => void;
  onSend: () => void;
  messages: ChatMessage[];
  messageTime: (v: string) => string;
  onEndChat: () => void;
  onSubmitBlock: () => void;
  onHelp: () => void;
  report: boolean;
  reportDone: boolean;
  reportSending: boolean;
  onOpenReport: () => void;
  onCloseReport: () => void;
  onSubmitReport: (reason: string) => void;
}) {
  const [menu, setMenu] = useState(false);
  const ringFraction = Math.max(0, Math.min(1, chatSeconds / CHAT_TOTAL_SECONDS));
  const warming = chatSeconds > 0 && chatSeconds <= 120;
  const circumference = 2 * Math.PI * 15;

  return (
    <section className="chat-view">
      <header className="chat-header">
        <Brand />
        <div className="partner">
          <span className="avatar" style={{ boxShadow: `0 0 0 3px ${moodColor(partnerMood)}` }}>
            {partnerInitials}
          </span>
          <div>
            <b>{partnerName}</b>
            <small>
              <i /> {onlineCount >= 2 ? "Here with you" : socketStatus === "live" ? "Connected" : "Reconnecting…"}
            </small>
          </div>
        </div>
        <div className="chat-actions">
          <svg className={`chat-ring ${warming ? "is-warm" : ""}`} width="34" height="34" viewBox="0 0 34 34" aria-label={`${Math.ceil(chatSeconds / 60)} minutes left`}>
            <circle cx="17" cy="17" r="15" className="chat-ring-track" />
            <circle
              cx="17"
              cy="17"
              r="15"
              className="chat-ring-fill"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - ringFraction)}
            />
          </svg>
          <button type="button" aria-label="More options" onClick={() => setMenu(!menu)}>
            <IconMore size={16} />
          </button>
          {menu && (
            <div className="chat-menu">
              <button type="button" onClick={onOpenReport}>
                <IconReport size={15} /> Report conversation
              </button>
              <button type="button" onClick={onSubmitBlock}>
                <IconBlock size={15} /> Block this person
              </button>
              <button type="button" onClick={onEndChat}>
                <IconEnd size={15} /> End conversation
              </button>
            </div>
          )}
        </div>
      </header>

      {warming && (
        <div className="extend-banner">
          {extendRequestedByMe && extendRequestedByPartner ? (
            <span>Extending your conversation…</span>
          ) : extendRequestedByMe ? (
            <span>Waiting for {partnerName} to agree to keep chatting…</span>
          ) : extendRequestedByPartner ? (
            <>
              <span>{partnerName} wants to keep chatting.</span>
              <button type="button" onClick={onRequestExtend}>Yes, continue</button>
            </>
          ) : (
            <>
              <span>A couple of minutes left — keep chatting?</span>
              <button type="button" onClick={onRequestExtend}>Yes, continue</button>
            </>
          )}
        </div>
      )}

      <div className="chat-checkins">
        <div className="chat-note">
          <span>Your check-in</span>
          <b>{myEmotion || "Shared privately"}</b>
          {myNote && <p>&quot;{myNote}&quot;</p>}
        </div>
        <div className="chat-note">
          <span>{partnerName}&apos;s check-in</span>
          <b>{partnerEmotion || "Shared privately"}</b>
          {partnerNote && <p>&quot;{partnerNote}&quot;</p>}
        </div>
      </div>

      <div className="messages">
        <div className="system-note">You&apos;re both anonymous. Messages are delivered live and saved securely for this conversation.</div>
        {messages.length === 0 && (
          <div className="icebreakers">
            {icebreakersFor(mode).map((line) => (
              <button key={line} type="button" onClick={() => setMessage(line)}>
                {line}
              </button>
            ))}
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`bubble-row ${m.mine ? "mine" : ""}`}>
            <div className="bubble">
              {m.text}
              <time>{messageTime(m.time)}</time>
            </div>
          </div>
        ))}
      </div>

      <div className="composer">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="Say what's on your mind…"
        />
        <button type="button" className="send" onClick={onSend} aria-label="Send">
          <IconSend size={16} />
        </button>
      </div>
      <footer className="chat-footer">
        <button type="button" onClick={onHelp}>Need help now?</button>
        <span>{socketStatus === "live" ? "Live — messages saved to this conversation" : "Reconnecting securely…"}</span>
      </footer>

      {report && (
        <Modal title={reportDone ? "Report received" : "Report conversation"} onClose={onCloseReport}>
          {reportDone ? (
            <>
              <p>Thank you. Your report was recorded and this person won&apos;t be matched with you again.</p>
              <button type="button" className="primary wide" onClick={onEndChat}>Continue</button>
            </>
          ) : (
            <>
              <p className="modal-copy">What happened? Your report is private and recorded against this person&apos;s account.</p>
              <div className="report-list">
                {REPORT_REASONS.map((reason) => (
                  <button key={reason} type="button" disabled={reportSending} onClick={() => onSubmitReport(reason)}>
                    {reason}
                  </button>
                ))}
              </div>
            </>
          )}
        </Modal>
      )}
    </section>
  );
}
