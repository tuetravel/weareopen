import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/kalendarium", () => ({
  isPublicHoliday: vi.fn(),
}));
vi.mock("@/lib/storage", () => ({
  isSpecialClosingDay: vi.fn(),
  getOpeningHours: vi.fn(),
}));

import { isPublicHoliday } from "@/lib/kalendarium";
import { isSpecialClosingDay, getOpeningHours } from "@/lib/storage";
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
    vi.mocked(getOpeningHours).mockResolvedValue({ timezone: "Europe/Copenhagen", openHour: 8, closeHour: 16 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns open:true on a weekday during business hours", async () => {
    vi.setSystemTime(MON_10AM);
    expect(await isOpen()).toEqual({ open: true });
  });

  it("returns open:false with reason 'weekend' on Saturday", async () => {
    vi.setSystemTime(new Date("2026-01-03T09:00:00Z")); // Sat
    expect(await isOpen()).toEqual({ open: false, reason: "weekend" });
  });

  it("returns open:false with reason 'weekend' on Sunday", async () => {
    vi.setSystemTime(new Date("2026-01-04T09:00:00Z")); // Sun
    expect(await isOpen()).toEqual({ open: false, reason: "weekend" });
  });

  it("returns open:false with reason 'outside hours' before 08:00", async () => {
    vi.setSystemTime(new Date("2026-01-05T06:30:00Z")); // 07:30 CET
    expect(await isOpen()).toEqual({ open: false, reason: "outside hours" });
  });

  it("returns open:false with reason 'outside hours' at 16:00", async () => {
    vi.setSystemTime(new Date("2026-01-05T15:00:00Z")); // 16:00 CET
    expect(await isOpen()).toEqual({ open: false, reason: "outside hours" });
  });

  it("returns open:false with reason 'public holiday' and note", async () => {
    vi.setSystemTime(MON_10AM);
    vi.mocked(isPublicHoliday).mockResolvedValue({ holiday: true, name: "New Year" });
    expect(await isOpen()).toEqual({ open: false, reason: "public holiday", note: "New Year" });
  });

  it("returns open:false with reason 'closing day' and note", async () => {
    vi.setSystemTime(MON_10AM);
    vi.mocked(isSpecialClosingDay).mockResolvedValue({ closed: true, reason: "Team offsite" });
    expect(await isOpen()).toEqual({ open: false, reason: "closing day", note: "Team offsite" });
  });

  it("returns open:false with reason 'closing day' without note when no reason set", async () => {
    vi.setSystemTime(MON_10AM);
    vi.mocked(isSpecialClosingDay).mockResolvedValue({ closed: true });
    expect(await isOpen()).toEqual({ open: false, reason: "closing day" });
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

  it("returns false when current hour is before custom openHour", async () => {
    vi.setSystemTime(MON_10AM); // 10:00 CET
    vi.mocked(getOpeningHours).mockResolvedValue({
      timezone: "Europe/Copenhagen",
      openHour: 11,
      closeHour: 16,
    });
    expect(await isOpen()).toEqual({ open: false, reason: "outside hours" });
  });

  it("returns false when current hour equals custom closeHour", async () => {
    vi.setSystemTime(new Date("2026-01-05T13:00:00Z")); // 14:00 CET
    vi.mocked(getOpeningHours).mockResolvedValue({
      timezone: "Europe/Copenhagen",
      openHour: 8,
      closeHour: 14,
    });
    expect(await isOpen()).toEqual({ open: false, reason: "outside hours" });
  });
});
