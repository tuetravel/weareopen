import { NextRequest, NextResponse } from "next/server";
import { removeClosingDay } from "@/lib/storage";

function isAuthorized(req: NextRequest): boolean {
  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) return false;
  return req.headers.get("x-api-key") === apiKey;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date } = await params;
  const removed = await removeClosingDay(date);

  if (!removed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
