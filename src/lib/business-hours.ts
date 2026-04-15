import { isPublicHoliday } from "./kalendarium";
import { isSpecialClosingDay } from "./storage";

const TIMEZONE = "Europe/Copenhagen";
const OPEN_HOUR = 8;   // 08:00
const CLOSE_HOUR = 16; // 16:00

/**
 * Returns the current date/time broken down in the Copenhagen timezone.
 */
function getCopenhagenParts(): {
  year: number;
  month: number;
  day: number;
  weekday: number; // 0 = Sunday … 6 = Saturday
  hour: number;
  minute: number;
  dateStr: string; // YYYY-MM-DD
} {
  const now = new Date();

  const fmt = (part: Intl.DateTimeFormatPartTypes) =>
    new Intl.DateTimeFormat("en-GB", { timeZone: TIMEZONE, [part]: "numeric" })
      .formatToParts(now)
      .find((p) => p.type === part)?.value ?? "0";

  const year = parseInt(fmt("year"));
  const month = parseInt(fmt("month"));
  const day = parseInt(fmt("day"));
  const hour = parseInt(fmt("hour"));
  const minute = parseInt(fmt("minute"));

  // Derive weekday from a locale-agnostic approach
  const weekdayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
  }).format(now);
  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const weekday = weekdayMap[weekdayStr] ?? now.getDay();

  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return { year, month, day, weekday, hour, minute, dateStr };
}

/**
 * Returns true if the business is currently open.
 * Checks (in order):
 *  1. Day of week (Mon–Fri only)
 *  2. Time window (08:00–16:00 Copenhagen)
 *  3. Danish public holiday via Kalendarium API
 *  4. Special closing day from local JSON store
 */
export async function isOpen(): Promise<boolean> {
  const { weekday, hour, dateStr } = getCopenhagenParts();

  // Weekend
  if (weekday === 0 || weekday === 6) return false;

  // Outside business hours
  if (hour < OPEN_HOUR || hour >= CLOSE_HOUR) return false;

  // Public holiday
  const { holiday } = await isPublicHoliday(dateStr);
  if (holiday) return false;

  // Special closing day
  const { closed } = isSpecialClosingDay(dateStr);
  if (closed) return false;

  return true;
}
