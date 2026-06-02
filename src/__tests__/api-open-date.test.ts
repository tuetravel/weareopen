import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/business-hours", () => ({
  isOpenOnDate: vi.fn(),
}));

import { NextRequest } from "next/server";
import { isOpenOnDate } from "@/lib/business-hours";
import { GET } from "@/app/api/open/[date]/route";

function req(date: string) {
  return new NextRequest(`http://localhost/api/open/${date}`);
}

function params(date: string) {
  return { params: Promise.resolve({ date }) };
}

describe("GET /api/open/[date]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid date format", async () => {
    const res = await GET(req("not-a-date"), params("not-a-date"));
    expect(res.status).toBe(400);
  });

  it("returns open status for a valid date", async () => {
    vi.mocked(isOpenOnDate).mockResolvedValue({ open: true });
    const res = await GET(req("2026-06-03"), params("2026-06-03"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ open: true });
    expect(isOpenOnDate).toHaveBeenCalledWith("2026-06-03");
  });

  it("returns closed status with reason", async () => {
    vi.mocked(isOpenOnDate).mockResolvedValue({ open: false, reason: "weekend" });
    const res = await GET(req("2026-06-06"), params("2026-06-06"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ open: false, reason: "weekend" });
  });
});
