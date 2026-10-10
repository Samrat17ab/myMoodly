// "Add to calendar": a daily repeating event for the opening window, as a
// standard .ics file. Times are in UTC; IST has no daylight saving, so a
// daily repeat stays on 9 PM IST all year.

const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export function downloadOpenHoursCalendar(opensAt: number, closesAt: number) {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//myMoodly//Open hours//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'UID:nightly-open-hours@mymoodly.space',
    `DTSTAMP:${stamp(Date.now())}`,
    `DTSTART:${stamp(opensAt)}`,
    `DTEND:${stamp(closesAt)}`,
    'RRULE:FREQ=DAILY',
    'SUMMARY:myMoodly is open',
    'DESCRIPTION:myMoodly is open every night from 9 PM to 3 AM IST. Name how you feel and talk it through with one real person. https://mymoodly.space',
    'URL:https://mymoodly.space',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:myMoodly is open now',
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'mymoodly-open-hours.ics';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
