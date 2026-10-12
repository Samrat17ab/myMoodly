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
  returnedUsers: number;
  totalUsersWithCheckIn: number;
  alertsLast24h: number;
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
type MoodPairRow = {
  mood_quadrant: string; matched_mood_quadrant: string; n: number;
  better: number; same: number; worse: number; understood_yes: number; rating_great: number;
};
type ModeRow = { match_mode: string; n: number; better: number; same: number; worse: number };
type RetentionRow = { mood_change: string; n: number; returned: number };
type RelaxedRow = { matched_relaxed: number; n: number; better: number; same: number; worse: number };
type MoodPairsData = { pairs: MoodPairRow[]; byMode: ModeRow[]; retentionByFirstOutcome: RetentionRow[]; byRelaxed: RelaxedRow[] };
type AlertRow = { id: string; type: string; message: string; created_at: string };
type BlogTotals = { views_all: number; views_7d: number; views_today: number; readers_today: number; readers_7d: number; reads_7d: number; cta_7d: number };
type BlogPostRow = { slug: string; title: string; views: number; readers: number; reads: number; cta: number; last_seen: string };
type BlogSourceRow = { source: string; views: number; readers: number; cta: number };
type BlogDayRow = { day: string; views: number; readers: number; reads: number; cta: number };
type BlogData = { totals: BlogTotals; posts: BlogPostRow[]; sources: BlogSourceRow[]; daily: BlogDayRow[] };

const TABS = ["Overview", "Blog", "Alerts", "Mood patterns", "Reports", "Bans", "Blocks", "Feedback", "Deleted accounts"] as const;
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

function pct(count: number, total: number) {
  return total > 0 ? `${Math.round((count / total) * 100)}% (${count})` : "—";
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
  const [moodPairs, setMoodPairs] = useState<MoodPairsData | null>(null);
  const [alerts, setAlerts] = useState<AlertRow[] | null>(null);
  const [blog, setBlog] = useState<BlogData | null>(null);
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
      if (next === "Blog" && !blog) setBlog(await adminFetch("blog"));
      if (next === "Alerts" && !alerts) setAlerts((await adminFetch("alerts")).alerts);
      if (next === "Mood patterns" && !moodPairs) setMoodPairs(await adminFetch("moodPairs"));
      if (next === "Reports" && !reports) setReports((await adminFetch("reports")).reports);
      if (next === "Bans" && !bans) setBans((await adminFetch("bans")).bans);
      if (next === "Blocks" && !blocks) setBlocks((await adminFetch("blocks")).blocks);
      if (next === "Feedback" && !feedback) setFeedback((await adminFetch("feedback")).feedback);
      if (next === "Deleted accounts" && !deleted) setDeleted((await adminFetch("deleted")).deleted);
    } catch {
      setError("Could not load this data. Try again.");
    }
  }, [overview, blog, alerts, moodPairs, reports, bans, blocks, feedback, deleted]);

  const unban = async (email: string) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "unban", email }),
      });
      if (!res.ok) { setError(`Could not unban ${email}. Try again.`); return; }
      setBans((prev) => prev?.filter((b) => b.email !== email) ?? null);
      setReports((prev) => prev?.map((r) => r.reported_email === email ? { ...r, banned_at: null } : r) ?? null);
    } catch {
      setError(`Could not unban ${email}. Try again.`);
    } finally {
      setBusy(false);
    }
  };

  const unblock = async (blocker: string, blocked: string) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "unblock", blocker, blocked }),
      });
      if (!res.ok) { setError("Could not remove that block. Try again."); return; }
      setBlocks((prev) => prev?.filter((b) => !(b.blocker_email === blocker && b.blocked_email === blocked)) ?? null);
    } catch {
      setError("Could not remove that block. Try again.");
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
          <StatCard label="Alerts (last 24h)" value={overview.alertsLast24h} />
          <StatCard label="Returned (next day or later)" value={pct(overview.returnedUsers, overview.totalUsersWithCheckIn)} />
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

      {tab === "Blog" && blog && (
        <section className="admin-mood-section">
          <p className="admin-mood-note">Anonymous and cookie-free: no IP addresses or accounts are stored, and bots and link-preview crawlers are left out. A &quot;reader&quot; is one person on one day (the anonymous visitor code changes daily), so the same person reading on two days counts twice. &quot;Finished&quot; means they scrolled 75% of the article. Sources come from the link they clicked; add <code>?utm_source=linkedin</code> (or reddit, x) to links you share so in-app browsers that hide the referrer still show up correctly.</p>
          <div className="admin-grid">
            <StatCard label="Views today" value={blog.totals.views_today ?? 0} />
            <StatCard label="Readers today" value={blog.totals.readers_today ?? 0} />
            <StatCard label="Views (last 7 days)" value={blog.totals.views_7d ?? 0} />
            <StatCard label="Readers (last 7 days)" value={blog.totals.readers_7d ?? 0} />
            <StatCard label="Finished an article (7 days)" value={blog.totals.reads_7d ?? 0} />
            <StatCard label="Clicked Check in from the blog (7 days)" value={blog.totals.cta_7d ?? 0} />
            <StatCard label="Views (all time)" value={blog.totals.views_all ?? 0} />
          </div>

          <h3 className="admin-subhead">By post</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Post</th><th>Views</th><th>Readers</th><th>Finished</th><th>Clicked Check in</th><th>Last visit</th></tr></thead>
              <tbody>
                {blog.posts.length === 0 && <tr><td colSpan={6} className="admin-empty">No blog visits recorded yet.</td></tr>}
                {blog.posts.map((p) => (
                  <tr key={p.slug}>
                    <td className="admin-body-cell">{p.slug === "index" ? <b>{p.title}</b> : <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer">{p.title}</a>}</td>
                    <td>{p.views}</td>
                    <td>{p.readers}</td>
                    <td>{p.slug === "index" ? "—" : pct(p.reads, p.readers)}</td>
                    <td>{pct(p.cta, p.readers)}</td>
                    <td>{p.last_seen ? formatDate(p.last_seen) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="admin-subhead">Where readers came from (last 30 days)</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Source</th><th>Views</th><th>Readers</th><th>Clicked Check in</th></tr></thead>
              <tbody>
                {blog.sources.length === 0 && <tr><td colSpan={4} className="admin-empty">No visits in the last 30 days.</td></tr>}
                {blog.sources.map((r) => (
                  <tr key={r.source}><td className="admin-cap">{r.source}</td><td>{r.views}</td><td>{r.readers}</td><td>{r.cta}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="admin-subhead">Last 14 days</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Day (UTC)</th><th>Views</th><th>Readers</th><th>Finished</th><th>Clicked Check in</th></tr></thead>
              <tbody>
                {blog.daily.length === 0 && <tr><td colSpan={5} className="admin-empty">No visits in the last 14 days.</td></tr>}
                {blog.daily.map((d) => (
                  <tr key={d.day}><td>{d.day}</td><td>{d.views}</td><td>{d.readers}</td><td>{d.reads}</td><td>{d.cta}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "Alerts" && alerts && (
        <section className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Type</th><th>Message</th><th>When</th></tr></thead>
            <tbody>
              {alerts.length === 0 && <tr><td colSpan={3} className="admin-empty">No alerts yet.</td></tr>}
              {alerts.map((a) => (
                <tr key={a.id}>
                  <td><span className={`admin-alert-badge admin-alert-${a.type}`}>{a.type.replace("_", " ")}</span></td>
                  <td className="admin-body-cell">{a.message}</td>
                  <td>{formatDate(a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === "Mood patterns" && moodPairs && (
        <section className="admin-mood-section">
          <p className="admin-mood-note">Each row is one combination of your mood at check-in and the mood you were matched with, with what people reported afterward. Quadrants: yellow = high energy + pleasant, red = high energy + unpleasant, green = low energy + pleasant, blue = low energy + unpleasant. Rows with a small N aren&apos;t reliable yet — early signal, not a conclusion.</p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Your mood</th><th>Matched mood</th><th>N</th><th>Better</th><th>Same</th><th>Worse</th><th>Felt understood</th><th>Rated &quot;Great&quot;</th></tr></thead>
              <tbody>
                {moodPairs.pairs.length === 0 && <tr><td colSpan={8} className="admin-empty">Not enough survey responses yet.</td></tr>}
                {moodPairs.pairs.map((p) => (
                  <tr key={`${p.mood_quadrant}-${p.matched_mood_quadrant}`}>
                    <td className="admin-cap">{p.mood_quadrant}</td>
                    <td className="admin-cap">{p.matched_mood_quadrant}</td>
                    <td>{p.n}</td>
                    <td>{pct(p.better, p.n)}</td>
                    <td>{pct(p.same, p.n)}</td>
                    <td>{pct(p.worse, p.n)}</td>
                    <td>{pct(p.understood_yes, p.n)}</td>
                    <td>{pct(p.rating_great, p.n)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="admin-subhead">By match preference (chose &quot;similar&quot; vs. &quot;different&quot; mood)</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Preference</th><th>N</th><th>Better</th><th>Same</th><th>Worse</th></tr></thead>
              <tbody>
                {moodPairs.byMode.length === 0 && <tr><td colSpan={5} className="admin-empty">Not enough data yet.</td></tr>}
                {moodPairs.byMode.map((m) => (
                  <tr key={m.match_mode}>
                    <td className="admin-cap">{m.match_mode}</td>
                    <td>{m.n}</td>
                    <td>{pct(m.better, m.n)}</td>
                    <td>{pct(m.same, m.n)}</td>
                    <td>{pct(m.worse, m.n)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="admin-subhead">Do people come back? (by how their first conversation went)</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>First conversation felt...</th><th>N</th><th>Returned next day or later</th></tr></thead>
              <tbody>
                {moodPairs.retentionByFirstOutcome.length === 0 && <tr><td colSpan={3} className="admin-empty">Not enough data yet.</td></tr>}
                {moodPairs.retentionByFirstOutcome.map((r) => (
                  <tr key={r.mood_change}>
                    <td className="admin-cap">{r.mood_change}</td>
                    <td>{r.n}</td>
                    <td>{pct(r.returned, r.n)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="admin-subhead">Preferred pairing vs. settled for a relaxed match</h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Match type</th><th>N</th><th>Better</th><th>Same</th><th>Worse</th></tr></thead>
              <tbody>
                {moodPairs.byRelaxed.length === 0 && <tr><td colSpan={5} className="admin-empty">Not enough data yet.</td></tr>}
                {moodPairs.byRelaxed.map((r) => (
                  <tr key={r.matched_relaxed}>
                    <td>{r.matched_relaxed ? "Settled (accepted a relaxed match)" : "Got preferred pairing"}</td>
                    <td>{r.n}</td>
                    <td>{pct(r.better, r.n)}</td>
                    <td>{pct(r.same, r.n)}</td>
                    <td>{pct(r.worse, r.n)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
