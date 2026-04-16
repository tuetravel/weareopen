import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";
import { getOpeningHours, setOpeningHours } from "@/lib/storage";
import type { OpeningHours } from "@/lib/storage";

function isAuthorized(req: NextRequest): boolean {
  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) return false;
  const auth = req.headers.get("authorization");
  if (!auth) return false;
  const expected = `Bearer ${apiKey}`;
  if (auth.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
}

function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getOpeningHours());
}

export async function PUT(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { timezone?: unknown; openHour?: unknown; closeHour?: unknown; cacheTtlMinutes?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { timezone, openHour, closeHour, cacheTtlMinutes } = body;

  if (typeof timezone !== "string" || !isValidTimezone(timezone)) {
    return NextResponse.json(
      { error: "timezone must be a valid IANA timezone string" },
      { status: 400 }
    );
  }
  if (typeof openHour !== "number" || !Number.isInteger(openHour) || openHour < 0 || openHour > 23) {
    return NextResponse.json(
      { error: "openHour must be an integer between 0 and 23" },
      { status: 400 }
    );
  }
  if (typeof closeHour !== "number" || !Number.isInteger(closeHour) || closeHour < 0 || closeHour > 23) {
    return NextResponse.json(
      { error: "closeHour must be an integer between 0 and 23" },
      { status: 400 }
    );
  }
  if (openHour >= closeHour) {
    return NextResponse.json(
      { error: "openHour must be less than closeHour" },
      { status: 400 }
    );
  }
  if (typeof cacheTtlMinutes !== "number" || !Number.isInteger(cacheTtlMinutes) || cacheTtlMinutes < 0 || cacheTtlMinutes > 60) {
    return NextResponse.json(
      { error: "cacheTtlMinutes must be an integer between 0 and 60" },
      { status: 400 }
    );
  }

  const hours: OpeningHours = { timezone, openHour, closeHour, cacheTtlMinutes };
  try {
    await setOpeningHours(hours);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
  return NextResponse.json(hours);
}
