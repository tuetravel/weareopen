import fs from "fs";
import path from "path";

export interface ClosingDay {
  date: string; // YYYY-MM-DD
  reason?: string;
}

interface StorageData {
  days: ClosingDay[];
}

const DATA_PATH = path.join(process.cwd(), "data", "closing-days.json");

function read(): StorageData {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw) as StorageData;
}

function write(data: StorageData): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function getClosingDays(): ClosingDay[] {
  return read().days;
}

export function addClosingDay(date: string, reason?: string): void {
  const data = read();
  if (!data.days.find((d) => d.date === date)) {
    data.days.push({ date, ...(reason ? { reason } : {}) });
    data.days.sort((a, b) => a.date.localeCompare(b.date));
    write(data);
  }
}

export function removeClosingDay(date: string): boolean {
  const data = read();
  const before = data.days.length;
  data.days = data.days.filter((d) => d.date !== date);
  if (data.days.length !== before) {
    write(data);
    return true;
  }
  return false;
}

export function isSpecialClosingDay(dateStr: string): { closed: boolean; reason?: string } {
  const day = read().days.find((d) => d.date === dateStr);
  if (day) {
    return { closed: true, reason: day.reason };
  }
  return { closed: false };
}
