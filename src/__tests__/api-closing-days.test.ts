import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/rate-limit", () => ({ isRateLimited: vi.fn().mockReturnValue(false) }));
vi.mock("@/lib/storage", () => ({
  getClosingDays: vi.fn(),
  addClosingDay: vi.fn(),
}));

import { NextRequest } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";
import { addClosingDay, getClosingDays } from "@/lib/storage";
import { GET, POST } from "@/app/api/admin/closing-days/route";

const API_KEY = "test-secret";
const AUTH = { Authorization: `Bearer ${API_KEY}` };

function req(method: string, headers: Record<string, string> = {}, body?: unknown) {
  return new NextRequest("http://localhost/api/admin/closing-days", {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/admin/closing-days", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = API_KEY;
    vi.mocked(isRateLimited).mockReturnValue(false);
    vi.mocked(getClosingDays).mockResolvedValue([]);
  });

  it("returns 401 without Authorization header", async () => {
    const res = await GET(req("GET"));
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong API key", async () => {
    const res = await GET(req("GET", { Authorization: "Bearer wrong" }));
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(isRateLimited).mockReturnValue(true);
    const res = await GET(req("GET", AUTH));
    expect(res.status).toBe(429);
  });

  it("returns closing days on success", async () => {
    const days = [{ date: "2026-03-01" }];
    vi.mocked(getClosingDays).mockResolvedValue(days);
    const res = await GET(req("GET", AUTH));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(days);
  });
});

describe("POST /api/admin/closing-days", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = API_KEY;
    vi.mocked(isRateLimited).mockReturnValue(false);
    vi.mocked(addClosingDay).mockResolvedValue(undefined);
  });

  it("returns 401 without auth", async () => {
    const res = await POST(req("POST", {}, { date: "2026-03-01" }));
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(isRateLimited).mockReturnValue(true);
    const res = await POST(req("POST", AUTH, { date: "2026-03-01" }));
    expect(res.status).toBe(429);
  });

  it("returns 400 for missing date", async () => {
    const res = await POST(req("POST", AUTH, { reason: "No date" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid date format", async () => {
    const res = await POST(req("POST", AUTH, { date: "01-03-2026" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when reason exceeds 500 chars", async () => {
    const res = await POST(req("POST", AUTH, { date: "2026-03-01", reason: "x".repeat(501) }));
    expect(res.status).toBe(400);
  });

  it("returns 201 and calls addClosingDay on success", async () => {
    const res = await POST(req("POST", AUTH, { date: "2026-03-01", reason: "Offsite" }));
    expect(res.status).toBe(201);
    expect(addClosingDay).toHaveBeenCalledWith("2026-03-01", "Offsite");
  });

  it("accepts a date without reason", async () => {
    const res = await POST(req("POST", AUTH, { date: "2026-03-01" }));
    expect(res.status).toBe(201);
  });
});
