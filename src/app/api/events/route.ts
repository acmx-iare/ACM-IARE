import { NextResponse } from "next/server";
import { getAllEvents } from "@/lib/events-store";

export async function GET() {
  const events = await getAllEvents(false);
  return NextResponse.json({ success: true, events });
}
