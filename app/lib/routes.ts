// URL for each screen of the single-page app. Shared by the client (history
// sync) and the server catch-all route (anything else is a 404).
export type View =
  | "welcome" | "auth" | "onboarding" | "home" | "checkin"
  | "queue" | "chat" | "survey" | "paywall" | "resources" | "guide" | "settings";

export const VIEW_PATH: Record<View, string> = {
  welcome: "/",
  auth: "/signin",
  onboarding: "/onboarding",
  home: "/home",
  checkin: "/checkin",
  queue: "/checkin/matching",
  chat: "/chat",
  survey: "/checkin/survey",
  paywall: "/upgrade",
  resources: "/help",
  guide: "/guide",
  settings: "/profile",
};

export const PATH_VIEW = Object.fromEntries(
  (Object.entries(VIEW_PATH) as [View, string][]).map(([v, p]) => [p, v]),
) as Record<string, View>;

// Check-in step URLs from before the flow became one screen; old links and
// bookmarks still open the app (they land on home) rather than a 404.
const LEGACY_PATHS = ["/checkin/mood", "/checkin/energy", "/checkin/pleasantness", "/checkin/emotion", "/checkin/category", "/checkin/details"];

export function isAppPath(path: string) {
  const clean = path.length > 1 ? path.replace(/\/+$/, "") : path;
  return clean in PATH_VIEW || LEGACY_PATHS.includes(clean);
}
