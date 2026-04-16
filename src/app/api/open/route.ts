import { NextResponse } from "next/server";
import { isOpen } from "@/lib/business-hours";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await isOpen();
  return NextResponse.json(status);
}
