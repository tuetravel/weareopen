import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/rate-limit", () => ({ isRateLimited: vi.fn().mockReturnValue(false) }));
vi.mock("@/lib/storage", () => ({
  getOpeningHours: vi.fn(),
  setOpeningHours: vi.fn(),
}));

import { NextRequest } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";
import { getOpeningHours, setOpeningHours } from "@/lib/storage";
import { GET, PUT } from "@/app/api/admin/opening-hours/route";

const API_KEY = "test-secret";
const AUTH = { Authorization: `Bearer ${API_KEY}` };
const DEFAULT_HOURS = { timezone: "Europe/Copenhagen", openHour: 8, closeHour: 16 };

function req(method: string, headers: Record<string, string> = {}, body?: unknown) {
  return new NextRequest("http://localhost/api/admin/opening-hours", {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/admin/opening-hours", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = API_KEY;
    vi.mocked(isRateLimited).mockReturnValue(false);
    vi.mocked(getOpeningHours).mockResolvedValue(DEFAULT_HOURS);
  });

  it("returns 401 without Authorization header", async () => {
    expect((await GET(req("GET"))).status).toBe(401);
  });

  it("returns 401 with wrong API key", async () => {
    expect((await GET(req("GET", { Authorization: "Bearer wrong" }))).status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(isRateLimited).mockReturnValue(true);
    expect((await GET(req("GET", AUTH))).status).toBe(429);
  });

  it("returns current opening hours on success", async () => {
    const res = await GET(req("GET", AUTH));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(DEFAULT_HOURS);
  });
});

describe("PUT /api/admin/opening-hours", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = API_KEY;
    vi.mocked(isRateLimited).mockReturnValue(false);
    vi.mocked(setOpeningHours).mockResolvedValue(undefined);
  });

  it("returns 401 without auth", async () => {
    expect((await PUT(req("PUT", {}, DEFAULT_HOURS))).status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(isRateLimited).mockReturnValue(true);
    expect((await PUT(req("PUT", AUTH, DEFAULT_HOURS))).status).toBe(429);
  });

  it("returns 400 for invalid timezone", async () => {
    const res = await PUT(req("PUT", AUTH, { ...DEFAULT_HOURS, timezone: "Not/ATimezone" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for non-integer openHour", async () => {
    const res = await PUT(req("PUT", AUTH, { ...DEFAULT_HOURS, openHour: 8.5 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when openHour >= closeHour", async () => {
    const res = await PUT(req("PUT", AUTH, { ...DEFAULT_HOURS, openHour: 16, closeHour: 16 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when openHour is out of range", async () => {
    const res = await PUT(req("PUT", AUTH, { ...DEFAULT_HOURS, openHour: -1 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when closeHour is out of range", async () => {
    const res = await PUT(req("PUT", AUTH, { ...DEFAULT_HOURS, closeHour: 24 }));
    expect(res.status).toBe(400);
  });

  it("returns 200 with saved hours on success", async () => {
    const res = await PUT(req("PUT", AUTH, DEFAULT_HOURS));
    expect(res.status).toBe(200);
    expect(setOpeningHours).toHaveBeenCalledWith(DEFAULT_HOURS);
    expect(await res.json()).toEqual(DEFAULT_HOURS);
  });

  it("accepts a valid non-default timezone", async () => {
    const body = { timezone: "America/New_York", openHour: 9, closeHour: 17 };
    const res = await PUT(req("PUT", AUTH, body));
    expect(res.status).toBe(200);
  });
});
