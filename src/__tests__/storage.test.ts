import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@vercel/blob", () => ({
  list: vi.fn(),
  put: vi.fn(),
}));

import { list, put } from "@vercel/blob";
import {
  addClosingDay,
  getClosingDays,
  isSpecialClosingDay,
  removeClosingDay,
  getOpeningHours,
  setOpeningHours,
} from "@/lib/storage";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockBlob(days: unknown[]) {
  vi.mocked(list).mockResolvedValue({ blobs: [{ url: "https://blob.example/closing-days.json" }] } as any);
  mockFetch.mockResolvedValue({ json: () => Promise.resolve(days) });
}

function mockEmpty() {
  vi.mocked(list).mockResolvedValue({ blobs: [] } as any);
}

describe("getClosingDays", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array when no blob exists", async () => {
    mockEmpty();
    expect(await getClosingDays()).toEqual([]);
  });

  it("returns days from the blob", async () => {
    const days = [{ date: "2026-01-01", reason: "New Year" }];
    mockBlob(days);
    expect(await getClosingDays()).toEqual(days);
  });
});

describe("addClosingDay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(put).mockResolvedValue({} as any);
  });

  it("adds a new closing day", async () => {
    mockEmpty();
    await addClosingDay("2026-03-01", "Maintenance");
    expect(put).toHaveBeenCalledWith(
      "closing-days.json",
      JSON.stringify([{ date: "2026-03-01", reason: "Maintenance" }]),
      expect.objectContaining({ access: "private" })
    );
  });

  it("does not add duplicate dates", async () => {
    mockBlob([{ date: "2026-03-01" }]);
    await addClosingDay("2026-03-01");
    expect(put).not.toHaveBeenCalled();
  });

  it("keeps days sorted by date", async () => {
    mockBlob([{ date: "2026-03-15" }]);
    await addClosingDay("2026-03-01");
    const saved = JSON.parse(vi.mocked(put).mock.calls[0][1] as string);
    expect(saved[0].date).toBe("2026-03-01");
    expect(saved[1].date).toBe("2026-03-15");
  });

  it("omits reason property when not provided", async () => {
    mockEmpty();
    await addClosingDay("2026-05-01");
    const saved = JSON.parse(vi.mocked(put).mock.calls[0][1] as string);
    expect(saved[0]).not.toHaveProperty("reason");
  });
});

describe("removeClosingDay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(put).mockResolvedValue({} as any);
  });

  it("removes an existing day and returns true", async () => {
    mockBlob([{ date: "2026-03-01" }, { date: "2026-04-01" }]);
    const result = await removeClosingDay("2026-03-01");
    expect(result).toBe(true);
    const saved = JSON.parse(vi.mocked(put).mock.calls[0][1] as string);
    expect(saved).toEqual([{ date: "2026-04-01" }]);
  });

  it("returns false when date not found", async () => {
    mockEmpty();
    expect(await removeClosingDay("2026-03-01")).toBe(false);
    expect(put).not.toHaveBeenCalled();
  });
});

describe("isSpecialClosingDay", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns closed:true with reason when date matches", async () => {
    mockBlob([{ date: "2026-03-01", reason: "Offsite" }]);
    expect(await isSpecialClosingDay("2026-03-01")).toEqual({ closed: true, reason: "Offsite" });
  });

  it("returns closed:false when date does not match", async () => {
    mockEmpty();
    expect(await isSpecialClosingDay("2026-03-02")).toEqual({ closed: false });
  });
});

describe("getOpeningHours", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns defaults when no blob exists", async () => {
    mockEmpty();
    expect(await getOpeningHours()).toEqual({
      timezone: "Europe/Copenhagen",
      openHour: 8,
      closeHour: 16,
    });
  });

  it("returns stored settings from blob", async () => {
    const settings = { timezone: "America/New_York", openHour: 9, closeHour: 17 };
    mockBlob(settings as any);
    expect(await getOpeningHours()).toEqual(settings);
  });

  it("returns defaults on fetch error", async () => {
    vi.mocked(list).mockRejectedValue(new Error("network error"));
    expect(await getOpeningHours()).toEqual({
      timezone: "Europe/Copenhagen",
      openHour: 8,
      closeHour: 16,
    });
  });
});

describe("setOpeningHours", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(put).mockResolvedValue({} as any);
  });

  it("writes settings to the correct blob key", async () => {
    const settings = { timezone: "Europe/London", openHour: 9, closeHour: 17 };
    await setOpeningHours(settings);
    expect(put).toHaveBeenCalledWith(
      "opening-hours.json",
      JSON.stringify(settings),
      expect.objectContaining({ access: "private" })
    );
  });
});
