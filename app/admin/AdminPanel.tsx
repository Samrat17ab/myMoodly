"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Overview = {
  totalUsers: number;
  newToday: number;
  newThisWeek: number;
  checkInsToday: number;
  matchesToday: number;
  matchesThisWeek: number;
  activeConversationsNow: number;
  totalReports: number;
  totalBans: number;
  totalBlocks: number;
  totalFeedback: number;
  totalDeletedAccounts: number;
  avgSessionSeconds: number | null;
  ratingBreakdown: Record<string, number>;
  understoodBreakdown: Record<string, number>;
  moodChangeBreakdown: Record<string, number>;
  usersAtFreeCapToday: number;
};
type ReportRow = {
  reported_email: string;
  distinct_reporters: number;
  total_reports: number;
  last_report_at: string;
  last_reason: string;
  banned_at: number | null;
};
type BanRow = { email: string; report_count: number; banned_at: number };
type BlockRow = { blocker_email: string; blocked_email: string; created_at: string };
type FeedbackRow = { id: string; user_email: string; body: string; created_at: string };
type DeletedRow = { id: string; email: string; age: number | null; gender: string | null; country: string | null; deleted_at: string };

const TABS = ["Overview", "Reports", "Bans", "Blocks", "Feedback", "Deleted accounts"] as const;
type Tab = typeof TABS[number];

async function adminFetch(view: string) {
  const res = await fetch(`/api/admin?view=${view}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(res.status === 403 ? "denied" : (body.error ?? "Request failed"));
  }
  return res.json();
}

function formatDate(value: string | number) {
  const date = typeof value === "number"
    ? new Date(value * 1000)
    : new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function formatSeconds(seconds: number | null) {
  if (seconds === null || Number.isNaN(seconds)) return "—";
  const m = Math.round(seconds / 60);
  return `${m} min`;
}

export default function AdminPanel() {
  const [status, setStatus] = useState<"loading" | "denied" | "ready">("loading");
  const [tab, setTab] = useState<Tab>("Overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [reports, setReports] = useState<ReportRow[] | null>(null);
  const [bans, setBans] = useState<BanRow[] | null>(null);
  const [blocks, setBlocks] = useState<BlockRow[] | null>(null);
  const [feedback, setFeedback] = useState<FeedbackRow[] | null>(null);
  const [deleted, setDeleted] = useState<DeletedRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch("overview")
      .then((data) => { setOverview(data); setStatus("ready"); })
      .catch((err) => setStatus(err.message === "denied" ? "denied" : "denied"));
  }, []);

  const loadTab = useCallback(async (next: Tab) => {
    setTab(next);
    setError("");
    try {
      if (next === "Overview" && !overview) setOverview(await adminFetch("overview"));
      if (next === "Reports" && !reports) setReports((await adminFetch("reports")).reports);
      if (next === "Bans" && !bans) setBans((await adminFetch("bans")).bans);
      if (next === "Blocks" && !blocks) setBlocks((await adminFetch("blocks")).blocks);
      if (next === "Feedback" && !feedback) setFeedback((await adminFetch("feedback")).feedback);
      if (next === "Deleted accounts" && !deleted) setDeleted((await adminFetch("deleted")).deleted);
    } catch {
      setError("Could not load this data. Try again.");
    }
  }, [overview, reports, bans, blocks, feedback, deleted]);

  const unban = async (email: string) => {
    setBusy(true);
    try {
      await fetch("/api/admin", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "unban", email }),
      });
      setBans((prev) => prev?.filter((b) => b.email !== email) ?? null);
      setReports((prev) => prev?.map((r) => r.reported_email === email ? { ...r, banned_at: null } : r) ?? null);
    } finally {
      setBusy(false);
    }
  };

  const unblock = async (blocker: string, blocked: string) => {
    setBusy(true);
    try {
      await fetch("/api/admin", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "unblock", blocker, blocked }),
      });
      setBlocks((prev) => prev?.filter((b) => !(b.blocker_email === blocker && b.blocked_email === blocked)) ?? null);
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading") {
    return <main className="admin-shell"><p className="admin-loading">Checking access…</p></main>;
  }

  if (status === "denied") {
    return (
      <main className="admin-shell">
        <div className="admin-denied">
          <h1>Access denied</h1>
          <p>This page is restricted. Sign in at <Link href="/">mymoodly.space</Link> with an authorized account first.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <h1>myMoodly admin</h1>
        <Link href="/" className="admin-back">← Back to app</Link>
      </header>

      <nav className="admin-tabs">
        {TABS.map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => void loadTab(t)}>{t}</button>
        ))}
      </nav>

      {error && <p className="admin-error">{error}</p>}

      {tab === "Overview" && overview && (
        <section className="admin-grid">
          <StatCard label="Total users" value={overview.totalUsers} />
          <StatCard label="New today" value={overview.newToday} />
          <StatCard label="New this week" value={overview.newThisWeek} />
          <StatCard label="Check-ins today" value={overview.checkInsToday} />
          <StatCard label="Matches today" value={overview.matchesToday} />
          <StatCard label="Matches this week" value={overview.matchesThisWeek} />
          <StatCard label="Active chats right now" value={overview.activeConversationsNow} />
          <StatCard label="Avg. chat length" value={formatSeconds(overview.avgSessionSeconds)} />
          <StatCard label="Hit free daily cap today" value={overview.usersAtFreeCapToday} />
          <StatCard label="Total reports filed" value={overview.totalReports} />
          <StatCard label="Accounts banned" value={overview.totalBans} />
          <StatCard label="Active blocks" value={overview.totalBlocks} />
          <StatCard label="Feedback received" value={overview.totalFeedback} />
          <StatCard label="Accounts deleted (all-time)" value={overview.totalDeletedAccounts} />
          <RatingCard label="Felt understood in the conversation" breakdown={overview.understoodBreakdown} options={["Yes", "Somewhat", "No"]} />
          <RatingCard label="How they felt compared to before" breakdown={overview.moodChangeBreakdown} options={["Better", "Same", "Worse"]} />
          <RatingCard label="Match quality" breakdown={overview.ratingBreakdown} options={["Great", "Okay", "Not for me"]} />
        </section>
      )}

      {tab === "Reports" && reports && (
        <section className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Reported user</th><th>Times reported</th><th>Total reports</th><th>Last reason</th><th>Last reported</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {reports.length === 0 && <tr><td colSpan={7} className="admin-empty">No reports yet.</td></tr>}
              {reports.map((r) => (
                <tr key={r.reported_email}>
                  <td>{r.reported_email}</td>
                  <td>{r.distinct_reporters}</td>
                  <td>{r.total_reports}</td>
                  <td>{r.last_reason}</td>
                  <td>{formatDate(r.last_report_at)}</td>
                  <td>{r.banned_at ? "Banned" : "Active"}</td>
                  <td>{r.banned_at && <button disabled={busy} onClick={() => void unban(r.reported_email)}>Unban</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === "Bans" && bans && (
        <section className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Email</th><th>Reports at ban time</th><th>Banned at</th><th></th></tr></thead>
            <tbody>
              {bans.length === 0 && <tr><td colSpan={4} className="admin-empty">No banned accounts.</td></tr>}
              {bans.map((b) => (
                <tr key={b.email}>
                  <td>{b.email}</td>
                  <td>{b.report_count}</td>
                  <td>{formatDate(b.banned_at)}</td>
                  <td><button disabled={busy} onClick={() => void unban(b.email)}>Unban</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === "Blocks" && blocks && (
        <section className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Blocker</th><th>Blocked</th><th>Since</th><th></th></tr></thead>
            <tbody>
              {blocks.length === 0 && <tr><td colSpan={4} className="admin-empty">No blocks recorded.</td></tr>}
              {blocks.map((b) => (
                <tr key={`${b.blocker_email}-${b.blocked_email}`}>
                  <td>{b.blocker_email}</td>
                  <td>{b.blocked_email}</td>
                  <td>{formatDate(b.created_at)}</td>
                  <td><button disabled={busy} onClick={() => void unblock(b.blocker_email, b.blocked_email)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === "Feedback" && feedback && (
        <section className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>From</th><th>Feedback</th><th>Sent</th></tr></thead>
            <tbody>
              {feedback.length === 0 && <tr><td colSpan={3} className="admin-empty">No feedback yet.</td></tr>}
              {feedback.map((f) => (
                <tr key={f.id}><td>{f.user_email}</td><td className="admin-body-cell">{f.body}</td><td>{formatDate(f.created_at)}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === "Deleted accounts" && deleted && (
        <section className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Email</th><th>Age</th><th>Gender</th><th>Country</th><th>Deleted at</th></tr></thead>
            <tbody>
              {deleted.length === 0 && <tr><td colSpan={5} className="admin-empty">No deletions logged.</td></tr>}
              {deleted.map((d) => (
                <tr key={d.id}><td>{d.email}</td><td>{d.age ?? "—"}</td><td>{d.gender ?? "—"}</td><td>{d.country ?? "—"}</td><td>{formatDate(d.deleted_at)}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return <div className="admin-card"><span>{label}</span><b>{value}</b></div>;
}

function RatingCard({ label, breakdown, options }: { label: string; breakdown: Record<string, number>; options: readonly string[] }) {
  const total = options.reduce((sum, key) => sum + (breakdown[key] ?? 0), 0);
  return (
    <div className="admin-card admin-ratings">
      <span>{label}</span>
      <div className="admin-rating-bars">
        {options.map((key) => {
          const count = breakdown[key] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={key} className="admin-rating-row">
              <small>{key}</small>
              <div className="admin-bar-track"><div className="admin-bar-fill" style={{ width: `${pct}%` }} /></div>
              <b>{count}</b>
            </div>
          );
        })}
      </div>
    </div>
  );
}
