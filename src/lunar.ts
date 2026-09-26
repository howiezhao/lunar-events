/**
 * Chinese Lunar Calendar — Astronomical Algorithm
 *
 * Based on Jean Meeus, "Astronomical Algorithms" (2nd ed.)
 * New moon precision: ±2 minutes over 1900–2100
 * Solar longitude precision: ~0.01°
 *
 * Reference frame: Beijing Standard Time (CST = UTC+8)
 * Month starts on the Beijing calendar day that contains the new moon instant.
 * A month is a leap month (闰月) if it contains no 中气 (major solar term).
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SolarDate {
  year: number;
  month: number; // 1–12
  day: number;
}

export interface LunarDate {
  lunarYear: number;
  lunarMonth: number; // 1–12
  lunarDay: number;   // 1–30
  isLeap: boolean;
}

export interface LunarEvent {
  id: string;
  name: string;
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
  startYear: number;
  endYear: number;
}

export interface MonthEntry {
  k: number;        // Meeus new-moon index (k=0 → 2000-01-06.4 TT)
  num: number;      // 1–12
  isLeap: boolean;
  jdeStart: number; // Julian Ephemeris Day of new moon
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const RAD = Math.PI / 180;

export const CN_MONTHS = [
  '正', '二', '三', '四', '五', '六',
  '七', '八', '九', '十', '十一', '十二',
];

export const CN_DAYS = [
  '初一', '初二', '初三', '初四', '初五',
  '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五',
  '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五',
  '廿六', '廿七', '廿八', '廿九', '三十',
];

const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const ZODIAC_ANIMALS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

// ─────────────────────────────────────────────────────────────────────────────
// Julian Day Conversions
// ─────────────────────────────────────────────────────────────────────────────

/** Gregorian date → Julian Day Number (at noon UTC) */
export function dateToJD(y: number, m: number, d: number): number {
  if (m <= 2) { y--; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

/** Julian Day Number → Gregorian date */
export function jdToDate(jd: number): SolarDate {
  const jd2 = jd + 0.5;
  const Z = Math.floor(jd2);
  const alpha = Math.floor((Z - 1867216.25) / 36524.25);
  const A = Z + 1 + alpha - Math.floor(alpha / 4);
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const day = B - D - Math.floor(30.6001 * E);
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;
  return { year, month, day };
}

// ─────────────────────────────────────────────────────────────────────────────
// Astronomical Calculations
// ─────────────────────────────────────────────────────────────────────────────

function mod(a: number, b: number): number {
  return ((a % b) + b) % b;
}

/**
 * Julian Ephemeris Day of the k-th new moon.
 * k = 0 → new moon of 2000-01-06.4 TT
 * Accuracy: ±2 min over 1900–2100  (Meeus ch. 49)
 */
export function newMoonJDE(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;

  let jde =
    2451550.09765 +
    29.530588853 * k +
    0.0001337 * T2 -
    0.00000015 * T3 +
    0.00000000073 * T4;

  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const M  = mod(2.5534  + 29.10535669  * k - 0.0000218 * T2, 360) * RAD;
  const Mp = mod(201.5643 + 385.81693528 * k + 0.0107438 * T2, 360) * RAD;
  const F  = mod(160.7108 + 390.67050274 * k - 0.0016341 * T2, 360) * RAD;
  const Om = mod(124.7746 -   1.5637558  * k + 0.0020691 * T2, 360) * RAD;

  jde +=
    -0.40720 * Math.sin(Mp)
    + 0.17241 * E * Math.sin(M)
    + 0.01608 * Math.sin(2 * Mp)
    + 0.01039 * Math.sin(2 * F)
    + 0.00739 * E * Math.sin(Mp - M)
    - 0.00514 * E * Math.sin(Mp + M)
    + 0.00208 * E * E * Math.sin(2 * M)
    - 0.00111 * Math.sin(Mp - 2 * F)
    - 0.00057 * Math.sin(Mp + 2 * F)
    + 0.00056 * E * Math.sin(2 * Mp + M)
    - 0.00042 * Math.sin(3 * Mp)
    + 0.00042 * E * Math.sin(M + 2 * F)
    + 0.00038 * E * Math.sin(M - 2 * F)
    - 0.00024 * E * Math.sin(2 * Mp - M)
    - 0.00017 * Math.sin(Om)
    - 0.00007 * Math.sin(Mp + 2 * M)
    + 0.00004 * Math.sin(2 * Mp - 2 * F)
    + 0.00004 * Math.sin(3 * M)
    + 0.00003 * Math.sin(Mp + M - 2 * F)
    + 0.00003 * Math.sin(2 * Mp + 2 * F)
    - 0.00003 * Math.sin(Mp + M + 2 * F)
    + 0.00003 * Math.sin(Mp - M + 2 * F)
    - 0.00002 * Math.sin(Mp - M - 2 * F)
    - 0.00002 * Math.sin(3 * Mp + M)
    + 0.00002 * Math.sin(4 * Mp);

  return jde;
}

/**
 * Apparent solar longitude in degrees at a given JDE.
 * Accuracy: ~0.01°  (Meeus ch. 25)
 */
function sunLongitude(jde: number): number {
  const T  = (jde - 2451545.0) / 36525;
  const T2 = T * T;
  const L0 = mod(280.46646 + 36000.76983 * T + 0.0003032 * T2, 360);
  const M  = mod(357.52911 + 35999.05029 * T - 0.0001537 * T2, 360) * RAD;
  const C  =
    (1.914602 - 0.004817 * T - 0.000014 * T2) * Math.sin(M) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * M) +
    0.000289 * Math.sin(3 * M);
  let lon = L0 + C;
  const omega = mod(125.04 - 1934.136 * T, 360) * RAD;
  lon -= 0.00569 + 0.00478 * Math.sin(omega);
  return mod(lon, 360);
}

/**
 * Find JDE when the sun's apparent longitude equals targetLon (°).
 * Uses Newton-like iteration starting from approxJDE.
 */
function findSolarTermJDE(targetLon: number, approxJDE: number): number {
  let jde = approxJDE;
  for (let i = 0; i < 50; i++) {
    let diff = targetLon - sunLongitude(jde);
    if (diff >  180) diff -= 360;
    if (diff < -180) diff += 360;
    if (Math.abs(diff) < 0.00001) break;
    jde += (diff / 360) * 365.25;
  }
  return jde;
}

/** Return k such that newMoonJDE(k) ≤ jde < newMoonJDE(k+1) */
function findNewMoonK(jde: number): number {
  let k = Math.round((jde - 2451550.09765) / 29.530588853);
  while (newMoonJDE(k) > jde) k--;
  while (newMoonJDE(k + 1) <= jde) k++;
  return k;
}

/**
 * Return true if the sun passes through any multiple of 30°
 * (a 中气 / major solar term) during the lunar month [jde0, jde1).
 */
function monthHasZhongqi(jde0: number, jde1: number): boolean {
  const lon0 = sunLongitude(jde0);
  const lon1 = sunLongitude(jde1);
  let arc = lon1 - lon0;
  if (arc < 0) arc += 360;
  for (let i = 0; i < 12; i++) {
    let dist = i * 30 - lon0;
    if (dist < 0) dist += 360;
    if (dist < arc) return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Month Table
// ─────────────────────────────────────────────────────────────────────────────

/** Convert a JDE instant to the corresponding Beijing date JD (integer day). */
function jdeToBeijingJD(jde: number): number {
  const d = jdToDate(jde + 8 / 24);
  return dateToJD(d.year, d.month, d.day);
}

// Cache keyed by gregYear (the Gregorian year of the Winter Solstice)
const _monthTableCache = new Map<number, MonthEntry[]>();

/**
 * Build the lunar month table for the 12- or 13-month cycle that begins
 * with Month 11 of the Chinese year whose Winter Solstice falls in gregYear.
 *
 * Months returned (in order):
 *   11, 12, [leap?], 1, 2, ..., 10  of the next Chinese year
 *
 * Leap month rule: first month with no 中气 → leap, keeping the previous
 * month's number.
 */
export function buildMonthTable(gregYear: number): MonthEntry[] {
  if (_monthTableCache.has(gregYear)) return _monthTableCache.get(gregYear)!;

  // Winter Solstice of gregYear (sun longitude = 270°)
  const wsJDE  = findSolarTermJDE(270, dateToJD(gregYear,     12, 1));
  const wsJDE2 = findSolarTermJDE(270, dateToJD(gregYear + 1, 12, 1));

  const k11     = findNewMoonK(wsJDE);
  const k11next = findNewMoonK(wsJDE2);
  const numMonths = k11next - k11; // 12 (normal) or 13 (leap year)

  const months: MonthEntry[] = [];
  let monthNum = 11;
  let foundLeap = false;

  for (let i = 0; i < numMonths; i++) {
    const ki   = k11 + i;
    const jde0 = newMoonJDE(ki);
    const jde1 = newMoonJDE(ki + 1);
    const hasZ = monthHasZhongqi(jde0, jde1);

    if (!foundLeap && !hasZ) {
      const prevNum = months.length > 0 ? months[months.length - 1].num : 11;
      months.push({ k: ki, num: prevNum, isLeap: true,  jdeStart: jde0 });
      foundLeap = true;
    } else {
      months.push({ k: ki, num: monthNum, isLeap: false, jdeStart: jde0 });
      monthNum = (monthNum % 12) + 1;
    }
  }

  _monthTableCache.set(gregYear, months);
  return months;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public Conversion API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert a Chinese lunar date to its Gregorian solar equivalent.
 *
 * Mapping:
 *   lunarMonth 1–10  → cycle anchored at WS of (lunarYear − 1)
 *   lunarMonth 11–12 → cycle anchored at WS of  lunarYear
 *
 * Returns null if the date is invalid (leap month doesn't exist this year,
 * or day number exceeds the month length).
 */
export function lunarToSolar(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number,
  isLeapMonth: boolean,
): SolarDate | null {
  const gregYear = lunarMonth >= 11 ? lunarYear : lunarYear - 1;
  const months = buildMonthTable(gregYear);
  const target = months.find(m => m.num === lunarMonth && m.isLeap === isLeapMonth);
  if (!target) return null;

  const dayJDE = target.jdeStart + (lunarDay - 1);
  if (dayJDE >= newMoonJDE(target.k + 1)) return null; // day beyond month end

  return jdToDate(dayJDE + 8 / 24); // convert to Beijing date
}

/**
 * Convert a Gregorian solar date to its Chinese lunar equivalent.
 * Returns null if the date is out of the supported range (~1900–2100).
 */
export function solarToLunar(
  sYear: number,
  sMonth: number,
  sDay: number,
): LunarDate | null {
  const targetJD = dateToJD(sYear, sMonth, sDay);

  for (const gregYear of [sYear - 2, sYear - 1, sYear]) {
    const months = buildMonthTable(gregYear);
    for (const m of months) {
      const startJD = jdeToBeijingJD(m.jdeStart);
      const endJD   = jdeToBeijingJD(newMoonJDE(m.k + 1));
      if (targetJD >= startJD && targetJD < endJD) {
        const lunarDay  = Math.round(targetJD - startJD) + 1;
        const lunarYear = m.num <= 10 ? gregYear + 1 : gregYear;
        return { lunarYear, lunarMonth: m.num, lunarDay, isLeap: m.isLeap };
      }
    }
  }
  return null;
}

/** Number of days in a given lunar month (29 or 30). */
export function getLunarMonthDays(
  lunarYear: number,
  lunarMonth: number,
  isLeap: boolean,
): number {
  return lunarToSolar(lunarYear, lunarMonth, 30, isLeap) ? 30 : 29;
}

/** Whether a given Chinese year has an intercalary (leap) version of lunarMonth. */
export function leapMonthExists(lunarYear: number, lunarMonth: number): boolean {
  return lunarToSolar(lunarYear, lunarMonth, 1, true) !== null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Display Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Chinese year name in 天干地支 + 生肖, e.g. "甲辰龙年" for 2024. */
export function getChineseYearName(lunarYear: number): string {
  const stem   = HEAVENLY_STEMS[mod(lunarYear - 4, 10)];
  const branch = EARTHLY_BRANCHES[mod(lunarYear - 4, 12)];
  const zodiac = ZODIAC_ANIMALS[mod(lunarYear - 4, 12)];
  return `${stem}${branch}${zodiac}年`;
}

/** "正月", "闰六月", etc. */
export function formatLunarMonth(month: number, isLeap: boolean): string {
  return `${isLeap ? '闰' : ''}${CN_MONTHS[month - 1]}月`;
}

/** "初一", "十五", etc. */
export function formatLunarDay(day: number): string {
  return CN_DAYS[day - 1] ?? String(day);
}

/** ISO date string "YYYY-MM-DD" */
export function formatSolarDate(d: SolarDate): string {
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
}

/** Day of week, Mon = 0, Sun = 6 */
export function getMondayBasedDOW(year: number, month: number, day: number): number {
  return (new Date(year, month - 1, day).getDay() + 6) % 7;
}

/** Today as a SolarDate */
export function today(): SolarDate {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

/** Navigate to the previous/next lunar month, handling year wrap. */
export function adjacentLunarMonth(
  lunarYear: number,
  lunarMonth: number,
  isLeap: boolean,
  delta: 1 | -1,
): { lunarYear: number; lunarMonth: number; isLeap: boolean } {
  if (delta === 1) {
    // Going forward: if current month has a leap and we're not on it, go to leap
    if (!isLeap && leapMonthExists(lunarYear, lunarMonth)) {
      return { lunarYear, lunarMonth, isLeap: true };
    }
    const nextMonth = lunarMonth === 12 ? 1 : lunarMonth + 1;
    const nextYear  = lunarMonth === 12 ? lunarYear + 1 : lunarYear;
    return { lunarYear: nextYear, lunarMonth: nextMonth, isLeap: false };
  } else {
    // Going back
    if (isLeap) {
      return { lunarYear, lunarMonth, isLeap: false };
    }
    const prevMonth = lunarMonth === 1 ? 12 : lunarMonth - 1;
    const prevYear  = lunarMonth === 1 ? lunarYear - 1 : lunarYear;
    // If the previous month has a leap, land on the leap version
    if (leapMonthExists(prevYear, prevMonth)) {
      return { lunarYear: prevYear, lunarMonth: prevMonth, isLeap: true };
    }
    return { lunarYear: prevYear, lunarMonth: prevMonth, isLeap: false };
  }
}
