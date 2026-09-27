"use client";
/* eslint-disable react/no-unescaped-entities */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brand } from "@/app/components/shared/Brand";
import { Landing } from "@/app/components/screens/Landing";
import { SignIn } from "@/app/components/screens/SignIn";
import { Home } from "@/app/components/screens/Home";
import { Waiting } from "@/app/components/screens/Waiting";
import { Chat } from "@/app/components/screens/Chat";
import { ClosingReflection } from "@/app/components/screens/ClosingReflection";
import { Modal } from "@/app/components/shared/Modal";
import { HelpSheet } from "@/app/components/shared/HelpSheet";
import { Paywall } from "@/app/components/screens/Paywall";
import { IconHelp } from "@/app/components/icons";
import { MoodMapStep } from "@/app/components/screens/checkin/MoodMapStep";
import type { MoodValue } from "@/app/components/shared/MoodMapField";
import { WordPickerStep } from "@/app/components/screens/checkin/WordPickerStep";
import { QuadrantFallbackStep } from "@/app/components/screens/checkin/QuadrantFallbackStep";
import { ContextStep } from "@/app/components/screens/checkin/ContextStep";
import { IntentionStep } from "@/app/components/screens/checkin/IntentionStep";
import { useReducedMotionSafe } from "@/app/hooks/useReducedMotionSafe";
import { stepVariants, reducedStepVariants } from "@/app/lib/motion";

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
  type?: "ready" | "message" | "presence" | "ended" | "error" | "extended" | "extend-requested";
  history?: ChatMessage[];
  message?: ChatMessage | string;
  online?: number;
  expiresAt?: number;
  mine?: boolean;
};
type View =
  | "welcome" | "auth" | "onboarding" | "home" | "mood"
  | "emotion" | "category" | "context" | "mode" | "queue" | "chat"
  | "survey" | "paywall" | "resources" | "guide" | "settings";

// Check-in steps that share one AnimatePresence crossfade+drift transition.
const CHECKIN_VIEWS = new Set<View>(["mood", "emotion", "category", "context", "mode"]);

const words: Record<Quadrant, string[]> = {
  red: ["Enraged","Panicked","Stressed","Jittery","Shocked","Furious","Anxious","Livid","Frustrated","Tense","Stunned","Irritated","Fuming","Overwhelmed","Uneasy","Restless","Repulsed","Troubled","Peeved","Nervous","Annoyed","Apprehensive","Displeased","Worried","Bothered"],
  yellow: ["Surprised","Upbeat","Festive","Exhilarated","Ecstatic","Energized","Elated","Enthusiastic","Optimistic","Excited","Cheerful","Motivated","Inspired","Eager","Playful","Amused","Delighted","Blissful","Thrilled","Hyper","Proud","Joyful","Hopeful","Pleased","Focused"],
  green: ["At Ease","Content","Loving","Fulfilled","Calm","Secure","Satisfied","Relaxed","Chill","Restful","Blessed","Balanced","Mellow","Thoughtful","Peaceful","Comfortable","Carefree","Sleepy","Complacent","Tranquil","Cozy","Serene","Grateful","Touched","Reflective"],
  blue: ["Disappointed","Down","Apathetic","Pessimistic","Alienated","Miserable","Lonely","Disheartened","Guilty","Despondent","Hopeless","Empty","Remorseful","Depressed","Sad","Bored","Fatigued","Tired","Exhausted","Numb","Withdrawn","Isolated","Gloomy","Melancholic","Weary"],
};
// How far the placed light sits from dead-center (0 = center, 1 = corner),
// used to pick which slice of the 25-word list to show -- narrows the word
// step from all 25 down to a nearby handful instead of overwhelming the
// user with the full grid every time.
function moodIntensity(value: MoodValue) {
  const d = Math.hypot(value.pleasant - 0.5, value.energy - 0.5);
  return Math.min(1, Math.max(0, d / 0.6));
}
function wordsNear(quadrant: Quadrant, value: MoodValue, count = 10) {
  const list = words[quadrant];
  if (count >= list.length) return list;
  const start = Math.round(moodIntensity(value) * (list.length - count));
  return list.slice(start, start + count);
}
const countries = ["Nepal","India","United States","United Kingdom","Australia","Canada","Germany","France","Japan","Singapore","Other"];
const languages = ["English","Nepali","Hindi","Spanish","French","German","Mandarin","Japanese"];
const emptyProfile: Profile = { age:"", gender:"", customGender:"", country:"Nepal", languages:["English"], terms:false };

function initialsFor(nickname: string, email: string) {
  const words = nickname.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  const local = email.split("@")[0]?.replace(/[^a-zA-Z]/g, "") ?? "";
  return (local.slice(0, 2) || "?").toUpperCase();
}

const VIEW_PATH: Record<View, string> = {
  welcome: "/",
  auth: "/signin",
  onboarding: "/onboarding",
  home: "/home",
  mood: "/checkin/mood",
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
  const reducedMotion = useReducedMotionSafe();
  const [view, setView] = useState<View>("welcome");
  const [energy, setEnergy] = useState<"high"|"low"|null>(null);
  const [pleasant, setPleasant] = useState<boolean|null>(null);
  const [quadrant, setQuadrant] = useState<Quadrant>("green");
  const [moodValue, setMoodValue] = useState<MoodValue>({ pleasant: 0.5, energy: 0.5 });
  const [moodTouched, setMoodTouched] = useState(false);
  const [emotion, setEmotion] = useState("");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"similar"|"different">("similar");
  const [queueSeconds, setQueueSeconds] = useState(0);
  const [usage, setUsage] = useState(0);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [authSending, setAuthSending] = useState(false);
  const [accountBusy, setAccountBusy] = useState(false);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [chatSeconds, setChatSeconds] = useState(1200);
  const [chatExpiresAt, setChatExpiresAt] = useState<number | null>(null);
  const [extendRequestedByMe, setExtendRequestedByMe] = useState(false);
  const [extendRequestedByPartner, setExtendRequestedByPartner] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [report, setReport] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [reportSending, setReportSending] = useState(false);
  const [toast, setToast] = useState("");
  const [matchFound, setMatchFound] = useState(false);
  const [survey, setSurvey] = useState({ understood:"", change:"", partnerRating:"" });
  const [checkInId, setCheckInId] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [canRelax, setCanRelax] = useState(false);
  const [relaxDismissed, setRelaxDismissed] = useState(false);
  const [relaxRequesting, setRelaxRequesting] = useState(false);
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
  const [checkinDirection, setCheckinDirection] = useState<1 | -1>(1);

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
    setMatchFound(true);
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
      setChatExpiresAt(null);
      setExtendRequestedByMe(false);
      setExtendRequestedByPartner(false);
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
      setNickname(typeof data.nickname === "string" ? data.nickname : "");
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
        } else {
          setCanRelax(Boolean(data.canRelax));
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
    if (view !== "chat" || !chatExpiresAt) return;
    // Recomputed from the shared server end-time on every tick (rather than
    // decremented locally) so a paused JS timer -- backgrounded tab, sleeping
    // device -- snaps back to the true remaining time the instant it resumes,
    // instead of resuming a stale local countdown from wherever it left off.
    const update = () => setChatSeconds(Math.max(0, Math.round((chatExpiresAt - Date.now()) / 1000)));
    update();
    const tick = setInterval(update, 1000);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", update);
    };
  }, [view, chatExpiresAt]);
  useEffect(() => {
    if (!resendAvailableAt) return;
    const update = () => setResendSeconds(Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000)));
    update();
    const tick = setInterval(update, 1000);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", update);
    };
  }, [resendAvailableAt]);
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
        if (payload.type === "ready") {
          if (Array.isArray(payload.history)) setMessages(payload.history as ChatMessage[]);
          if (typeof payload.expiresAt === "number") setChatExpiresAt(payload.expiresAt);
        } else if (payload.type === "message" && typeof payload.message === "object") {
          const incoming = payload.message as ChatMessage;
          setMessages(current =>
            current.some(item => item.id === incoming.id)
              ? current
              : [...current, incoming],
          );
        } else if (payload.type === "presence") {
          setOnlineCount(Number(payload.online ?? 0));
        } else if (payload.type === "extended") {
          if (typeof payload.expiresAt === "number") setChatExpiresAt(payload.expiresAt);
          setExtendRequestedByMe(false);
          setExtendRequestedByPartner(false);
          setToast("You're both continuing — 20 more minutes added.");
        } else if (payload.type === "extend-requested") {
          if (payload.mine) setExtendRequestedByMe(true);
          else setExtendRequestedByPartner(true);
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
    // A real tab close/navigation-away fires pagehide/beforeunload; an OS or
    // device sleep does not (the page stays loaded), so this only ends the
    // conversation when the user actually leaves, never when their device
    // just goes to sleep mid-chat.
    const onLeavePage = () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "end" }));
      }
    };
    window.addEventListener("pagehide", onLeavePage);
    window.addEventListener("beforeunload", onLeavePage);
    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      window.removeEventListener("pagehide", onLeavePage);
      window.removeEventListener("beforeunload", onLeavePage);
      socketRef.current?.close(1000, "Leaving conversation");
      socketRef.current = null;
    };
  }, [view, conversationId, navigate]);

  const openOverlay = (v: View) => { navigate(v); };
  const goBack = useCallback(() => {
    if (historyPushesRef.current > 0) {
      historyPushesRef.current -= 1;
      window.history.back();
    } else {
      navigate(email ? "home" : "welcome");
    }
  }, [navigate, email]);
  const navigateCheckin = useCallback((next: View, direction: 1 | -1) => {
    setCheckinDirection(direction);
    navigate(next);
  }, [navigate]);
  const changeMood = (value: MoodValue) => {
    setMoodValue(value);
    setMoodTouched(true);
  };
  const pickMoodQuadrant = (nextEnergy: "high"|"low", nextPleasant: boolean) => {
    setMoodValue({
      energy: nextEnergy === "high" ? 0.8 : 0.2,
      pleasant: nextPleasant ? 0.8 : 0.2,
    });
    setMoodTouched(true);
  };
  const continueFromMood = () => {
    const nextEnergy = moodValue.energy >= 0.5 ? "high" : "low";
    const nextPleasant = moodValue.pleasant >= 0.5;
    const next: Quadrant = nextEnergy === "high" ? (nextPleasant ? "yellow":"red") : (nextPleasant ? "green":"blue");
    setEnergy(nextEnergy);
    setPleasant(nextPleasant);
    setQuadrant(next);
    navigateCheckin("emotion", 1);
  };
  const chooseEmotion = (word:string) => { setEmotion(word); navigateCheckin("context", 1); setTimeout(() => noteRef.current?.focus(), 80); };
  const requestCode = async () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || authSending || resendSeconds > 0) return;
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
        setResendAvailableAt(Date.now() + 60_000);
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
      const data = await saveMoodlyData({ type:"profile", email, profile });
      if (typeof data.nickname === "string") setNickname(data.nickname);
      setToast("Your private profile was saved.");
      afterSave();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not save your profile.");
    }
  };
  const submitFeedback = async (body: string, afterSend: () => void) => {
    if (feedbackSending) return;
    setFeedbackSending(true);
    try {
      await saveMoodlyData({ type:"feedback", body });
      setToast("Thanks — your feedback was sent to the myMoodly team.");
      afterSend();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not send your feedback.");
    } finally {
      setFeedbackSending(false);
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
      setNickname("");
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
      setNickname("");
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
      setCanRelax(false);
      setRelaxDismissed(false);
      setQueueSeconds(0);
      setMatchFound(false);
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
  const requestRelax = async () => {
    if (relaxRequesting || !ticketId) return;
    setRelaxRequesting(true);
    try {
      const result = await matchRequest({ action:"relax", ticketId, email });
      setCanRelax(false);
      if (result.status === "matched" && result.conversationId) {
        scheduleMatchedChat(result);
      }
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not widen your search.");
    } finally {
      setRelaxRequesting(false);
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
  const requestExtend = () => {
    if (socketRef.current?.readyState !== WebSocket.OPEN || extendRequestedByMe) return;
    socketRef.current.send(JSON.stringify({ type:"extend-request" }));
    setExtendRequestedByMe(true);
  };
  const submitSurvey = async () => {
    if (!survey.understood || !survey.change || !survey.partnerRating) {
      return setToast("Please answer all three questions.");
    }
    try {
      await saveMoodlyData({
        type:"survey", email, checkInId,
        understood:survey.understood, moodChange:survey.change, partnerRating:survey.partnerRating,
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
    navigate("survey");
  };
  const submitReport = async (reason: string) => {
    if (reportSending) return;
    setReportSending(true);
    try {
      await saveMoodlyData({ type:"report", conversationId, reason });
      setReportDone(true);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not submit your report.");
    } finally {
      setReportSending(false);
    }
  };
  const submitBlock = async () => {
    try {
      await saveMoodlyData({ type:"block", conversationId });
      setToast(`${partnerName} has been blocked.`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not block this person.");
    } finally {
      endChat();
    }
  };
  const moodPoint = moodValue;
  const partnerQuadrant = (Object.entries(words) as [Quadrant, string[]][]).find(([, list]) => list.includes(partnerEmotion))?.[0];
  const partnerMoodPoint = partnerQuadrant
    ? { pleasant: partnerQuadrant === "yellow" || partnerQuadrant === "green" ? 1 : 0, energy: partnerQuadrant === "red" || partnerQuadrant === "yellow" ? 1 : 0 }
    : { pleasant: 0.5, energy: 0.5 };
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
    <Landing
      onCheckIn={() => navigate("auth")}
      onSignIn={() => navigate("auth")}
      onHelp={() => openOverlay("resources")}
    />
  );

  if (view === "auth") return <SignIn email={email} setEmail={setEmail} otp={otp} setOtp={setOtp} otpSent={otpSent} sending={authSending} resendSeconds={resendSeconds} toast={toast} onRequestCode={requestCode} onVerifyCode={verifyCode} onReset={() => { setOtpSent(false); setOtp(""); setResendAvailableAt(null); }} onBack={() => navigate("welcome")}/>;
  if (view === "onboarding") return <Onboarding profile={profile} setProfile={setProfile} onDone={() => void saveProfile(() => navigate("home", { replace: true }))} toast={toast} onHelp={() => openOverlay("resources")}/>;

  return (
    <main className={`app-shell ${view === "chat" ? "chat-bg":""}`}>
      {view !== "chat" && <AppHeader email={email} nickname={nickname} onHome={() => navigate("home")} onGuide={() => openOverlay("guide")} onHelp={() => openOverlay("resources")} onSettings={() => openOverlay("settings")}/>}
      {view === "home" && <Home usage={usage} onStart={() => navigate(usage >= 10 ? "paywall" : "mood")} onGuide={() => openOverlay("guide")}/>}
      {CHECKIN_VIEWS.has(view) && (
        <div className="checkin-stage">
        <AnimatePresence custom={checkinDirection}>
          <motion.div
            key={view}
            className="checkin-stage-item"
            custom={checkinDirection}
            variants={reducedMotion ? reducedStepVariants : stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {view === "mood" && (
              <MoodMapStep
                value={moodValue}
                touched={moodTouched}
                onChange={changeMood}
                onQuadrant={pickMoodQuadrant}
                onContinue={continueFromMood}
                onBack={() => navigateCheckin("home", -1)}
              />
            )}
            {view === "emotion" && (
              <WordPickerStep
                words={wordsNear(quadrant, moodValue)}
                mood={moodPoint}
                onChoose={chooseEmotion}
                onNoneFit={() => navigateCheckin("category", 1)}
                onBack={() => navigateCheckin("mood", -1)}
              />
            )}
            {view === "category" && (
              <QuadrantFallbackStep
                onPick={(q) => { setQuadrant(q); navigateCheckin("emotion", 1); }}
                onBack={() => navigateCheckin("emotion", -1)}
              />
            )}
            {view === "context" && (
              <ContextStep
                emotion={emotion}
                mood={moodPoint}
                note={note}
                setNote={setNote}
                noteRef={noteRef}
                onContinue={() => navigateCheckin("mode", 1)}
                onBack={() => navigateCheckin("emotion", -1)}
              />
            )}
            {view === "mode" && (
              <IntentionStep
                mode={mode}
                setMode={setMode}
                usage={usage}
                mood={moodPoint}
                onFindSomeone={() => void startQueue()}
                onBack={() => navigateCheckin("context", -1)}
              />
            )}
          </motion.div>
        </AnimatePresence>
        </div>
      )}
      {view === "queue" && (
        <Waiting
          emotion={emotion}
          mode={mode}
          mood={moodPoint}
          elapsedLabel={fmt(queueSeconds)}
          matchFound={matchFound}
          canRelax={canRelax}
          relaxDismissed={relaxDismissed}
          relaxRequesting={relaxRequesting}
          onRelax={() => void requestRelax()}
          onDismissRelax={() => setRelaxDismissed(true)}
          onCancel={() => void cancelQueue()}
        />
      )}
      {view === "chat" && (
        <Chat
          partnerName={partnerName}
          partnerInitials={partnerInitials}
          partnerMood={partnerMoodPoint}
          partnerEmotion={partnerEmotion}
          partnerNote={partnerNote}
          myEmotion={emotion}
          myNote={note}
          mode={mode}
          onlineCount={onlineCount}
          socketStatus={socketStatus}
          chatSeconds={chatSeconds}
          extendRequestedByMe={extendRequestedByMe}
          extendRequestedByPartner={extendRequestedByPartner}
          onRequestExtend={requestExtend}
          message={message}
          setMessage={setMessage}
          onSend={send}
          messages={messages}
          messageTime={messageTime}
          onEndChat={endChat}
          onSubmitBlock={() => void submitBlock()}
          onHelp={() => openOverlay("resources")}
          report={report}
          reportDone={reportDone}
          reportSending={reportSending}
          onOpenReport={() => setReport(true)}
          onCloseReport={() => { if (!reportSending) { setReport(false); setReportDone(false); } }}
          onSubmitReport={(reason) => void submitReport(reason)}
        />
      )}
      {view === "survey" && (
        <ClosingReflection
          emotion={emotion}
          beforeMood={moodPoint}
          survey={survey}
          setSurvey={setSurvey}
          onSubmit={() => void submitSurvey()}
          onSkip={() => navigate("home")}
        />
      )}
      {view === "paywall" && <Paywall onBack={() => navigate("home")}/>}
      {view === "resources" && <HelpSheet country={profile.country} onBack={goBack}/>}
      {view === "guide" && <Guide onBack={goBack}/>}
      {view === "settings" && <Settings profile={profile} setProfile={setProfile} email={email} nickname={nickname} usage={usage} busy={accountBusy} onBack={goBack} onSave={() => void saveProfile(goBack)} onSignOut={() => void signOut()} onDeleteAccount={() => void deleteAccount()} feedbackSending={feedbackSending} onSendFeedback={(body, afterSend) => void submitFeedback(body, afterSend)}/>}
      {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
    </main>
  );
}

function AppHeader({email,nickname,onHome,onGuide,onHelp,onSettings}:{email:string,nickname:string,onHome:()=>void,onGuide:()=>void,onHelp:()=>void,onSettings:()=>void}){ return <header className="app-header"><button onClick={onHome}><Brand/></button><div className="app-nav"><button onClick={onGuide}>? <b>Guide</b></button><button className="help-now" onClick={onHelp}>♡ Need help now?</button><button className="mini-avatar" onClick={onSettings} title="Account settings">{initialsFor(nickname, email)}</button></div></header>; }
function Onboarding({profile,setProfile,onDone,toast,onHelp}:{profile:Profile,setProfile:(p:Profile)=>void,onDone:()=>void,toast:string,onHelp:()=>void}){ const toggle=(l:string)=>setProfile({...profile,languages:profile.languages.includes(l)?profile.languages.filter((x:string)=>x!==l):[...profile.languages,l]}); return <main className="onboard-shell"><header><Brand/><span>Private setup · About 1 minute</span></header><section className="onboard-card"><span className="overline">YOUR PRIVATE PROFILE</span><h1>Just enough to keep myMoodly safe.</h1><p>This information is never shown to anyone you match with.</p><div className="form-grid"><label>Age <span>18+ only</span><input type="number" min="18" max="100" value={profile.age} onChange={e=>setProfile({...profile,age:e.target.value})} placeholder="Your age"/></label><label>Gender<select value={profile.gender} onChange={e=>setProfile({...profile,gender:e.target.value})}><option value="">Choose an option</option><option>Woman</option><option>Man</option><option>Non-binary</option><option>Prefer not to say</option><option>Self-describe</option></select></label>{profile.gender==="Self-describe"&&<label className="full">How you describe yourself<input value={profile.customGender} onChange={e=>setProfile({...profile,customGender:e.target.value})}/></label>}<label>Country<select value={profile.country} onChange={e=>setProfile({...profile,country:e.target.value})}>{countries.map(c=><option key={c}>{c}</option>)}</select></label><fieldset><legend>Languages you know <span>Optional</span></legend><div className="language-list">{languages.map(l=><button type="button" className={profile.languages.includes(l)?"active":""} onClick={()=>toggle(l)} key={l}>{l}{profile.languages.includes(l)&&" ✓"}</button>)}</div></fieldset></div><label className="check"><input type="checkbox" checked={profile.terms} onChange={e=>setProfile({...profile,terms:e.target.checked})}/><span>I agree to the <Link href="/terms">Terms & Conditions</Link> and acknowledge the <Link href="/privacy">Privacy Policy</Link>. I understand myMoodly is 18+, anonymous but reportable, and not a crisis service.</span></label><button className="primary wide" onClick={onDone}>Complete setup <span>→</span></button></section>{toast&&<div className="toast">{toast}</div>}<button className="help-pill" onClick={onHelp}><IconHelp size={15}/> Need help now?</button></main>; }
function Guide({onBack}:{onBack:()=>void}){ const items=[["01","Name what you feel","Two quick questions guide you to one of 100 precise emotion words."],["02","Choose your intention","Talk with someone who feels similar, or someone in a different headspace."],["03","Meet anonymously","You're matched by mood and shared language — never by country, age, or gender."],["04","Talk for 20 minutes","A quiet timer keeps things contained. Continue only when you both agree."],["05","Stay in control","Report or block at any time. Emergency resources are always one tap away."]]; return <section className="guide-view"><button className="back" onClick={onBack}>←</button><span className="overline">HOW MYMOODLY WORKS</span><h1>A small check-in.<br/>A real human moment.</h1><div className="guide-grid">{items.map(x=><div key={x[0]}><i>{x[0]}</i><b>{x[1]}</b><p>{x[2]}</p></div>)}</div><div className="guide-limit"><b>10 conversations a day are free.</b><span></span></div></section>; }
function Settings({profile,setProfile,email,nickname,usage,busy,onBack,onSave,onSignOut,onDeleteAccount,feedbackSending,onSendFeedback}:{profile:Profile,setProfile:(p:Profile)=>void,email:string,nickname:string,usage:number,busy:boolean,onBack:()=>void,onSave:()=>void,onSignOut:()=>void,onDeleteAccount:()=>void,feedbackSending:boolean,onSendFeedback:(body:string,afterSend:()=>void)=>void}){
  const [confirmDelete,setConfirmDelete]=useState(false);
  const [feedbackText,setFeedbackText]=useState("");
  const toggle=(l:string)=>setProfile({...profile,languages:profile.languages.includes(l)?profile.languages.filter((x:string)=>x!==l):[...profile.languages,l]});
  return <section className="settings-view">
    <button className="back" onClick={onBack}>←</button>
    <span className="overline">ACCOUNT SETTINGS</span>
    <h1>Your private profile</h1>
    <p>These details are never visible to conversation partners.</p>
    <div className="settings-card">
      <span className="avatar large-avatar">{initialsFor(nickname, email)}</span>
      <div><b>Signed in as</b><p>{email}</p><p>Conversation partners see you as <b>{nickname || "…"}</b> · changes every 24 hours</p></div>
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
    <div className="settings-card feedback-card">
      <div>
        <b>Send feedback to the myMoodly team</b>
        <p>Tell us what's missing, what's confusing, or what would make this better for you.</p>
        <div className="note-box"><textarea value={feedbackText} maxLength={1000} onChange={e=>setFeedbackText(e.target.value)} placeholder="What would make myMoodly better for you?"/><span>{feedbackText.length}/1000</span></div>
        <button className="primary" disabled={feedbackSending || !feedbackText.trim()} onClick={()=>onSendFeedback(feedbackText.trim(), ()=>setFeedbackText(""))}>{feedbackSending ? "Sending…" : "Send feedback"}</button>
      </div>
    </div>
    <div className="settings-actions">
      <button className="text-button skip" disabled={busy} onClick={onSignOut}>{busy?"Working…":"Sign out"}</button>
      <button className="text-button skip danger" disabled={busy} onClick={()=>setConfirmDelete(true)}>Delete account &amp; data</button>
    </div>
    {confirmDelete&&<Modal title="Delete your account?" onClose={()=>setConfirmDelete(false)}>
      <p className="modal-copy">This permanently deletes your profile, mood check-ins, and conversation history. This can&apos;t be undone. Any feedback you&apos;ve sent us or reports tied to your account are kept as safety records, as described in our <Link href="/privacy">Privacy Policy</Link>.</p>
      <button className="primary wide danger-solid" disabled={busy} onClick={()=>{setConfirmDelete(false);onDeleteAccount();}}>{busy?"Deleting…":"Yes, delete everything"}</button>
      <button className="text-button skip" disabled={busy} onClick={()=>setConfirmDelete(false)}>Cancel</button>
    </Modal>}
  </section>;
}
