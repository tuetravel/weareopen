import { kv } from "@vercel/kv";

export interface ClosingDay {
  date: string; // YYYY-MM-DD
  reason?: string;
}

const KV_KEY = "closing-days";

export async function getClosingDays(): Promise<ClosingDay[]> {
  const days = await kv.get<ClosingDay[]>(KV_KEY);
  return days ?? [];
}

export async function addClosingDay(date: string, reason?: string): Promise<void> {
  const days = await getClosingDays();
  if (!days.find((d) => d.date === date)) {
    days.push({ date, ...(reason ? { reason } : {}) });
    days.sort((a, b) => a.date.localeCompare(b.date));
    await kv.set(KV_KEY, days);
  }
}

export async function removeClosingDay(date: string): Promise<boolean> {
  const days = await getClosingDays();
  const filtered = days.filter((d) => d.date !== date);
  if (filtered.length !== days.length) {
    await kv.set(KV_KEY, filtered);
    return true;
  }
  return false;
}

export async function isSpecialClosingDay(
  dateStr: string
): Promise<{ closed: boolean; reason?: string }> {
  const days = await getClosingDays();
  const day = days.find((d) => d.date === dateStr);
  if (day) return { closed: true, reason: day.reason };
  return { closed: false };
}
