/**
 * ICS (iCalendar) file generator for lunar recurring events.
 *
 * Because no standard RRULE can express "every Chinese lunar New Year"
 * or "every 正月初一", we generate individual all-day VEVENTs for each
 * year in the requested range, each mapped to its correct Gregorian date.
 */

import {
  LunarEvent,
  lunarToSolar,
  dateToJD,
  jdToDate,
  CN_MONTHS,
  CN_DAYS,
} from './lunar';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0');
}

/** Format a date as YYYYMMDD for ICS. */
function icsDate(year: number, month: number, day: number): string {
  return `${year}${pad(month)}${pad(day)}`;
}

/** Format a UTC timestamp as YYYYMMDDTHHMMSSZ (RFC 5545 DATE-TIME). */
function icsDateTimeUTC(date: Date): string {
  return (
    String(date.getUTCFullYear()) +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

/** Escape a TEXT value per RFC 5545 §3.3.11. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

/**
 * Fold a content line to at most 75 octets per physical line (RFC 5545 §3.1).
 * Continuation lines start with a single space. UTF-8 characters are not split.
 */
function foldLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;

  const chunks: string[] = [];
  let offset = 0;
  let max = 75;
  const decoder = new TextDecoder();
  while (offset < bytes.length) {
    let end = Math.min(offset + max, bytes.length);
    while (end > offset && end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
    chunks.push(decoder.decode(bytes.subarray(offset, end)));
    offset = end;
    max = 74;
  }
  return chunks.join('\r\n ');
}

/** Chinese lunar date description, e.g. "农历闰六月初一". */
function lunarDescription(ev: LunarEvent): string {
  const m = CN_MONTHS[ev.lunarMonth - 1];
  const d = CN_DAYS[ev.lunarDay - 1];
  return `农历${ev.isLeapMonth ? '闰' : ''}${m}月${d}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ICS Generation
// ─────────────────────────────────────────────────────────────────────────────

/** Generate all VEVENT lines for a single LunarEvent. */
function generateVEvents(ev: LunarEvent, dtStamp: string): string[] {
  const lines: string[] = [];
  const desc = lunarDescription(ev);

  for (let year = ev.startYear; year <= ev.endYear; year++) {
    const solar = lunarToSolar(year, ev.lunarMonth, ev.lunarDay, ev.isLeapMonth);
    if (!solar) continue; // skip years where this lunar date doesn't exist

    const dtStart = icsDate(solar.year, solar.month, solar.day);

    // DTEND is the next calendar day (exclusive, as per RFC 5545 §3.6.1)
    const nextDay = jdToDate(dateToJD(solar.year, solar.month, solar.day) + 1);
    const dtEnd   = icsDate(nextDay.year, nextDay.month, nextDay.day);

    const uid = [
      'lunar',
      year,
      ev.lunarMonth,
      ev.isLeapMonth ? 'L' : '',
      ev.lunarDay,
      ev.id,
    ].join('-') + '@lunar-events';

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${ev.name}`,
      `DESCRIPTION:${desc}`,
      'TRANSP:TRANSPARENT',
      `X-LUNAR-DATE:${desc}`,
      'END:VEVENT',
    );
  }

  return lines;
}

/** Calendar description: states that this service generated the file. */
const CALENDAR_DESCRIPTION =
  '本日历由农历周期活动生成 https://howiezhao.github.io/lunar-events';

/**
 * Build a complete ICS string for an array of LunarEvents.
 * All events are combined into a single VCALENDAR component.
 */
export function buildICS(events: LunarEvent[]): string {
  const description = escapeText(CALENDAR_DESCRIPTION);
  const dtStamp = icsDateTimeUTC(new Date());
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//howiezhao//lunar-events//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:农历周期活动',
    // Apple Calendar reads X-WR-CALDESC; DESCRIPTION is the RFC 7986 property.
    foldLine(`X-WR-CALDESC:${description}`),
    foldLine(`DESCRIPTION:${description}`),
    'X-WR-TIMEZONE:Asia/Shanghai',
    ...events.flatMap(ev => generateVEvents(ev, dtStamp)),
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

/**
 * Count how many valid occurrences will be generated for a LunarEvent.
 * Useful for displaying "N 次" in the UI.
 */
export function countOccurrences(ev: LunarEvent): number {
  let count = 0;
  for (let year = ev.startYear; year <= ev.endYear; year++) {
    if (lunarToSolar(year, ev.lunarMonth, ev.lunarDay, ev.isLeapMonth)) count++;
  }
  return count;
}

/**
 * Trigger a browser file download with the given content.
 * Uses a data URL for maximum compatibility.
 */
export function triggerDownload(filename: string, content: string): void {
  const a = document.createElement('a');
  a.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(content);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
