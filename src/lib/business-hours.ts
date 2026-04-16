import { isPublicHoliday } from "./kalendarium";
import { isSpecialClosingDay, getOpeningHours } from "./storage";

/**
 * Returns the current date/time broken down in the given timezone.
 */
function getTimeParts(timezone: string): {
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
    new Intl.DateTimeFormat("en-GB", { timeZone: timezone, [part]: "numeric" })
      .formatToParts(now)
      .find((p) => p.type === part)?.value ?? "0";

  const year = parseInt(fmt("year"));
  const month = parseInt(fmt("month"));
  const day = parseInt(fmt("day"));
  const hour = parseInt(fmt("hour"));
  const minute = parseInt(fmt("minute"));

  // Derive weekday from a locale-agnostic approach
  const weekdayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
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
 *  2. Time window (configurable, stored in Vercel Blob)
 *  3. Danish public holiday via Kalendarium API
 *  4. Special closing day from local JSON store
 */
export async function isOpen(): Promise<boolean> {
  const { timezone, openHour, closeHour } = await getOpeningHours();
  const { weekday, hour, dateStr } = getTimeParts(timezone);

  if (weekday === 0 || weekday === 6) return false;
  if (hour < openHour || hour >= closeHour) return false;

  const { holiday } = await isPublicHoliday(dateStr);
  if (holiday) return false;

  const { closed } = await isSpecialClosingDay(dateStr);
  if (closed) return false;

  return true;
}
