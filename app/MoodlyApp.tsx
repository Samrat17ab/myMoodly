"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { SanctuaryProvider } from "@/app/components/moodly/sanctuary/SanctuaryProvider";
import { HelpSheet } from "@/app/components/moodly/HelpSheet";
import { LandingHero } from "@/app/components/moodly/landing/LandingHero";
import { HowItWorks } from "@/app/components/moodly/landing/HowItWorks";
import { TryMoodMap } from "@/app/components/moodly/landing/TryMoodMap";
import { PrivacySection } from "@/app/components/moodly/landing/PrivacySection";
import { SiteFooter } from "@/app/components/moodly/landing/SiteFooter";
import { SignInPanel } from "@/app/components/moodly/auth/SignInPanel";
import { HomeHero } from "@/app/components/moodly/home/HomeHero";
import { CheckInFlow } from "@/app/components/moodly/checkin/CheckInFlow";
import type { CheckInPayload } from "@/app/components/moodly/checkin/types";
import { WaitingRoom } from "@/app/components/moodly/waiting/WaitingRoom";
import { ChatShell } from "@/app/components/moodly/chat/ChatShell";
import { ReportSheet } from "@/app/components/moodly/chat/ReportSheet";
import { ClosingReflection } from "@/app/components/moodly/reflection/ClosingReflection";
import { Onboarding } from "@/app/components/moodly/pages/Onboarding";
import { Guide } from "@/app/components/moodly/pages/Guide";
import { Settings } from "@/app/components/moodly/pages/Settings";
import { HelpPage } from "@/app/components/moodly/pages/HelpPage";
import { LimitReached } from "@/app/components/moodly/pages/LimitReached";
import type { HeaderNav } from "@/app/components/moodly/pages/PageShell";
import { MOOD_HEX, TO_BACKEND_QUADRANT, describeMood, moodColor } from "@/app/components/moodly/lib/mood";
import { quadrantOfWord } from "@/app/components/moodly/lib/words";
import { EMAIL_SIGNIN_ENABLED } from "@/app/lib/config";
import { emptyProfile, initialsFor, type Profile } from "@/app/lib/profile";
import { PATH_VIEW, VIEW_PATH, type View } from "@/app/lib/routes";

const DAILY_LIMIT = 10;
const CHAT_TOTAL_SECONDS = 1200;
const SURVEY_QUESTIONS: { key: "understood" | "change" | "partnerRating"; label: string; options: string[] }[] = [
  { key: "understood", label: "Did you feel understood in this conversation?", options: ["Yes", "Somewhat", "No"] },
  { key: "change", label: "How do you feel compared to before?", options: ["Better", "Same", "Worse"] },
  { key: "partnerRating", label: "How was this match?", options: ["Great", "Okay", "Not for me"] },
];

type ChatMessage = {
  id: string;
  mine: boolean;
  text: string;
  time: string;
  flagged?: boolean;
};
type RealtimePacket = {
  type?: "ready" | "message" | "presence" | "ended" | "error" | "extended" | "extend-requested";
  history?: ChatMessage[];
  message?: ChatMessage | string;
  online?: number;
  expiresAt?: number;
  mine?: boolean;
};
// Views it's safe to land on directly from a URL (no in-memory wizard state required).
const AUTHENTICATED_LANDING_VIEWS = new Set<View>(["home", "guide", "resources", "settings", "paywall"]);
const PRE_AUTH_LANDING_VIEWS = new Set<View>(["auth", "guide", "resources"]);

// fetch() rejects with a bare TypeError ("Failed to fetch") when the network
// drops; show something a person can act on instead.
async function apiFetch(input: string, init?: RequestInit) {
  try {
    return await fetch(input, init);
  } catch {
    throw new Error(
      typeof navigator !== "undefined" && !navigator.onLine
        ? "You seem to be offline. Check your connection and try again."
        : "Couldn't reach myMoodly. Check your connection and try again.",
    );
  }
}

async function readApiResponse(response: Response) {
  // A gateway error or timeout can come back as an HTML page, not JSON.
  const data = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    if (typeof data.error === "string" && data.error) throw new Error(data.error);
    if (response.status === 401) throw new Error("Your session has ended. Please sign in again.");
    if (response.status === 429) throw new Error("That's a lot at once. Please wait a moment and try again.");
    if (response.status >= 500) throw new Error("myMoodly is having trouble right now. Please try again in a moment.");
    throw new Error("Something didn't work. Please try again.");
  }
  return data;
}

async function saveMoodlyData(payload: Record<string, unknown>) {
  return readApiResponse(await apiFetch("/api/moodly", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  }));
}

async function matchRequest(payload: Record<string, unknown>) {
  return readApiResponse(await apiFetch("/api/match", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  }));
}

export default function MoodlyApp() {
  return (
    <SanctuaryProvider>
      <MoodlyScreens />
    </SanctuaryProvider>
  );
}

function MoodlyScreens() {
  const [view, setView] = useState<View>("welcome");
  // The last check-in sent; restored into the flow if a search is cancelled.
  const [checkIn, setCheckIn] = useState<CheckInPayload | null>(null);
  const [startingQueue, setStartingQueue] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
  const [chatSeconds, setChatSeconds] = useState(CHAT_TOTAL_SECONDS);
  const [chatExpiresAt, setChatExpiresAt] = useState<number | null>(null);
  const [extendRequestedByMe, setExtendRequestedByMe] = useState(false);
  const [extendRequestedByPartner, setExtendRequestedByPartner] = useState(false);
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
  const socketRef = useRef<WebSocket | null>(null);
  const matchTransitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatStartsAtRef = useRef(0);
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

  const enterChat = useCallback(() => {
    if (matchTransitionRef.current) clearTimeout(matchTransitionRef.current);
    matchTransitionRef.current = null;
    setUsage(value => value + 1);
    setChatSeconds(CHAT_TOTAL_SECONDS);
    setChatExpiresAt(null);
    setExtendRequestedByMe(false);
    setExtendRequestedByPartner(false);
    setReport(false);
    setReportDone(false);
    setMessages([]);
    navigate("chat");
  }, [navigate]);

  const scheduleMatchedChat = useCallback((data: Record<string, unknown>) => {
    if (!data.conversationId) return;
    setMatchFound(true);
    setConversationId(String(data.conversationId));
    setPartnerName(String(data.partnerName ?? "Anonymous partner"));
    setPartnerEmotion(String(data.partnerEmotion ?? ""));
    setPartnerNote(String(data.partnerNote ?? ""));
    const startsAt = Date.parse(String(data.chatStartsAt ?? ""));
    chatStartsAtRef.current = Number.isNaN(startsAt) ? 0 : startsAt;
    const delay = Math.max(0, chatStartsAtRef.current - Date.now());
    if (matchTransitionRef.current) clearTimeout(matchTransitionRef.current);
    matchTransitionRef.current = setTimeout(enterChat, delay);
  }, [enterChat]);

  // "Open the conversation" on the found screen: go in now if the shared
  // start time has passed, otherwise the scheduled transition takes over.
  const openMatchedChat = () => {
    if (Date.now() >= chatStartsAtRef.current) enterChat();
  };

  useEffect(() => {
    if (!toast) return;
    // Longer notices (e.g. a message that wasn't sent) stay up long enough to read.
    const id = setTimeout(() => setToast(""), Math.min(9000, Math.max(2600, toast.length * 55)));
    return () => clearTimeout(id);
  }, [toast]);
  const completeSignIn = useCallback(async () => {
    try {
      const sessionResponse = await apiFetch("/api/auth/session", {
        cache: "no-store",
      });
      if (!sessionResponse.ok) return false;
      const session = await sessionResponse.json() as { email?: string };
      const authenticatedEmail = session.email?.trim().toLowerCase() ?? "";
      if (!authenticatedEmail) return false;
      const data = await readApiResponse(await apiFetch("/api/moodly", {
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
          navigate("checkin");
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
  const requestCode = async () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || authSending || resendSeconds > 0) return;
    setAuthSending(true);
    try {
      const data = await readApiResponse(await apiFetch("/api/auth/request-code", {
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
      await readApiResponse(await apiFetch("/api/auth/verify-otp", {
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
      await apiFetch("/api/auth/session", { method: "DELETE" });
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
      await readApiResponse(await apiFetch("/api/moodly", { method: "DELETE" }));
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
  const startQueue = async (payload: CheckInPayload) => {
    if (startingQueue) return;
    setCheckIn(payload);
    setStartingQueue(true);
    const quadrant = TO_BACKEND_QUADRANT[payload.quadrant];
    const mode = payload.intent;
    try {
      const data = await saveMoodlyData({
        type:"check-in", email,
        energy:payload.energy, pleasant:payload.pleasantness === "pleasant", quadrant,
        emotion:payload.word, note:payload.note,
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
    } finally {
      setStartingQueue(false);
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
      navigate("checkin");
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
  const send = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setToast("Reconnecting to the conversation. Please try again.");
      return;
    }
    socketRef.current.send(JSON.stringify({ type:"message", text:clean }));
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
      setSurvey({ understood:"", change:"", partnerRating:"" });
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
  const remaining = Math.max(0, DAILY_LIMIT - usage);
  const initials = initialsFor(nickname, email);
  const nav: HeaderNav = {
    initials,
    onHome: () => navigate("home"),
    onGuide: () => openOverlay("guide"),
    onAccount: () => openOverlay("settings"),
  };
  const point = checkIn?.point ?? { x: 0.5, y: 0.5 };
  const myColor = moodColor(point);
  const partnerQuadrant = quadrantOfWord(partnerEmotion);
  const partnerColor = partnerQuadrant ? MOOD_HEX[partnerQuadrant] : "#A9C9B4";
  const partnerInitials = partnerName.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();

  let screen: ReactNode = null;

  if (view === "welcome") {
    screen = (
      <main>
        <LandingHero onSignIn={() => navigate("auth")} />
        <HowItWorks />
        <TryMoodMap onSignIn={() => navigate("auth")} />
        <PrivacySection />
        <SiteFooter onGuide={() => openOverlay("guide")} />
      </main>
    );
  } else if (view === "auth") {
    const showOtpEntry = EMAIL_SIGNIN_ENABLED && otpSent;
    screen = (
      <SignInPanel
        onGoogle={() => {
          setGoogleLoading(true);
          window.location.assign("/api/auth/google/start");
        }}
        onBack={() => navigate("welcome")}
        loading={googleLoading}
      >
        {EMAIL_SIGNIN_ENABLED && (showOtpEntry ? (
          <div className="mm-auth__form">
            <p className="mm-body">We sent a 6-digit code to {email}. Enter it below to continue.</p>
            <label className="mm-field">
              Verification code
              <input
                className="mm-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && void verifyCode()}
              />
            </label>
            <button type="button" className="mm-btn mm-btn--primary mm-btn--block" disabled={otp.length !== 6 || authSending} onClick={() => void verifyCode()}>
              {authSending ? "Verifying…" : "Verify and continue"}
            </button>
            <button type="button" className="mm-link mm-link--muted" disabled={authSending || resendSeconds > 0} onClick={() => void requestCode()}>
              {authSending ? "Sending…" : resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : "Resend code"}
            </button>
            <button type="button" className="mm-link mm-link--muted" onClick={() => { setOtpSent(false); setOtp(""); setResendAvailableAt(null); }}>
              Use a different email
            </button>
          </div>
        ) : (
          <div className="mm-auth__form">
            <label className="mm-field">
              Email address
              <input
                className="mm-input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                onKeyDown={(e) => e.key === "Enter" && void requestCode()}
              />
            </label>
            <button type="button" className="mm-btn mm-btn--glass mm-btn--block" disabled={!email.includes("@") || authSending} onClick={() => void requestCode()}>
              {authSending ? "Sending code…" : "Email me a sign-in code"}
            </button>
          </div>
        ))}
      </SignInPanel>
    );
  } else if (view === "onboarding") {
    screen = <Onboarding profile={profile} setProfile={setProfile} onDone={() => void saveProfile(() => navigate("home", { replace: true }))} />;
  } else if (view === "home") {
    screen = (
      <HomeHero
        initials={initials}
        remaining={remaining}
        limit={DAILY_LIMIT}
        onCheckIn={() => navigate(usage >= DAILY_LIMIT ? "paywall" : "checkin")}
        onHome={nav.onHome}
        onGuide={nav.onGuide}
        onAccount={nav.onAccount}
      />
    );
  } else if (view === "checkin") {
    screen = (
      <CheckInFlow
        remaining={remaining}
        submitting={startingQueue}
        initial={checkIn ? { point: checkIn.point, word: checkIn.word, note: checkIn.note, intent: checkIn.intent } : null}
        onSubmit={(payload) => void startQueue(payload)}
        onExit={() => navigate("home")}
      />
    );
  } else if (view === "queue") {
    screen = (
      <WaitingRoom
        status={matchFound ? "found" : "searching"}
        color={myColor}
        word={checkIn?.word ?? null}
        moodLabel={describeMood(point).label}
        intent={checkIn?.intent ?? "similar"}
        elapsedSeconds={queueSeconds}
        partnerName={partnerName}
        partnerWord={partnerEmotion || undefined}
        partnerColor={partnerColor}
        canRelax={canRelax && !relaxDismissed}
        relaxRequesting={relaxRequesting}
        onRelax={() => void requestRelax()}
        onCancel={() => void cancelQueue()}
        onOpen={openMatchedChat}
      />
    );
  } else if (view === "chat") {
    const extendNotice = (
      <div className="mm-chat__extend" role="status">
        {extendRequestedByMe && extendRequestedByPartner ? (
          <span>Extending your conversation…</span>
        ) : extendRequestedByMe ? (
          <span>Waiting for {partnerName} to agree to keep chatting…</span>
        ) : (
          <>
            <span>{extendRequestedByPartner ? `${partnerName} wants to keep chatting.` : "A couple of minutes left. Keep chatting?"}</span>
            <button type="button" className="mm-btn mm-btn--glass mm-btn--sm" onClick={requestExtend}>Yes, continue</button>
          </>
        )}
      </div>
    );
    screen = (
      <>
        <ChatShell
          me={{ name: nickname || "You", initials, color: myColor, word: checkIn?.word, note: checkIn?.note }}
          partner={{ name: partnerName, initials: partnerInitials, color: partnerColor, word: partnerEmotion, note: partnerNote }}
          messages={messages.map((m) => ({ id: m.id, fromMe: m.mine, text: m.text, sentAt: m.time, flagged: m.flagged }))}
          partnerPresent={socketStatus === "live" && onlineCount >= 2}
          presenceLabel={socketStatus !== "live" ? "Reconnecting securely…" : onlineCount < 2 ? "Stepped away for a moment" : undefined}
          secondsLeft={chatSeconds}
          totalSeconds={CHAT_TOTAL_SECONDS}
          onSend={send}
          onEnd={endChat}
          onReport={() => setReport(true)}
          onBlock={() => void submitBlock()}
          endingNotice={extendNotice}
        />
        <AnimatePresence>
          {report && (
            <ReportSheet
              done={reportDone}
              sending={reportSending}
              onSubmit={(reason) => void submitReport(reason)}
              onClose={() => { if (!reportSending) { setReport(false); setReportDone(false); } }}
              onContinue={endChat}
            />
          )}
        </AnimatePresence>
      </>
    );
  } else if (view === "survey") {
    screen = (
      <ClosingReflection
        partnerName={partnerName}
        before={point}
        onDone={() => void submitSurvey()}
        onSkip={() => navigate("home")}
      >
        <div className="mm-reflect__questions">
          {SURVEY_QUESTIONS.map((q) => (
            <div key={q.key} className="mm-reflect__q" role="radiogroup" aria-label={q.label}>
              <span className="mm-reflect__q-label">{q.label}</span>
              <div className="mm-reflect__q-row">
                {q.options.map((o) => {
                  const on = survey[q.key] === o;
                  return (
                    <button key={o} type="button" role="radio" aria-checked={on} className={`mm-choicepill${on ? " is-on" : ""}`} onClick={() => setSurvey({ ...survey, [q.key]: o })}>
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ClosingReflection>
    );
  } else if (view === "paywall") {
    screen = <LimitReached nav={nav} limit={DAILY_LIMIT} onBack={() => navigate("home")} />;
  } else if (view === "resources") {
    screen = <HelpPage nav={email ? nav : null} country={profile.country} onBack={goBack} onLogo={() => navigate("welcome")} />;
  } else if (view === "guide") {
    screen = <Guide nav={email ? nav : null} onBack={goBack} onLogo={() => navigate("welcome")} />;
  } else if (view === "settings") {
    screen = (
      <Settings
        nav={nav}
        profile={profile}
        setProfile={setProfile}
        email={email}
        nickname={nickname}
        usage={usage}
        limit={DAILY_LIMIT}
        busy={accountBusy}
        onBack={goBack}
        onSave={() => void saveProfile(goBack)}
        onSignOut={() => void signOut()}
        onDeleteAccount={() => void deleteAccount()}
        feedbackSending={feedbackSending}
        onSendFeedback={(body, afterSend) => void submitFeedback(body, afterSend)}
      />
    );
  }

  return (
    <>
      {screen}
      <HelpSheet country={profile.country} />
      {toast && <div className="mm-toast" role="status" aria-live="polite">{toast}</div>}
    </>
  );
}
