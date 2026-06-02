import { NextRequest, NextResponse } from "next/server";
import { isOpenOnDate } from "@/lib/business-hours";

export const dynamic = "force-dynamic";

const ALLOWED_ORIGINS = new Set([
  "https://www.ase.dk",
  "https://www-test.ase.dk",
]);

function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "",
    "Access-Control-Allow-Methods": "GET",
  };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;

  if (!DATE_RE.test(date)) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD." },
      { status: 400, headers: corsHeaders(req) }
    );
  }

  const status = await isOpenOnDate(date);
  return NextResponse.json(status, { headers: corsHeaders(req) });
}

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}
