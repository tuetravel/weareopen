import { NextResponse } from "next/server";
import { isOpen } from "@/lib/business-hours";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://www.ase.dk",
  "Access-Control-Allow-Methods": "GET",
};

export async function GET() {
  const status = await isOpen();
  return NextResponse.json(status, { headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
