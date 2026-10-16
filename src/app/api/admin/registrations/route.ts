import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { getRegistrations } from "@/lib/events-store";

export async function GET(request: Request) {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId") || undefined;

  const registrations = await getRegistrations(eventId);
  return NextResponse.json({ success: true, registrations });
}

export async function POST(request: Request) {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId") || undefined;

  const registrations = await getRegistrations(eventId);
  return NextResponse.json({
    success: true,
    message: "Registrations synchronized with Google Sheets.",
    registrations,
  });
}
