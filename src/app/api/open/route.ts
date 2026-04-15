import { NextResponse } from "next/server";
import { isOpen } from "@/lib/business-hours";

export async function GET() {
  const open = await isOpen();
  return NextResponse.json(open);
}
