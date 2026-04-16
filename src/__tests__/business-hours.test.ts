import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/kalendarium", () => ({
  isPublicHoliday: vi.fn(),
}));
vi.mock("@/lib/storage", () => ({
  isSpecialClosingDay: vi.fn(),
}));

import { isPublicHoliday } from "@/lib/kalendarium";
import { isSpecialClosingDay } from "@/lib/storage";
import { isOpen } from "@/lib/business-hours";

// January 2026: Copenhagen is CET (UTC+1)
// Monday Jan 5 2026, 10:00 CET = 09:00 UTC
const MON_10AM = new Date("2026-01-05T09:00:00Z");

describe("isOpen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(isPublicHoliday).mockResolvedValue({ holiday: false });
    vi.mocked(isSpecialClosingDay).mockResolvedValue({ closed: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true on a weekday during business hours", async () => {
    vi.setSystemTime(MON_10AM);
    expect(await isOpen()).toBe(true);
  });

  it("returns false on Saturday", async () => {
    vi.setSystemTime(new Date("2026-01-03T09:00:00Z")); // Sat
    expect(await isOpen()).toBe(false);
  });

  it("returns false on Sunday", async () => {
    vi.setSystemTime(new Date("2026-01-04T09:00:00Z")); // Sun
    expect(await isOpen()).toBe(false);
  });

  it("returns false before 08:00 Copenhagen time", async () => {
    vi.setSystemTime(new Date("2026-01-05T06:30:00Z")); // 07:30 CET
    expect(await isOpen()).toBe(false);
  });

  it("returns false at 16:00 Copenhagen time", async () => {
    vi.setSystemTime(new Date("2026-01-05T15:00:00Z")); // 16:00 CET
    expect(await isOpen()).toBe(false);
  });

  it("returns false on a public holiday", async () => {
    vi.setSystemTime(MON_10AM);
    vi.mocked(isPublicHoliday).mockResolvedValue({ holiday: true, name: "New Year" });
    expect(await isOpen()).toBe(false);
  });

  it("returns false on a special closing day", async () => {
    vi.setSystemTime(MON_10AM);
    vi.mocked(isSpecialClosingDay).mockResolvedValue({ closed: true, reason: "Team offsite" });
    expect(await isOpen()).toBe(false);
  });

  it("does not call external APIs on weekends (short-circuit)", async () => {
    vi.setSystemTime(new Date("2026-01-03T09:00:00Z")); // Saturday
    await isOpen();
    expect(isPublicHoliday).not.toHaveBeenCalled();
    expect(isSpecialClosingDay).not.toHaveBeenCalled();
  });

  it("does not call external APIs outside business hours (short-circuit)", async () => {
    vi.setSystemTime(new Date("2026-01-05T06:00:00Z")); // 07:00 CET
    await isOpen();
    expect(isPublicHoliday).not.toHaveBeenCalled();
    expect(isSpecialClosingDay).not.toHaveBeenCalled();
  });
});
