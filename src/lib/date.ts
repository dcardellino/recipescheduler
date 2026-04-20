import {
  addDays,
  addWeeks as addWeeksFns,
  format,
  getISOWeek,
  getISOWeekYear,
  parse,
  setISOWeek,
  setISOWeekYear,
  startOfISOWeek,
  isSameDay as isSameDayFns,
  isWeekend,
  isBefore,
  isAfter,
} from "date-fns";
import { de } from "date-fns/locale";

const SHORT_WEEKDAYS = [
  "Mo",
  "Di",
  "Mi",
  "Do",
  "Fr",
  "Sa",
  "So",
] as const;

const LONG_WEEKDAYS = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
] as const;

export function getWeekStart(d: Date = new Date()): Date {
  return startOfISOWeek(d);
}

export function addWeeks(d: Date, n: number): Date {
  return addWeeksFns(d, n);
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function formatWeekParam(weekStart: Date): string {
  const year = getISOWeekYear(weekStart);
  const week = getISOWeek(weekStart);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

const WEEK_PARAM_PATTERN = /^(\d{4})-W(\d{1,2})$/;

export function parseWeekParam(param: string | undefined | null): Date | null {
  if (!param) return null;
  const match = param.match(WEEK_PARAM_PATTERN);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(week)) return null;
  if (week < 1 || week > 53) return null;

  const anchor = new Date(Date.UTC(year, 0, 4));
  const withYear = setISOWeekYear(anchor, year);
  const withWeek = setISOWeek(withYear, week);
  return startOfISOWeek(withWeek);
}

export function formatShortWeekday(d: Date): string {
  const idx = (d.getDay() + 6) % 7;
  return SHORT_WEEKDAYS[idx];
}

export function formatLongWeekday(d: Date): string {
  const idx = (d.getDay() + 6) % 7;
  return LONG_WEEKDAYS[idx];
}

export function formatDayLabel(d: Date): string {
  return format(d, "EE, d. MMM", { locale: de });
}

export function formatDayNumber(d: Date): string {
  return format(d, "d. MMM", { locale: de });
}

export function formatWeekTitle(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const weekNumber = getISOWeek(weekStart);
  const sameMonth = format(weekStart, "MMM") === format(weekEnd, "MMM");
  if (sameMonth) {
    return `KW ${weekNumber} · ${format(weekStart, "d.", {
      locale: de,
    })}–${format(weekEnd, "d. MMMM", { locale: de })}`;
  }
  return `KW ${weekNumber} · ${format(weekStart, "d. MMM", {
    locale: de,
  })} – ${format(weekEnd, "d. MMM", { locale: de })}`;
}

export function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function parseISODate(s: string): Date {
  return parse(s, "yyyy-MM-dd", new Date());
}

export function isSameDay(a: Date, b: Date): boolean {
  return isSameDayFns(a, b);
}

export { isWeekend, isBefore, isAfter, addDays };
