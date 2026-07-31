"use client";
/* eslint-disable react/no-unescaped-entities */

import { useEffect, useRef, useState } from "react";

type Quadrant = "red" | "yellow" | "green" | "blue";
type Profile = {
  age: string;
  gender: string;
  customGender: string;
  country: string;
  languages: string[];
  terms: boolean;
};
type ChatMessage = {
  id: string;
  mine: boolean;
  text: string;
  time: string;
};
type RealtimePacket = {
  type?: "ready" | "message" | "presence" | "ended" | "error";
  history?: ChatMessage[];
  message?: ChatMessage | string;
  online?: number;
};
type View =
  | "welcome" | "auth" | "onboarding" | "home" | "energy" | "pleasantness"
  | "emotion" | "category" | "context" | "mode" | "queue" | "chat"
  | "survey" | "paywall" | "resources" | "guide" | "settings";

const words: Record<Quadrant, string[]> = {
  red: ["Enraged","Panicked","Stressed","Jittery","Shocked","Furious","Anxious","Livid","Frustrated","Tense","Stunned","Irritated","Fuming","Overwhelmed","Uneasy","Restless","Repulsed","Troubled","Peeved","Nervous","Annoyed","Apprehensive","Displeased","Worried","Bothered"],
  yellow: ["Surprised","Upbeat","Festive","Exhilarated","Ecstatic","Energized","Elated","Enthusiastic","Optimistic","Excited","Cheerful","Motivated","Inspired","Eager","Playful","Amused","Delighted","Blissful","Thrilled","Hyper","Proud","Joyful","Hopeful","Pleased","Focused"],
  green: ["At Ease","Content","Loving","Fulfilled","Calm","Secure","Satisfied","Relaxed","Chill","Restful","Blessed","Balanced","Mellow","Thoughtful","Peaceful","Comfortable","Carefree","Sleepy","Complacent","Tranquil","Cozy","Serene","Grateful","Touched","Reflective"],
  blue: ["Disappointed","Down","Apathetic","Pessimistic","Alienated","Miserable","Lonely","Disheartened","Guilty","Despondent","Hopeless","Empty","Remorseful","Depressed","Sad","Bored","Fatigued","Tired","Exhausted","Numb","Withdrawn","Isolated","Gloomy","Melancholic","Weary"],
};
const categoryLabel: Record<Quadrant, string> = { red:"Angry", blue:"Sad", yellow:"Happy", green:"Calm" };
const countries = ["Nepal","India","United States","United Kingdom","Australia","Canada","Germany","France","Japan","Singapore","Other"];
const languages = ["English","Nepali","Hindi","Spanish","French","German","Mandarin","Japanese"];
const emptyProfile: Profile = { age:"", gender:"", customGender:"", country:"Nepal", languages:["English"], terms:false };

async function readApiResponse(response: Response) {
  const data = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(String(data.error ?? "Moodly could not save your data."));
  return data;
}

async function saveMoodlyData(payload: Record<string, unknown>) {
  return readApiResponse(await fetch("/api/moodly", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  }));
}

async function matchRequest(payload: Record<string, unknown>) {
  return readApiResponse(await fetch("/api/match", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  }));
}

export default function MoodlyApp() {
  const [view, setView] = useState<View>("welcome");
  const [prior, setPrior] = useState<View>("home");
  const [energy, setEnergy] = useState<"high"|"low"|null>(null);
  const [pleasant, setPleasant] = useState<boolean|null>(null);
  const [quadrant, setQuadrant] = useState<Quadrant>("green");
  const [emotion, setEmotion] = useState("");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"similar"|"different">("similar");
  const [queueSeconds, setQueueSeconds] = useState(0);
  const [usage, setUsage] = useState(0);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [email, setEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [authSending, setAuthSending] = useState(false);
  const [chatSeconds, setChatSeconds] = useState(1200);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [menu, setMenu] = useState(false);
  const [report, setReport] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [toast, setToast] = useState("");
  const [survey, setSurvey] = useState({ understood:"", change:"" });
  const [checkInId, setCheckInId] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [partnerName, setPartnerName] = useState("Anonymous partner");
  const [socketStatus, setSocketStatus] = useState<"connecting"|"live"|"offline">("offline");
  const [onlineCount, setOnlineCount] = useState(0);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      const browserUrl = new URL(window.location.href);
      const authError = browserUrl.searchParams.get("authError");
      if (authError) {
        browserUrl.searchParams.delete("authError");
        window.history.replaceState({}, "", browserUrl);
        if (active) {
          setView("auth");
          setToast(
            authError === "google"
              ? "Google sign-in could not be completed. Please try again."
              : "That sign-in link is invalid or has expired.",
          );
        }
        return;
      }

      try {
        const sessionResponse = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        if (!sessionResponse.ok) return;
        const session = await sessionResponse.json() as { email?: string };
        const authenticatedEmail = session.email?.trim().toLowerCase() ?? "";
        if (!authenticatedEmail) return;
        const data = await readApiResponse(await fetch("/api/moodly", {
          cache: "no-store",
        }));
        if (!active) return;
        setEmail(authenticatedEmail);
        if (data.profile) {
          setProfile(data.profile as Profile);
          setUsage(Number(data.usage ?? 0));
          setView("home");
        } else {
          setView("onboarding");
        }
        if (browserUrl.searchParams.has("signedIn")) {
          browserUrl.searchParams.delete("signedIn");
          window.history.replaceState({}, "", browserUrl);
        }
      } catch (error) {
        if (active) {
          setToast(error instanceof Error ? error.message : "Could not restore your session.");
        }
      }
    };
    void restoreSession();
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (view !== "queue") return;
    const tick = setInterval(() => setQueueSeconds(s => s + 1), 1000);
    if (!ticketId) return () => clearInterval(tick);

    let active = true;
    const checkStatus = async () => {
      try {
        const data = await matchRequest({ action:"status", ticketId, email });
        if (!active) return;
        if (data.status === "matched" && data.conversationId) {
          active = false;
          setConversationId(String(data.conversationId));
          setPartnerName(String(data.partnerName ?? "Anonymous partner"));
          setUsage(value => value + 1);
          setChatSeconds(1200);
          setMessages([]);
          setView("chat");
        } else if (data.status === "expired" || data.status === "cancelled") {
          active = false;
          setToast("No match was found this time. You can try again.");
          setView("mode");
        }
      } catch (error) {
        if (active) setToast(error instanceof Error ? error.message : "Could not check your match.");
      }
    };
    void checkStatus();
    const poll = setInterval(() => void checkStatus(), 1200);
    return () => {
      active = false;
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [view, ticketId, email]);
  useEffect(() => {
    if (view !== "chat") return;
    const tick = setInterval(() => setChatSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(tick);
  }, [view]);
  useEffect(() => {
    if (view !== "chat" || !conversationId) return;
    let stopped = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (stopped) return;
      setSocketStatus("connecting");
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const url = new URL(`${protocol}//${window.location.host}/api/realtime`);
      url.searchParams.set("conversationId", conversationId);
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => setSocketStatus("live");
      socket.onmessage = (event) => {
        const payload = JSON.parse(String(event.data)) as RealtimePacket;
        if (payload.type === "ready" && Array.isArray(payload.history)) {
          setMessages(payload.history as ChatMessage[]);
        } else if (payload.type === "message" && typeof payload.message === "object") {
          const incoming = payload.message as ChatMessage;
          setMessages(current =>
            current.some(item => item.id === incoming.id)
              ? current
              : [...current, incoming],
          );
        } else if (payload.type === "presence") {
          setOnlineCount(Number(payload.online ?? 0));
        } else if (payload.type === "ended") {
          setToast("The conversation has ended.");
          setView("survey");
        } else if (payload.type === "error") {
          setToast(typeof payload.message === "string" ? payload.message : "Realtime chat error.");
        }
      };
      socket.onerror = () => setSocketStatus("offline");
      socket.onclose = () => {
        setSocketStatus("offline");
        if (!stopped) reconnectTimer = setTimeout(connect, 1500);
      };
    };

    connect();
    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socketRef.current?.close(1000, "Leaving conversation");
      socketRef.current = null;
    };
  }, [view, conversationId]);

  const openOverlay = (v: View) => { setPrior(view); setView(v); setMenu(false); };
  const continueFromPleasant = (value:boolean) => { setPleasant(value); const next = energy === "high" ? (value ? "yellow":"red") : (value ? "green":"blue"); setQuadrant(next); setView("emotion"); };
  const chooseEmotion = (word:string) => { setEmotion(word); setView("context"); setTimeout(() => noteRef.current?.focus(), 80); };
  const requestMagicLink = async () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || authSending) return;
    setAuthSending(true);
    try {
      await readApiResponse(await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      }));
      setEmail(normalized);
      setMagicSent(true);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not send the sign-in email.");
    } finally {
      setAuthSending(false);
    }
  };
  const saveProfile = async (nextView: View) => {
    if (+profile.age < 18) return setToast("Moodly is only available to people aged 18 or older.");
    if (!profile.gender || !profile.terms) return setToast("Please complete the required fields.");
    try {
      await saveMoodlyData({ type:"profile", email, profile });
      setToast("Your private profile was saved.");
      setView(nextView);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not save your profile.");
    }
  };
  const startQueue = async () => {
    try {
      const data = await saveMoodlyData({
        type:"check-in", email, energy, pleasant, quadrant, emotion, note,
        matchMode:mode,
      });
      const nextCheckInId = String(data.id);
      setCheckInId(nextCheckInId);
      const match = await matchRequest({
        action:"join",
        email,
        checkInId:nextCheckInId,
        matchMode:mode,
        quadrant,
        languages:profile.languages,
      });
      setTicketId(String(match.ticketId));
      setQueueSeconds(0);
      if (match.status === "matched" && match.conversationId) {
        setConversationId(String(match.conversationId));
        setPartnerName(String(match.partnerName ?? "Anonymous partner"));
        setUsage(value => value + 1);
        setChatSeconds(1200);
        setMessages([]);
        setView("chat");
      } else {
        setView("queue");
      }
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not start matchmaking.");
    }
  };
  const cancelQueue = async () => {
    try {
      const result = ticketId
        ? await matchRequest({ action:"cancel", ticketId, email })
        : { status:"cancelled" };
      if (result.status === "matched" && result.conversationId) {
        setConversationId(String(result.conversationId));
        setPartnerName(String(result.partnerName ?? "Anonymous partner"));
        setUsage(value => value + 1);
        setChatSeconds(1200);
        setMessages([]);
        setView("chat");
        return;
      }
      setTicketId("");
      setView("mode");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not cancel matchmaking.");
    }
  };
  const send = () => {
    const clean = message.trim();
    if (!clean) return;
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setToast("Reconnecting to the conversation. Please try again.");
      return;
    }
    socketRef.current.send(JSON.stringify({ type:"message", text:clean }));
    setMessage("");
  };
  const submitSurvey = async () => {
    if (!survey.understood || !survey.change) return setToast("Please answer both questions.");
    try {
      await saveMoodlyData({
        type:"survey", email, checkInId,
        understood:survey.understood, moodChange:survey.change,
      });
      setToast("Thanks — your response was saved.");
      setView("home");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not save your response.");
    }
  };
  const endChat = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type:"end" }));
    }
    setMenu(false);
    setView("survey");
  };
  const fmt = (s:number) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;
  const partnerInitials = partnerName.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
  const messageTime = (value:string) => {
    if (value === "Now") return value;
    const parsed = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
    return Number.isNaN(parsed.getTime())
      ? value
      : parsed.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
  };

  if (view === "welcome") return (
    <main className="welcome-shell">
      <div className="aurora a1"/><div className="aurora a2"/>
      <nav className="welcome-nav"><Brand/><button className="text-button" onClick={() => setView("auth")}>Sign in</button></nav>
      <section className="hero">
        <div className="eyebrow"><span/> Private by design</div>
        <h1>Feel it. Share it.<br/><em>Let it move.</em></h1>
        <p>Moodly is an 18+ peer-support app that helps adults name their mood and connect anonymously for a private, one-to-one conversation with someone in a similar or different headspace.</p>
        <button className="primary large" onClick={() => setView("auth")}>Check in with yourself <span>→</span></button>
        <div className="trust-row"><span>◌ No profiles</span><span>◌ No followers</span><span>◌ Just a real conversation</span></div>
      </section>
      <div className="mood-orbit">
        <div className="orbit-card oc1"><i>calm</i><b>Quietly hopeful</b></div>
        <div className="orbit-card oc2"><i>heavy</i><b>A little lost</b></div>
        <div className="orbit-card oc3"><i>bright</i><b>Genuinely excited</b></div>
      </div>
      <section className="purpose-section" aria-labelledby="purpose-title">
        <div className="purpose-heading">
          <span className="overline">WHAT MOODLY DOES</span>
          <h2 id="purpose-title">A private mood check-in, followed by a real human conversation.</h2>
          <p>Moodly gives adults a structured way to identify how they feel, choose the kind of perspective they want, and be matched by mood and shared language for an anonymous conversation. Moodly is not therapy, medical care, or a crisis service.</p>
        </div>
        <div className="purpose-grid">
          <article>
            <span>01</span>
            <h3>Check in</h3>
            <p>Select your energy, mood, and emotion. You can add a short optional note for context.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Match anonymously</h3>
            <p>Choose a similar or different headspace. Moodly matches by mood and language, without showing private profile details.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Why Google sign-in?</h3>
            <p>Moodly uses your Google account identifier and verified email only to create and secure your account. It does not access Gmail, Drive, contacts, or calendar data.</p>
          </article>
        </div>
        <p className="purpose-links"><a href="/privacy">Read our Privacy Policy</a><span>•</span><a href="#" onClick={(event) => { event.preventDefault(); setView("auth"); }}>Sign in to Moodly</a></p>
      </section>
      <footer className="welcome-footer"><a href="/privacy">Privacy Policy</a></footer>
      <button className="help-pill" onClick={() => openOverlay("resources")}>♡ Need help now?</button>
    </main>
  );

  if (view === "auth") return <Auth email={email} setEmail={setEmail} magicSent={magicSent} sending={authSending} onMagic={requestMagicLink} onReset={() => setMagicSent(false)} onBack={() => setView("welcome")}/>;
  if (view === "onboarding") return <Onboarding profile={profile} setProfile={setProfile} onDone={() => void saveProfile("home")} toast={toast}/>;

  return (
    <main className={`app-shell ${view === "chat" ? "chat-bg":""}`}>
      {view !== "chat" && <AppHeader usage={usage} onHome={() => setView("home")} onGuide={() => openOverlay("guide")} onHelp={() => openOverlay("resources")} onSettings={() => openOverlay("settings")}/>}
      {view === "home" && <Home usage={usage} onStart={() => usage >= 10 ? setView("paywall") : setView("energy")} onGuide={() => openOverlay("guide")}/>}
      {view === "energy" && <Question step={1} title="How's your energy right now?" subtitle="Don't overthink it — choose what feels closest." onBack={() => setView("home")}>
        <div className="choice-grid">
          <button className="energy-high" onClick={() => { setEnergy("high"); setView("pleasantness"); }}><span className="choice-art">↗</span><b>High energy</b><small>Activated, alert, buzzing</small></button>
          <button className="energy-low" onClick={() => { setEnergy("low"); setView("pleasantness"); }}><span className="choice-art">〰</span><b>Low energy</b><small>Quiet, slow, still</small></button>
        </div>
      </Question>}
      {view === "pleasantness" && <Question step={2} title="How pleasant does it feel?" subtitle="There isn't a right answer — only yours." onBack={() => setView("energy")}>
        <div className="choice-grid">
          <button className="pleasant" onClick={() => continueFromPleasant(true)}><span className="choice-art">⌣</span><b>Pleasant</b><small>Good, comfortable, welcome</small></button>
          <button className="unpleasant" onClick={() => continueFromPleasant(false)}><span className="choice-art">∿</span><b>Unpleasant</b><small>Difficult, uncomfortable, heavy</small></button>
        </div>
      </Question>}
      {view === "emotion" && <section className="panel emotion-panel">
        <Progress step={3}/><button className="back" onClick={() => setView("pleasantness")}>←</button>
        <div className="center-head"><span className="overline">ONE LAST DETAIL</span><h2>Which word feels closest?</h2><p>Pick the one that best names this moment.</p></div>
        <div className="emotion-grid">{words[quadrant].map(w => <button key={w} onClick={() => chooseEmotion(w)}>{w}</button>)}</div>
        <button className="other" onClick={() => setView("category")}>None of these fit <span>→</span></button>
      </section>}
      {view === "category" && <Question step={3} title="Let's try another direction" subtitle="Choose the broad feeling that feels nearest." onBack={() => setView("emotion")}>
        <div className="category-grid">{(["red","blue","yellow","green"] as Quadrant[]).map(c => <button key={c} onClick={() => { setQuadrant(c); setView("emotion"); }}><span className={`dot ${c}`}/><b>{categoryLabel[c]}</b><small>{c === "red" ? "High & unpleasant":c === "blue" ? "Low & unpleasant":c === "yellow" ? "High & pleasant":"Low & pleasant"}</small></button>)}</div>
      </Question>}
      {view === "context" && <section className="panel compact-panel">
        <Progress step={4}/><button className="back" onClick={() => setView("emotion")}>←</button>
        <div className="feeling-chip">You're feeling <b>{emotion}</b></div>
        <div className="center-head"><h2>Want to add a little context?</h2><p>Optional — just enough to help the conversation begin.</p></div>
        <div className="note-box"><textarea ref={noteRef} maxLength={80} value={note} onChange={e => setNote(e.target.value)} placeholder="A few words about what's going on…"/><span>{note.length}/80</span></div>
        <p className="privacy-note">⌁ Contact details are automatically removed to protect your privacy.</p>
        <button className="primary wide" onClick={() => setView("mode")}>{note ? "Continue":"Skip for now"} <span>→</span></button>
      </section>}
      {view === "mode" && <section className="panel compact-panel">
        <Progress step={5}/><button className="back" onClick={() => setView("context")}>←</button>
        <div className="center-head"><span className="overline">YOUR INTENTION</span><h2>Who would feel right to talk to?</h2><p>You can choose differently every time you check in.</p></div>
        <div className="mode-stack">
          <button className={mode === "similar" ? "selected":""} onClick={() => setMode("similar")}><span className="mode-icon">≈</span><span><b>Someone who feels similar</b><small>Be met by someone in a close emotional place</small></span><i>✓</i></button>
          <button className={mode === "different" ? "selected":""} onClick={() => setMode("different")}><span className="mode-icon">↔</span><span><b>Someone in a different headspace</b><small>Connect with a contrasting perspective</small></span><i>✓</i></button>
        </div>
        <button className="primary wide" onClick={() => void startQueue()}>Find someone <span>→</span></button>
        <p className="free-left">{10-usage} free connections left today</p>
      </section>}
      {view === "queue" && <section className="queue-view">
        <div className="pulse-ring"><div><span>⌁</span></div></div>
        <span className="overline">LOOKING FOR A CONNECTION</span><h2>Finding someone who fits…</h2>
        <p>We're searching for {mode === "similar" ? "someone in a similar emotional place":"a different, complementary headspace"}.</p>
        <div className="queue-card"><div><span>Your check-in</span><b>{emotion}</b></div><div><span>Looking for</span><b>{mode === "similar" ? "A similar feeling":"A different headspace"}</b></div></div>
        <small className="wait">Waiting {fmt(queueSeconds)} · Matching by mood and shared language</small>
        <button className="text-button cancel" onClick={() => void cancelQueue()}>Cancel search</button>
      </section>}
      {view === "chat" && <section className="chat-view">
        <header className="chat-header"><Brand/><div className="partner"><span className="avatar">{partnerInitials}</span><div><b>{partnerName}</b><small><i/> {onlineCount >= 2 ? "Here with you" : socketStatus === "live" ? "Connected" : "Reconnecting…"}</small></div></div><div className="chat-actions"><div className="timer">◷ {fmt(chatSeconds)}</div><button onClick={() => setMenu(!menu)}>•••</button>{menu && <div className="chat-menu"><button onClick={() => setReport(true)}>⚑ Report conversation</button><button onClick={() => { setToast(`${partnerName} has been blocked.`); endChat(); }}>⊘ Block this person</button><button onClick={endChat}>↗ End conversation</button></div>}</div></header>
        <div className="chat-note"><span>Your check-in</span><b>{emotion}</b>{note && <p>“{note}”</p>}</div>
        <div className="messages"><div className="system-note">You're both anonymous. Messages are delivered live and saved securely for this conversation.</div>{messages.map(m => <div key={m.id} className={`bubble-row ${m.mine?"mine":""}`}><div className="bubble">{m.text}<time>{messageTime(m.time)}</time></div></div>)}</div>
        <div className="composer"><button aria-label="Conversation guidance">＋</button><input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Say what's on your mind…"/><button className="send" onClick={send}>↑</button></div>
        <footer className="chat-footer"><button onClick={() => openOverlay("resources")}>♡ Need help now?</button><span>{socketStatus === "live" ? "Live · Messages saved to this conversation" : "Reconnecting securely…"}</span></footer>
        {report && <Modal title={reportDone ? "Report received":"Report conversation"} onClose={() => { setReport(false); setReportDone(false); }}>{reportDone ? <><p>Thank you. The conversation has ended and our safety team will review your report.</p><button className="primary wide" onClick={() => { setReport(false); endChat(); }}>Continue</button></>:<><p className="modal-copy">What happened? Your report is private and reviewed by a person.</p><div className="report-list">{["Harassment or bullying","Sexual content","Hate or discrimination","Sharing personal information","Something else"].map(x => <button key={x} onClick={() => setReportDone(true)}>{x}<span>→</span></button>)}</div></>}</Modal>}
      </section>}
      {view === "survey" && <section className="panel compact-panel survey-panel">
        <div className="survey-art">⌁</div><span className="overline">CONVERSATION COMPLETE</span><h2>How did that feel?</h2><p>Your answer helps us make future matches better.</p>
        <SurveyQuestion label="Did you feel understood in this conversation?" options={["Yes","Somewhat","No"]} value={survey.understood} onChange={v => setSurvey({...survey,understood:v})}/>
        <SurveyQuestion label="How do you feel compared to before?" options={["Better","Same","Worse"]} value={survey.change} onChange={v => setSurvey({...survey,change:v})}/>
        <button className="primary wide" onClick={() => void submitSurvey()}>Submit response</button>
        <button className="text-button skip" onClick={() => setView("home")}>Skip for now</button>
      </section>}
      {view === "paywall" && <Paywall onBack={() => setView("home")} onUpgrade={() => setToast("Secure subscription checkout is ready for your payment provider.")}/>}
      {view === "resources" && <Resources country={profile.country} onBack={() => setView(prior)}/>}
      {view === "guide" && <Guide onBack={() => setView(prior)}/>}
      {view === "settings" && <Settings profile={profile} setProfile={setProfile} onBack={() => setView(prior)} onSave={() => void saveProfile(prior)}/>}
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

function Brand(){ return <div className="brand"><span>m</span><b>Moodly</b></div>; }
function Progress({step}:{step:number}){ return <div className="progress"><span>Step {step} of 5</span><div>{[1,2,3,4,5].map(n => <i className={n<=step?"on":""} key={n}/>)}</div></div>; }
function AppHeader({usage,onHome,onGuide,onHelp,onSettings}:{usage:number,onHome:()=>void,onGuide:()=>void,onHelp:()=>void,onSettings:()=>void}){ return <header className="app-header"><button onClick={onHome}><Brand/></button><div className="app-nav"><span className="usage"><i>{usage}</i> of 10 connections today</span><button onClick={onGuide}>? <b>Guide</b></button><button className="help-now" onClick={onHelp}>♡ Need help now?</button><button className="mini-avatar" onClick={onSettings}>SL</button></div></header>; }
function Question({step,title,subtitle,onBack,children}:{step:number,title:string,subtitle:string,onBack:()=>void,children:React.ReactNode}){ return <section className="panel question-panel"><Progress step={step}/><button className="back" onClick={onBack}>←</button><div className="center-head"><span className="overline">CHECK IN WITH YOURSELF</span><h2>{title}</h2><p>{subtitle}</p></div>{children}<p className="reassure">There are no wrong answers here.</p></section>; }
function Home({usage,onStart,onGuide}:{usage:number,onStart:()=>void,onGuide:()=>void}){ return <section className="home-view"><div className="home-copy"><span className="overline">A QUIET SPACE TO BE HONEST</span><h1>How are you,<br/><em>really?</em></h1><p>Take a breath. Name what you're feeling, then connect with someone who can meet you there.</p><button className="primary large" onClick={onStart}>Start a mood check-in <span>→</span></button><button className="watch" onClick={onGuide}>▷ How Moodly works</button></div><div className="home-visual"><div className="halo"/><div className="breath-card"><div className="breath-orb">⌁</div><span>Take a moment</span><b>There's space for<br/>whatever you feel.</b><small>Inhale · Exhale</small></div><div className="float-note fn1">“I felt heard.”</div><div className="float-note fn2">Anonymous & private</div></div><div className="today-card"><div><span>Today's connections</span><b>{usage} <small>/ 10 free</small></b></div><div className="usage-line"><i style={{width:`${usage*10}%`}}/></div><p>Your count resets at midnight UTC.</p></div></section>; }

function Auth({email,setEmail,magicSent,sending,onMagic,onReset,onBack}:{email:string,setEmail:(v:string)=>void,magicSent:boolean,sending:boolean,onMagic:()=>Promise<void>,onReset:()=>void,onBack:()=>void}){ return <main className="auth-shell"><div className="auth-art"><button className="back light" onClick={onBack}>←</button><Brand/><div className="auth-quote">“Sometimes all you need is someone who gets it.”<small>A private space to talk, without the pressure.</small></div><div className="privacy-card">◌ Your identity stays yours</div></div><section className="auth-form"><div><span className="overline">WELCOME TO MOODLY</span><h1>{magicSent ? "Check your inbox":"A real conversation starts here."}</h1><p>{magicSent ? `We sent a secure, one-time sign-in link to ${email}. Open it on this device to continue.`:"Sign in to check in with yourself and connect anonymously."}</p>{magicSent ? <><div className="mail-illustration">✉</div><button className="text-button skip" disabled={sending} onClick={() => void onMagic()}>{sending ? "Sending…":"Resend email"}</button><button className="text-button skip" onClick={onReset}>Use a different email</button></>:<><button type="button" className="google" onClick={() => window.location.assign("/api/auth/google/start")}><b>G</b> Continue with Google</button><div className="or"><span/>or<span/></div><label>Email address<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" onKeyDown={e => e.key === "Enter" && void onMagic()}/></label><button className="secondary wide" disabled={!email.includes("@") || sending} onClick={() => void onMagic()}>{sending ? "Sending secure link…":"Email me a sign-in link"}</button></>}<small className="terms-copy">By continuing, you agree to Moodly's Terms, acknowledge our <a href="/privacy">Privacy Policy</a>, and understand that Moodly is not a crisis service.</small></div></section></main>; }
function Onboarding({profile,setProfile,onDone,toast}:{profile:Profile,setProfile:(p:Profile)=>void,onDone:()=>void,toast:string}){ const toggle=(l:string)=>setProfile({...profile,languages:profile.languages.includes(l)?profile.languages.filter((x:string)=>x!==l):[...profile.languages,l]}); return <main className="onboard-shell"><header><Brand/><span>Private setup · About 1 minute</span></header><section className="onboard-card"><span className="overline">YOUR PRIVATE PROFILE</span><h1>Just enough to keep Moodly safe.</h1><p>This information is never shown to anyone you match with.</p><div className="form-grid"><label>Age <span>18+ only</span><input type="number" min="18" max="100" value={profile.age} onChange={e=>setProfile({...profile,age:e.target.value})} placeholder="Your age"/></label><label>Gender<select value={profile.gender} onChange={e=>setProfile({...profile,gender:e.target.value})}><option value="">Choose an option</option><option>Woman</option><option>Man</option><option>Non-binary</option><option>Prefer not to say</option><option>Self-describe</option></select></label>{profile.gender==="Self-describe"&&<label className="full">How you describe yourself<input value={profile.customGender} onChange={e=>setProfile({...profile,customGender:e.target.value})}/></label>}<label>Country<select value={profile.country} onChange={e=>setProfile({...profile,country:e.target.value})}>{countries.map(c=><option key={c}>{c}</option>)}</select></label><fieldset><legend>Languages you know <span>Optional</span></legend><div className="language-list">{languages.map(l=><button type="button" className={profile.languages.includes(l)?"active":""} onClick={()=>toggle(l)} key={l}>{l}{profile.languages.includes(l)&&" ✓"}</button>)}</div></fieldset></div><label className="check"><input type="checkbox" checked={profile.terms} onChange={e=>setProfile({...profile,terms:e.target.checked})}/><span>I agree to the <u>Terms & Conditions</u> and acknowledge the <a href="/privacy">Privacy Policy</a>. I understand Moodly is 18+, anonymous but reportable, and not a crisis service.</span></label><button className="primary wide" onClick={onDone}>Complete setup <span>→</span></button></section>{toast&&<div className="toast">{toast}</div>}<button className="help-pill" onClick={()=>{}}>♡ Need help now?</button></main>; }
function SurveyQuestion({label,options,value,onChange}:{label:string,options:string[],value:string,onChange:(v:string)=>void}){ return <div className="survey-q"><b>{label}</b><div>{options.map(o=><button className={value===o?"active":""} key={o} onClick={()=>onChange(o)}>{o}</button>)}</div></div>; }
function Modal({title,onClose,children}:{title:string,onClose:()=>void,children:React.ReactNode}){ return <div className="modal-bg"><div className="modal"><button className="modal-close" onClick={onClose}>×</button><h2>{title}</h2>{children}</div></div>; }
function Resources({country,onBack}:{country:string,onBack:()=>void}){ return <section className="resource-view"><button className="back" onClick={onBack}>←</button><div className="resource-head"><span>♡</span><div><small>IMMEDIATE SUPPORT</small><h1>Need help right now?</h1><p>Moodly isn't a crisis service, but you don't have to face this moment alone.</p></div></div><div className="resource-layout"><div><h3>Emergency contacts for {country}</h3>{country==="Nepal"?<><ResourceCard title="National Suicide Prevention Helpline" number="1166" note="Free, nationwide support"/><ResourceCard title="Police emergency" number="100" note="For immediate danger"/><ResourceCard title="Ambulance" number="102" note="Emergency medical support"/></>:<><ResourceCard title="Local emergency services" number="112 / 911" note="Use the number available in your country"/><ResourceCard title="Find a crisis centre" number="findahelpline.com" note="Verified helplines in 175+ countries"/></>}<p className="resource-foot">If a number doesn't connect, call your local emergency service or go to the nearest emergency department.</p></div><aside><h3>While you reach out</h3><p>Move to a place where other people are nearby.</p><p>Put distance between you and anything you could use to hurt yourself.</p><p>Text or call someone you trust and say: “I need you with me right now.”</p></aside></div></section>; }
function ResourceCard({title,number,note}:{title:string,number:string,note:string}){ return <div className="resource-card"><span>☎</span><div><b>{title}</b><small>{note}</small></div><a href={number.match(/^\d/) ? `tel:${number.replace(/\D/g,"")}`:`https://${number}`}>{number}</a></div>; }
function Guide({onBack}:{onBack:()=>void}){ const items=[["01","Name what you feel","Two quick questions guide you to one of 100 precise emotion words."],["02","Choose your intention","Talk with someone who feels similar, or someone in a different headspace."],["03","Meet anonymously","You're matched by mood and shared language — never by country, age, or gender."],["04","Talk for 20 minutes","A quiet timer keeps things contained. Continue only when you both agree."],["05","Stay in control","Report or block at any time. Emergency resources are always one tap away."]]; return <section className="guide-view"><button className="back" onClick={onBack}>←</button><span className="overline">HOW MOODLY WORKS</span><h1>A small check-in.<br/>A real human moment.</h1><div className="guide-grid">{items.map(x=><div key={x[0]}><i>{x[0]}</i><b>{x[1]}</b><p>{x[2]}</p></div>)}</div><div className="guide-limit"><b>10 conversations a day are free.</b><span>Need more? Moodly Unlimited is ₹1,000/month.</span></div></section>; }
function Settings({profile,setProfile,onBack,onSave}:{profile:Profile,setProfile:(p:Profile)=>void,onBack:()=>void,onSave:()=>void}){ return <section className="settings-view"><button className="back" onClick={onBack}>←</button><span className="overline">ACCOUNT SETTINGS</span><h1>Your private profile</h1><p>These details are never visible to conversation partners.</p><label>Country<select value={profile.country} onChange={e=>setProfile({...profile,country:e.target.value})}>{countries.map(c=><option key={c}>{c}</option>)}</select></label><div className="settings-card"><span className="avatar large-avatar">SL</span><div><b>Your anonymous name changes every 24 hours</b><p>Today's name: <strong>Quiet Sparrow</strong></p></div></div><button className="primary" onClick={onSave}>Save changes</button></section>; }
function Paywall({onBack,onUpgrade}:{onBack:()=>void,onUpgrade:()=>void}){ return <section className="paywall"><button className="back" onClick={onBack}>←</button><div className="pay-visual"><span>∞</span></div><span className="overline">MOODLY UNLIMITED</span><h1>Keep the conversation open.</h1><p>You've used today's 10 free connections. Upgrade for unlimited, anonymous conversations whenever you need them.</p><div className="price"><b>₹1,000</b><span>/ month</span></div><ul><li>Unlimited daily connections</li><li>Cancel anytime</li><li>Your core experience stays private</li></ul><button className="primary wide" onClick={onUpgrade}>Upgrade securely <span>→</span></button><small>Free connections reset at midnight UTC.</small></section>; }
