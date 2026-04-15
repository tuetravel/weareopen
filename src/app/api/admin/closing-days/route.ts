import { NextRequest, NextResponse } from "next/server";
import { getClosingDays, addClosingDay } from "@/lib/storage";

function isAuthorized(req: NextRequest): boolean {
  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) return false;
  return req.headers.get("x-api-key") === apiKey;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getClosingDays());
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { date?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { date, reason } = body;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "date is required and must be in YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  await addClosingDay(date, reason);
  return NextResponse.json({ ok: true }, { status: 201 });
}
