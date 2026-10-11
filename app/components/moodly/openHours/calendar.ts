// "Add to calendar": opens Google Calendar with a daily repeating event for the
// opening window already filled in. It's a plain link, so it also works inside
// in-app browsers (LinkedIn, Instagram, Reddit, X) that block file downloads.
// Times are in UTC; IST has no daylight saving, so a daily repeat stays on
// 9 PM IST all year.

const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export function googleCalendarUrl(opensAt: number, closesAt: number) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'myMoodly is open',
    dates: `${stamp(opensAt)}/${stamp(closesAt)}`,
    details: 'Open every night from 9 PM to 3 AM IST. Name how you feel and talk it through with one real person. https://mymoodly.space',
    location: 'https://mymoodly.space',
    recur: 'RRULE:FREQ=DAILY',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
