import { openHoursState } from "@/app/lib/openHours";

// Public: whether myMoodly is open right now and when the current or next
// night starts and ends. `now` lets the client correct for a wrong local clock.
export function GET() {
  const now = Date.now();
  return Response.json(
    { ...openHoursState(now), now },
    { headers: { "cache-control": "no-store" } },
  );
}
