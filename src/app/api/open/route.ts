import { NextRequest, NextResponse } from "next/server";
import { isOpen } from "@/lib/business-hours";

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

export async function GET(req: NextRequest) {
  const status = await isOpen();
  return NextResponse.json(status, { headers: corsHeaders(req) });
}

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}
