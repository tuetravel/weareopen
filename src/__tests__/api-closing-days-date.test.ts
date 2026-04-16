import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/rate-limit", () => ({ isRateLimited: vi.fn().mockReturnValue(false) }));
vi.mock("@/lib/storage", () => ({
  removeClosingDay: vi.fn(),
}));

import { NextRequest } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";
import { removeClosingDay } from "@/lib/storage";
import { DELETE } from "@/app/api/admin/closing-days/[date]/route";

const API_KEY = "test-secret";
const AUTH = { Authorization: `Bearer ${API_KEY}` };

function req(date: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost/api/admin/closing-days/${date}`, {
    method: "DELETE",
    headers,
  });
}

function params(date: string) {
  return { params: Promise.resolve({ date }) };
}

describe("DELETE /api/admin/closing-days/[date]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_API_KEY = API_KEY;
    vi.mocked(isRateLimited).mockReturnValue(false);
  });

  it("returns 401 without auth", async () => {
    const res = await DELETE(req("2026-03-01"), params("2026-03-01"));
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong key", async () => {
    const res = await DELETE(
      req("2026-03-01", { Authorization: "Bearer wrong" }),
      params("2026-03-01")
    );
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(isRateLimited).mockReturnValue(true);
    const res = await DELETE(req("2026-03-01", AUTH), params("2026-03-01"));
    expect(res.status).toBe(429);
  });

  it("returns 404 when date not found", async () => {
    vi.mocked(removeClosingDay).mockResolvedValue(false);
    const res = await DELETE(req("2026-03-01", AUTH), params("2026-03-01"));
    expect(res.status).toBe(404);
  });

  it("returns 200 and removes the day on success", async () => {
    vi.mocked(removeClosingDay).mockResolvedValue(true);
    const res = await DELETE(req("2026-03-01", AUTH), params("2026-03-01"));
    expect(res.status).toBe(200);
    expect(removeClosingDay).toHaveBeenCalledWith("2026-03-01");
  });
});
