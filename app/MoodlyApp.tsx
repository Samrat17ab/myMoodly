"use client";
/* eslint-disable react/no-unescaped-entities */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

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

function initialsFor(email: string) {
  const local = email.split("@")[0]?.replace(/[^a-zA-Z]/g, "") ?? "";
  return (local.slice(0, 2) || "?").toUpperCase();
}

const VIEW_PATH: Record<View, string> = {
  welcome: "/",
  auth: "/signin",
  onboarding: "/onboarding",
  home: "/home",
  energy: "/checkin/energy",
  pleasantness: "/checkin/pleasantness",
  emotion: "/checkin/emotion",
  category: "/checkin/category",
  context: "/checkin/note",
  mode: "/checkin/mode",
  queue: "/checkin/matching",
  chat: "/chat",
  survey: "/checkin/survey",
  paywall: "/upgrade",
  resources: "/help",
  guide: "/guide",
  settings: "/profile",
};
const PATH_VIEW = Object.fromEntries(
  (Object.entries(VIEW_PATH) as [View, string][]).map(([v, p]) => [p, v]),
) as Record<string, View>;
// Views it's safe to land on directly from a URL (no in-memory wizard state required).
const AUTHENTICATED_LANDING_VIEWS = new Set<View>(["home", "guide", "resources", "settings", "paywall"]);
const PRE_AUTH_LANDING_VIEWS = new Set<View>(["auth", "guide", "resources"]);

async function readApiResponse(response: Response) {
  const data = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(String(data.error ?? "myMoodly could not save your data."));
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
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [authSending, setAuthSending] = useState(false);
  const [accountBusy, setAccountBusy] = useState(false);
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
  const [partnerEmotion, setPartnerEmotion] = useState("");
  const [partnerNote, setPartnerNote] = useState("");
  const [socketStatus, setSocketStatus] = useState<"connecting"|"live"|"offline">("offline");
  const [onlineCount, setOnlineCount] = useState(0);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const matchTransitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialPathRef = useRef(typeof window !== "undefined" ? window.location.pathname : "/");
  const historyPushesRef = useRef(0);

  const navigate = useCallback((next: View, opts?: { replace?: boolean }) => {
    setView(next);
    if (typeof window === "undefined") return;
    const path = VIEW_PATH[next];
    if (window.location.pathname === path) return;
    const state = { view: next };
    if (opts?.replace) {
      window.history.replaceState(state, "", path);
    } else {
      window.history.pushState(state, "", path);
      historyPushesRef.current += 1;
    }
  }, []);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const state = event.state as { view?: View } | null;
      setView(state?.view ?? PATH_VIEW[window.location.pathname] ?? "home");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const scheduleMatchedChat = useCallback((data: Record<string, unknown>) => {
    if (!data.conversationId) return;
    setConversationId(String(data.conversationId));
    setPartnerName(String(data.partnerName ?? "Anonymous partner"));
    setPartnerEmotion(String(data.partnerEmotion ?? ""));
    setPartnerNote(String(data.partnerNote ?? ""));
    const startsAt = Date.parse(String(data.chatStartsAt ?? ""));
    const delay = Number.isNaN(startsAt) ? 0 : Math.max(0, startsAt - Date.now());
    if (matchTransitionRef.current) clearTimeout(matchTransitionRef.current);
    matchTransitionRef.current = setTimeout(() => {
      setUsage(value => value + 1);
      setChatSeconds(1200);
      setMessages([]);
      navigate("chat");
      matchTransitionRef.current = null;
    }, delay);
  }, [navigate]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(id);
  }, [toast]);
  const completeSignIn = useCallback(async () => {
    try {
      const sessionResponse = await fetch("/api/auth/session", {
        cache: "no-store",
      });
      if (!sessionResponse.ok) return false;
      const session = await sessionResponse.json() as { email?: string };
      const authenticatedEmail = session.email?.trim().toLowerCase() ?? "";
      if (!authenticatedEmail) return false;
      const data = await readApiResponse(await fetch("/api/moodly", {
        cache: "no-store",
      }));
      setEmail(authenticatedEmail);
      setOtp("");
      setOtpSent(false);
      if (data.profile) {
        setProfile(data.profile as Profile);
        setUsage(Number(data.usage ?? 0));
        const requested = PATH_VIEW[initialPathRef.current];
        navigate(requested && AUTHENTICATED_LANDING_VIEWS.has(requested) ? requested : "home", { replace: true });
      } else {
        navigate("onboarding", { replace: true });
      }
      return true;
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not restore your session.");
      return false;
    }
  }, [navigate]);
  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      const authError = new URL(window.location.href).searchParams.get("authError");
      if (authError) {
        if (active) {
          navigate("auth", { replace: true });
          setToast("Google sign-in could not be completed. Please try again.");
        }
        return;
      }
      if (!active) return;
      const signedIn = await completeSignIn();
      if (!active || signedIn) return;
      const requested = PATH_VIEW[initialPathRef.current];
      if (requested && PRE_AUTH_LANDING_VIEWS.has(requested)) {
        navigate(requested, { replace: true });
      }
    };
    void restoreSession();
    return () => {
      active = false;
    };
  }, [completeSignIn, navigate]);
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
          scheduleMatchedChat(data);
        } else if (data.status === "expired" || data.status === "cancelled") {
          active = false;
          setToast("No match was found this time. You can try again.");
          navigate("mode");
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
      if (matchTransitionRef.current) {
        clearTimeout(matchTransitionRef.current);
        matchTransitionRef.current = null;
      }
    };
  }, [view, ticketId, email, scheduleMatchedChat, navigate]);
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
          navigate("survey");
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
  }, [view, conversationId, navigate]);

  const openOverlay = (v: View) => { navigate(v); setMenu(false); };
  const goBack = useCallback(() => {
    if (historyPushesRef.current > 0) {
      historyPushesRef.current -= 1;
      window.history.back();
    } else {
      navigate(email ? "home" : "welcome");
    }
  }, [navigate, email]);
  const continueFromPleasant = (value:boolean) => { setPleasant(value); const next = energy === "high" ? (value ? "yellow":"red") : (value ? "green":"blue"); setQuadrant(next); navigate("emotion"); };
  const chooseEmotion = (word:string) => { setEmotion(word); navigate("context"); setTimeout(() => noteRef.current?.focus(), 80); };
  const requestCode = async () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || authSending) return;
    setAuthSending(true);
    try {
      const data = await readApiResponse(await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      }));
      setEmail(normalized);
      if (data.verified) {
        await completeSignIn();
      } else {
        setOtp("");
        setOtpSent(true);
      }
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not send the sign-in code.");
    } finally {
      setAuthSending(false);
    }
  };
  const verifyCode = async () => {
    const normalized = email.trim().toLowerCase();
    const trimmedCode = otp.trim();
    if (!normalized || trimmedCode.length !== 6 || authSending) return;
    setAuthSending(true);
    try {
      await readApiResponse(await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: normalized, code: trimmedCode }),
      }));
      await completeSignIn();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "That code is invalid or has expired.");
    } finally {
      setAuthSending(false);
    }
  };
  const saveProfile = async (afterSave: () => void) => {
    if (+profile.age < 18) return setToast("myMoodly is only available to people aged 18 or older.");
    if (!profile.gender || !profile.terms) return setToast("Please complete the required fields.");
    try {
      await saveMoodlyData({ type:"profile", email, profile });
      setToast("Your private profile was saved.");
      afterSave();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not save your profile.");
    }
  };
  const signOut = async () => {
    if (accountBusy) return;
    setAccountBusy(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch {
      // Clearing local state below still signs the user out of this device.
    } finally {
      setEmail("");
      setOtp("");
      setOtpSent(false);
      setProfile(emptyProfile);
      setUsage(0);
      navigate("welcome", { replace: true });
      setToast("You've been signed out.");
      setAccountBusy(false);
    }
  };
  const deleteAccount = async () => {
    if (accountBusy) return;
    setAccountBusy(true);
    try {
      await readApiResponse(await fetch("/api/moodly", { method: "DELETE" }));
      setEmail("");
      setOtp("");
      setOtpSent(false);
      setProfile(emptyProfile);
      setUsage(0);
      navigate("welcome", { replace: true });
      setToast("Your account and data have been deleted.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not delete your account.");
    } finally {
      setAccountBusy(false);
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
      navigate("queue");
      if (match.status === "matched" && match.conversationId) {
        scheduleMatchedChat(match);
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
        scheduleMatchedChat(result);
        return;
      }
      setTicketId("");
      navigate("mode");
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
      navigate("home");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not save your response.");
    }
  };
  const endChat = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type:"end" }));
    }
    setMenu(false);
    navigate("survey");
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
      <nav className="welcome-nav"><Brand/><button className="text-button" onClick={() => navigate("auth")}>Sign in</button></nav>
      <section className="hero">
        <div className="eyebrow"><span/> Private by design</div>
        <h1>Feel it. Share it.<br/><em>Let it move.</em></h1>
        <p>myMoodly is an 18+ peer-support app that helps adults name their mood and connect anonymously for a private, one-to-one conversation with someone in a similar or different headspace.</p>
        <button className="primary large" onClick={() => navigate("auth")}>Check in with yourself <span>→</span></button>
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
          <p>myMoodly gives adults a structured way to identify how they feel, choose the kind of perspective they want, and be matched by mood and shared language for an anonymous conversation. myMoodly is not therapy, medical care, or a crisis service.</p>
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
            <p>Choose a similar or different headspace. myMoodly matches by mood and language, without showing private profile details.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Why Google sign-in?</h3>
            <p>myMoodly uses your Google account identifier and verified email only to create and secure your account. It does not access Gmail, Drive, contacts, or calendar data.</p>
          </article>
        </div>
        <p className="purpose-links"><Link href="/privacy">Read our Privacy Policy</Link><span>•</span><a href="#" onClick={(event) => { event.preventDefault(); navigate("auth"); }}>Sign in to myMoodly</a></p>
      </section>
      <footer className="welcome-footer"><Link href="/privacy">Privacy Policy</Link></footer>
      <button className="help-pill" onClick={() => openOverlay("resources")}>♡ Need help now?</button>
    </main>
  );

  if (view === "auth") return <Auth email={email} setEmail={setEmail} otp={otp} setOtp={setOtp} otpSent={otpSent} sending={authSending} onRequestCode={requestCode} onVerifyCode={verifyCode} onReset={() => { setOtpSent(false); setOtp(""); }} onBack={() => navigate("welcome")}/>;
  if (view === "onboarding") return <Onboarding profile={profile} setProfile={setProfile} onDone={() => void saveProfile(() => navigate("home", { replace: true }))} toast={toast}/>;

  return (
    <main className={`app-shell ${view === "chat" ? "chat-bg":""}`}>
      {view !== "chat" && <AppHeader usage={usage} email={email} onHome={() => navigate("home")} onGuide={() => openOverlay("guide")} onHelp={() => openOverlay("resources")} onSettings={() => openOverlay("settings")}/>}
      {view === "home" && <Home usage={usage} onStart={() => navigate(usage >= 10 ? "paywall" : "energy")} onGuide={() => openOverlay("guide")}/>}
      {view === "energy" && <Question step={1} title="How's your energy right now?" subtitle="Don't overthink it — choose what feels closest." onBack={() => navigate("home")}>
        <div className="choice-grid">
          <button className="energy-high" onClick={() => { setEnergy("high"); navigate("pleasantness"); }}><span className="choice-art">↗</span><b>High energy</b><small>Activated, alert, buzzing</small></button>
          <button className="energy-low" onClick={() => { setEnergy("low"); navigate("pleasantness"); }}><span className="choice-art">〰</span><b>Low energy</b><small>Quiet, slow, still</small></button>
        </div>
      </Question>}
      {view === "pleasantness" && <Question step={2} title="How pleasant does it feel?" subtitle="There isn't a right answer — only yours." onBack={() => navigate("energy")}>
        <div className="choice-grid">
          <button className="pleasant" onClick={() => continueFromPleasant(true)}><span className="choice-art">⌣</span><b>Pleasant</b><small>Good, comfortable, welcome</small></button>
          <button className="unpleasant" onClick={() => continueFromPleasant(false)}><span className="choice-art">∿</span><b>Unpleasant</b><small>Difficult, uncomfortable, heavy</small></button>
        </div>
      </Question>}
      {view === "emotion" && <section className="panel emotion-panel">
        <Progress step={3}/><button className="back" onClick={() => navigate("pleasantness")}>←</button>
        <div className="center-head"><span className="overline">ONE LAST DETAIL</span><h2>Which word feels closest?</h2><p>Pick the one that best names this moment.</p></div>
        <div className="emotion-grid">{words[quadrant].map(w => <button key={w} onClick={() => chooseEmotion(w)}>{w}</button>)}</div>
        <button className="other" onClick={() => navigate("category")}>None of these fit <span>→</span></button>
      </section>}
      {view === "category" && <Question step={3} title="Let's try another direction" subtitle="Choose the broad feeling that feels nearest." onBack={() => navigate("emotion")}>
        <div className="category-grid">{(["red","blue","yellow","green"] as Quadrant[]).map(c => <button key={c} onClick={() => { setQuadrant(c); navigate("emotion"); }}><span className={`dot ${c}`}/><b>{categoryLabel[c]}</b><small>{c === "red" ? "High & unpleasant":c === "blue" ? "Low & unpleasant":c === "yellow" ? "High & pleasant":"Low & pleasant"}</small></button>)}</div>
      </Question>}
      {view === "context" && <section className="panel compact-panel">
        <Progress step={4}/><button className="back" onClick={() => navigate("emotion")}>←</button>
        <div className="feeling-chip">You're feeling <b>{emotion}</b></div>
        <div className="center-head"><h2>Want to add a little context?</h2><p>Optional — just enough to help the conversation begin.</p></div>
        <div className="note-box"><textarea ref={noteRef} maxLength={80} value={note} onChange={e => setNote(e.target.value)} placeholder="A few words about what's going on…"/><span>{note.length}/80</span></div>
        <p className="privacy-note">⌁ Contact details are automatically removed to protect your privacy.</p>
        <button className="primary wide" onClick={() => navigate("mode")}>{note ? "Continue":"Skip for now"} <span>→</span></button>
      </section>}
      {view === "mode" && <section className="panel compact-panel">
        <Progress step={5}/><button className="back" onClick={() => navigate("context")}>←</button>
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
        <div className="chat-note"><span>{partnerName}'s check-in</span><b>{partnerEmotion || "Shared privately"}</b>{partnerNote && <p>“{partnerNote}”</p>}</div>
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
        <button className="text-button skip" onClick={() => navigate("home")}>Skip for now</button>
      </section>}
      {view === "paywall" && <Paywall onBack={() => navigate("home")} onUpgrade={() => setToast("Secure subscription checkout is ready for your payment provider.")}/>}
      {view === "resources" && <Resources country={profile.country} onBack={goBack}/>}
      {view === "guide" && <Guide onBack={goBack}/>}
      {view === "settings" && <Settings profile={profile} setProfile={setProfile} email={email} usage={usage} busy={accountBusy} onBack={goBack} onSave={() => void saveProfile(goBack)} onSignOut={() => void signOut()} onDeleteAccount={() => void deleteAccount()}/>}
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

function Brand(){ return <div className="brand"><span>m</span><b>myMoodly</b></div>; }
function Progress({step}:{step:number}){ return <div className="progress"><span>Step {step} of 5</span><div>{[1,2,3,4,5].map(n => <i className={n<=step?"on":""} key={n}/>)}</div></div>; }
function AppHeader({usage,email,onHome,onGuide,onHelp,onSettings}:{usage:number,email:string,onHome:()=>void,onGuide:()=>void,onHelp:()=>void,onSettings:()=>void}){ return <header className="app-header"><button onClick={onHome}><Brand/></button><div className="app-nav"><span className="usage"><i>{usage}</i> of 10 connections today</span><button onClick={onGuide}>? <b>Guide</b></button><button className="help-now" onClick={onHelp}>♡ Need help now?</button><button className="mini-avatar" onClick={onSettings} title="Account settings">{initialsFor(email)}</button></div></header>; }
function Question({step,title,subtitle,onBack,children}:{step:number,title:string,subtitle:string,onBack:()=>void,children:React.ReactNode}){ return <section className="panel question-panel"><Progress step={step}/><button className="back" onClick={onBack}>←</button><div className="center-head"><span className="overline">CHECK IN WITH YOURSELF</span><h2>{title}</h2><p>{subtitle}</p></div>{children}<p className="reassure">There are no wrong answers here.</p></section>; }
function Home({usage,onStart,onGuide}:{usage:number,onStart:()=>void,onGuide:()=>void}){ return <section className="home-view"><div className="home-copy"><span className="overline">A QUIET SPACE TO BE HONEST</span><h1>How are you,<br/><em>really?</em></h1><p>Take a breath. Name what you're feeling, then connect with someone who can meet you there.</p><button className="primary large" onClick={onStart}>Start a mood check-in <span>→</span></button><button className="watch" onClick={onGuide}>▷ How myMoodly works</button></div><div className="home-visual"><div className="halo"/><div className="breath-card"><div className="breath-orb">⌁</div><span>Take a moment</span><b>There's space for<br/>whatever you feel.</b><small>Inhale · Exhale</small></div><div className="float-note fn1">“I felt heard.”</div><div className="float-note fn2">Anonymous & private</div></div><div className="today-card"><div><span>Today's connections</span><b>{usage} <small>/ 10 free</small></b></div><div className="usage-line"><i style={{width:`${usage*10}%`}}/></div><p>Your count resets at midnight UTC.</p></div></section>; }

function Auth({email,setEmail,otp,setOtp,otpSent,sending,onRequestCode,onVerifyCode,onReset,onBack}:{email:string,setEmail:(v:string)=>void,otp:string,setOtp:(v:string)=>void,otpSent:boolean,sending:boolean,onRequestCode:()=>Promise<void>,onVerifyCode:()=>Promise<void>,onReset:()=>void,onBack:()=>void}){ return <main className="auth-shell"><div className="auth-art"><button className="back light" onClick={onBack}>←</button><Brand/><div className="auth-quote">“Sometimes all you need is someone who gets it.”<small>A private space to talk, without the pressure.</small></div><div className="privacy-card">◌ Your identity stays yours</div></div><section className="auth-form"><div><span className="overline">WELCOME TO MYMOODLY</span><h1>{otpSent ? "Enter your code":"A real conversation starts here."}</h1><p>{otpSent ? `We sent a 6-digit code to ${email}. Enter it below to continue.`:"Sign in to check in with yourself and connect anonymously."}</p>{otpSent ? <><label>Verification code<input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="123456" onKeyDown={e => e.key === "Enter" && void onVerifyCode()}/></label><button className="secondary wide" disabled={otp.length !== 6 || sending} onClick={() => void onVerifyCode()}>{sending ? "Verifying…":"Verify & continue"}</button><button className="text-button skip" disabled={sending} onClick={() => void onRequestCode()}>{sending ? "Sending…":"Resend code"}</button><button className="text-button skip" onClick={onReset}>Use a different email</button></>:<><button type="button" className="google" onClick={() => window.location.assign("/api/auth/google/start")}><b>G</b> Continue with Google</button><div className="or"><span/>or<span/></div><label>Email address<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" onKeyDown={e => e.key === "Enter" && void onRequestCode()}/></label><button className="secondary wide" disabled={!email.includes("@") || sending} onClick={() => void onRequestCode()}>{sending ? "Sending code…":"Email me a sign-in code"}</button></>}<small className="terms-copy">By continuing, you agree to myMoodly's Terms, acknowledge our <Link href="/privacy">Privacy Policy</Link>, and understand that myMoodly is not a crisis service.</small></div></section></main>; }
function Onboarding({profile,setProfile,onDone,toast}:{profile:Profile,setProfile:(p:Profile)=>void,onDone:()=>void,toast:string}){ const toggle=(l:string)=>setProfile({...profile,languages:profile.languages.includes(l)?profile.languages.filter((x:string)=>x!==l):[...profile.languages,l]}); return <main className="onboard-shell"><header><Brand/><span>Private setup · About 1 minute</span></header><section className="onboard-card"><span className="overline">YOUR PRIVATE PROFILE</span><h1>Just enough to keep myMoodly safe.</h1><p>This information is never shown to anyone you match with.</p><div className="form-grid"><label>Age <span>18+ only</span><input type="number" min="18" max="100" value={profile.age} onChange={e=>setProfile({...profile,age:e.target.value})} placeholder="Your age"/></label><label>Gender<select value={profile.gender} onChange={e=>setProfile({...profile,gender:e.target.value})}><option value="">Choose an option</option><option>Woman</option><option>Man</option><option>Non-binary</option><option>Prefer not to say</option><option>Self-describe</option></select></label>{profile.gender==="Self-describe"&&<label className="full">How you describe yourself<input value={profile.customGender} onChange={e=>setProfile({...profile,customGender:e.target.value})}/></label>}<label>Country<select value={profile.country} onChange={e=>setProfile({...profile,country:e.target.value})}>{countries.map(c=><option key={c}>{c}</option>)}</select></label><fieldset><legend>Languages you know <span>Optional</span></legend><div className="language-list">{languages.map(l=><button type="button" className={profile.languages.includes(l)?"active":""} onClick={()=>toggle(l)} key={l}>{l}{profile.languages.includes(l)&&" ✓"}</button>)}</div></fieldset></div><label className="check"><input type="checkbox" checked={profile.terms} onChange={e=>setProfile({...profile,terms:e.target.checked})}/><span>I agree to the <u>Terms & Conditions</u> and acknowledge the <Link href="/privacy">Privacy Policy</Link>. I understand myMoodly is 18+, anonymous but reportable, and not a crisis service.</span></label><button className="primary wide" onClick={onDone}>Complete setup <span>→</span></button></section>{toast&&<div className="toast">{toast}</div>}<button className="help-pill" onClick={()=>{}}>♡ Need help now?</button></main>; }
function SurveyQuestion({label,options,value,onChange}:{label:string,options:string[],value:string,onChange:(v:string)=>void}){ return <div className="survey-q"><b>{label}</b><div>{options.map(o=><button className={value===o?"active":""} key={o} onClick={()=>onChange(o)}>{o}</button>)}</div></div>; }
function Modal({title,onClose,children}:{title:string,onClose:()=>void,children:React.ReactNode}){ return <div className="modal-bg"><div className="modal"><button className="modal-close" onClick={onClose}>×</button><h2>{title}</h2>{children}</div></div>; }
function Resources({country,onBack}:{country:string,onBack:()=>void}){ return <section className="resource-view"><button className="back" onClick={onBack}>←</button><div className="resource-head"><span>♡</span><div><small>IMMEDIATE SUPPORT</small><h1>Need help right now?</h1><p>myMoodly isn't a crisis service, but you don't have to face this moment alone.</p></div></div><div className="resource-layout"><div><h3>Emergency contacts for {country}</h3>{country==="Nepal"?<><ResourceCard title="National Suicide Prevention Helpline" number="1166" note="Free, nationwide support"/><ResourceCard title="Police emergency" number="100" note="For immediate danger"/><ResourceCard title="Ambulance" number="102" note="Emergency medical support"/></>:<><ResourceCard title="Local emergency services" number="112 / 911" note="Use the number available in your country"/><ResourceCard title="Find a crisis centre" number="findahelpline.com" note="Verified helplines in 175+ countries"/></>}<p className="resource-foot">If a number doesn't connect, call your local emergency service or go to the nearest emergency department.</p></div><aside><h3>While you reach out</h3><p>Move to a place where other people are nearby.</p><p>Put distance between you and anything you could use to hurt yourself.</p><p>Text or call someone you trust and say: “I need you with me right now.”</p></aside></div></section>; }
function ResourceCard({title,number,note}:{title:string,number:string,note:string}){ return <div className="resource-card"><span>☎</span><div><b>{title}</b><small>{note}</small></div><a href={number.match(/^\d/) ? `tel:${number.replace(/\D/g,"")}`:`https://${number}`}>{number}</a></div>; }
function Guide({onBack}:{onBack:()=>void}){ const items=[["01","Name what you feel","Two quick questions guide you to one of 100 precise emotion words."],["02","Choose your intention","Talk with someone who feels similar, or someone in a different headspace."],["03","Meet anonymously","You're matched by mood and shared language — never by country, age, or gender."],["04","Talk for 20 minutes","A quiet timer keeps things contained. Continue only when you both agree."],["05","Stay in control","Report or block at any time. Emergency resources are always one tap away."]]; return <section className="guide-view"><button className="back" onClick={onBack}>←</button><span className="overline">HOW MYMOODLY WORKS</span><h1>A small check-in.<br/>A real human moment.</h1><div className="guide-grid">{items.map(x=><div key={x[0]}><i>{x[0]}</i><b>{x[1]}</b><p>{x[2]}</p></div>)}</div><div className="guide-limit"><b>10 conversations a day are free.</b><span></span></div></section>; }
function Settings({profile,setProfile,email,usage,busy,onBack,onSave,onSignOut,onDeleteAccount}:{profile:Profile,setProfile:(p:Profile)=>void,email:string,usage:number,busy:boolean,onBack:()=>void,onSave:()=>void,onSignOut:()=>void,onDeleteAccount:()=>void}){
  const [confirmDelete,setConfirmDelete]=useState(false);
  const toggle=(l:string)=>setProfile({...profile,languages:profile.languages.includes(l)?profile.languages.filter((x:string)=>x!==l):[...profile.languages,l]});
  return <section className="settings-view">
    <button className="back" onClick={onBack}>←</button>
    <span className="overline">ACCOUNT SETTINGS</span>
    <h1>Your private profile</h1>
    <p>These details are never visible to conversation partners.</p>
    <div className="settings-card">
      <span className="avatar large-avatar">{initialsFor(email)}</span>
      <div><b>Signed in as</b><p>{email}</p></div>
    </div>
    <div className="settings-card">
      <span className="avatar large-avatar">◔</span>
      <div><b>Today's connections</b><p>{usage} of 10 free connections used · resets at midnight UTC</p></div>
    </div>
    <div className="form-grid">
      <label>Age <span>18+ only</span><input type="number" min="18" max="100" value={profile.age} onChange={e=>setProfile({...profile,age:e.target.value})} placeholder="Your age"/></label>
      <label>Gender<select value={profile.gender} onChange={e=>setProfile({...profile,gender:e.target.value})}><option value="">Choose an option</option><option>Woman</option><option>Man</option><option>Non-binary</option><option>Prefer not to say</option><option>Self-describe</option></select></label>
      {profile.gender==="Self-describe"&&<label className="full">How you describe yourself<input value={profile.customGender} onChange={e=>setProfile({...profile,customGender:e.target.value})}/></label>}
      <label>Country<select value={profile.country} onChange={e=>setProfile({...profile,country:e.target.value})}>{countries.map(c=><option key={c}>{c}</option>)}</select></label>
      <fieldset><legend>Languages you know <span>Optional</span></legend><div className="language-list">{languages.map(l=><button type="button" className={profile.languages.includes(l)?"active":""} onClick={()=>toggle(l)} key={l}>{l}{profile.languages.includes(l)&&" ✓"}</button>)}</div></fieldset>
    </div>
    <button className="primary" disabled={busy} onClick={onSave}>Save changes</button>
    <div className="settings-actions">
      <button className="text-button skip" disabled={busy} onClick={onSignOut}>{busy?"Working…":"Sign out"}</button>
      <button className="text-button skip danger" disabled={busy} onClick={()=>setConfirmDelete(true)}>Delete account &amp; data</button>
    </div>
    {confirmDelete&&<Modal title="Delete your account?" onClose={()=>setConfirmDelete(false)}>
      <p className="modal-copy">This permanently deletes your profile, mood check-ins, and conversation history. This can&apos;t be undone.</p>
      <button className="primary wide danger-solid" disabled={busy} onClick={()=>{setConfirmDelete(false);onDeleteAccount();}}>{busy?"Deleting…":"Yes, delete everything"}</button>
      <button className="text-button skip" disabled={busy} onClick={()=>setConfirmDelete(false)}>Cancel</button>
    </Modal>}
  </section>;
}
function Paywall({onBack,onUpgrade}:{onBack:()=>void,onUpgrade:()=>void}){ return <section className="paywall"><button className="back" onClick={onBack}>←</button><div className="pay-visual"><span>∞</span></div><span className="overline">MOODLY UNLIMITED</span><h1>Keep the conversation open.</h1><p>You've used today's 10 free connections. Upgrade for unlimited, anonymous conversations whenever you need them.</p><div className="price"><b>₹1,000</b><span>/ month</span></div><ul><li>Unlimited daily connections</li><li>Cancel anytime</li><li>Your core experience stays private</li></ul><button className="primary wide" onClick={onUpgrade}>Upgrade securely <span>→</span></button><small>Free connections reset at midnight UTC.</small></section>; }
