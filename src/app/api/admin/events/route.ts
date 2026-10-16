import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { getAllEvents, createEvent } from "@/lib/events-store";

export async function GET() {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const events = await getAllEvents(true); // include archived for admin
  return NextResponse.json({ success: true, events });
}

export async function POST(request: Request) {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ success: false, error: "Event title is mandatory." }, { status: 400 });
    }

    if (!body.description || !body.description.trim()) {
      return NextResponse.json({ success: false, error: "Event description is mandatory." }, { status: 400 });
    }

    const result = await createEvent(body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
