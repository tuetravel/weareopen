import { put, list } from "@vercel/blob";

export interface ClosingDay {
  date: string; // YYYY-MM-DD
  reason?: string;
}

const BLOB_KEY = "closing-days.json";

export interface OpeningHours {
  timezone: string;
  openHour: number;
  closeHour: number;
}

const DEFAULT_OPENING_HOURS: OpeningHours = {
  timezone: "Europe/Copenhagen",
  openHour: 8,
  closeHour: 16,
};

const OPENING_HOURS_KEY = "opening-hours.json";

async function readDays(): Promise<ClosingDay[]> {
  try {
    const { blobs } = await list({ prefix: BLOB_KEY });
    if (blobs.length === 0) return [];
    const res = await fetch(blobs[0].url, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });
    return await res.json();
  } catch {
    return [];
  }
}

async function writeDays(days: ClosingDay[]): Promise<void> {
  await put(BLOB_KEY, JSON.stringify(days), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function getClosingDays(): Promise<ClosingDay[]> {
  return readDays();
}

export async function addClosingDay(date: string, reason?: string): Promise<void> {
  const days = await readDays();
  if (!days.find((d) => d.date === date)) {
    days.push({ date, ...(reason ? { reason } : {}) });
    days.sort((a, b) => a.date.localeCompare(b.date));
    await writeDays(days);
  }
}

export async function removeClosingDay(date: string): Promise<boolean> {
  const days = await readDays();
  const filtered = days.filter((d) => d.date !== date);
  if (filtered.length !== days.length) {
    await writeDays(filtered);
    return true;
  }
  return false;
}

export async function isSpecialClosingDay(
  dateStr: string
): Promise<{ closed: boolean; reason?: string }> {
  const days = await readDays();
  const day = days.find((d) => d.date === dateStr);
  if (day) return { closed: true, reason: day.reason };
  return { closed: false };
}

// Module-level cache — avoids a blob read on every /api/open call.
// Invalidated immediately when settings are saved via setOpeningHours.
let openingHoursCache: { value: OpeningHours; expiresAt: number } | null = null;
const OPENING_HOURS_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function readOpeningHours(): Promise<OpeningHours> {
  if (openingHoursCache && Date.now() < openingHoursCache.expiresAt) {
    return openingHoursCache.value;
  }
  try {
    const { blobs } = await list({ prefix: OPENING_HOURS_KEY });
    if (blobs.length === 0) {
      openingHoursCache = { value: DEFAULT_OPENING_HOURS, expiresAt: Date.now() + OPENING_HOURS_TTL_MS };
      return DEFAULT_OPENING_HOURS;
    }
    const res = await fetch(blobs[0].url, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });
    const value: OpeningHours = await res.json();
    openingHoursCache = { value, expiresAt: Date.now() + OPENING_HOURS_TTL_MS };
    return value;
  } catch {
    return DEFAULT_OPENING_HOURS;
  }
}

export async function getOpeningHours(): Promise<OpeningHours> {
  return readOpeningHours();
}

export async function setOpeningHours(hours: OpeningHours): Promise<void> {
  await put(OPENING_HOURS_KEY, JSON.stringify(hours), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  openingHoursCache = null; // invalidate so next read picks up the new value
}

/** For testing only — resets the in-memory cache. */
export function _clearOpeningHoursCache(): void {
  openingHoursCache = null;
}
