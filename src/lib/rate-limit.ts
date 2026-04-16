const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 10;

// ip → timestamps of requests within the current window
const store = new Map<string, number[]>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (store.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS) return true;
  timestamps.push(now);
  store.set(ip, timestamps);
  return false;
}
