import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("isRateLimited", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit", async () => {
    const { isRateLimited } = await import("@/lib/rate-limit");
    for (let i = 0; i < 10; i++) {
      expect(isRateLimited("1.1.1.1")).toBe(false);
    }
  });

  it("blocks on the 11th request within the window", async () => {
    const { isRateLimited } = await import("@/lib/rate-limit");
    for (let i = 0; i < 10; i++) isRateLimited("2.2.2.2");
    expect(isRateLimited("2.2.2.2")).toBe(true);
  });

  it("allows again after the window expires", async () => {
    const { isRateLimited } = await import("@/lib/rate-limit");
    for (let i = 0; i < 10; i++) isRateLimited("3.3.3.3");
    vi.advanceTimersByTime(61_000);
    expect(isRateLimited("3.3.3.3")).toBe(false);
  });

  it("tracks IPs independently", async () => {
    const { isRateLimited } = await import("@/lib/rate-limit");
    for (let i = 0; i < 10; i++) isRateLimited("4.4.4.4");
    expect(isRateLimited("5.5.5.5")).toBe(false);
  });
});
