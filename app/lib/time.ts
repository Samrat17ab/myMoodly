/** The next occurrence of the daily reset (midnight UTC), expressed as a
 * time-of-day string in the viewer's local timezone (e.g. "5:45 AM"). */
export function nextResetLocalLabel(now = new Date()) {
  const nextUtcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  return nextUtcMidnight.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
