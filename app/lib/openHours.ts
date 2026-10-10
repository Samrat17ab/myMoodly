// ============================================================================
// THE SWITCH
//   true  = myMoodly opens nightly from 9 PM to 3 AM IST. Matching happens only
//           then, and visitors see the countdown and "Add to calendar".
//   false = always open: matching any time, no countdown (the original behaviour).
// Change it here, commit, and push; nothing else needs touching.
export const NIGHT_HOURS_ENABLED = true;
// ============================================================================

// This module is the single source of truth for the nightly window, shared by
// the server (which enforces it) and the client (which shows the countdown).
//
// IST is UTC+5:30 all year (no daylight saving), so plain offset arithmetic
// is exact and needs no time-zone database.

export const OPEN_HOUR_IST = 21; // 9 PM
export const CLOSE_HOUR_IST = 3; // 3 AM, the next morning
export const IST_OFFSET_MINUTES = 330;
export const OPEN_HOURS_LABEL = "9 PM – 3 AM IST";

const MINUTE = 60_000;
const DAY = 86_400_000;
const OFFSET = IST_OFFSET_MINUTES * MINUTE;

export interface OpenHoursState {
  /** nightly hours are switched on (NIGHT_HOURS_ENABLED) */
  enabled: boolean;
  /** matching is open right now (always true when the switch is off) */
  open: boolean;
  /** start of the current night (when open) or the next one (when closed), epoch ms */
  opensAt: number;
  /** end of that same night, epoch ms */
  closesAt: number;
}

export function openHoursState(now: number = Date.now(), enabled: boolean = NIGHT_HOURS_ENABLED): OpenHoursState {
  // Work in "IST wall-clock milliseconds" so day boundaries fall on IST midnight.
  const ist = now + OFFSET;
  const midnight = Math.floor(ist / DAY) * DAY;
  const minute = (ist - midnight) / MINUTE;
  const openMinute = OPEN_HOUR_IST * 60;
  const closeMinute = CLOSE_HOUR_IST * 60;

  let opensAt: number;
  if (minute >= openMinute) opensAt = midnight + openMinute * MINUTE; // tonight, already open
  else if (minute < closeMinute) opensAt = midnight - DAY + openMinute * MINUTE; // after midnight, opened yesterday
  else opensAt = midnight + openMinute * MINUTE; // daytime: opens tonight

  const closesAt = opensAt + (24 - OPEN_HOUR_IST + CLOSE_HOUR_IST) * 60 * MINUTE;
  return {
    enabled,
    open: !enabled || minute >= openMinute || minute < closeMinute,
    opensAt: opensAt - OFFSET,
    closesAt: closesAt - OFFSET,
  };
}

export const CLOSED_MESSAGE = "myMoodly is open nightly from 9 PM to 3 AM IST. Come back when we open.";
