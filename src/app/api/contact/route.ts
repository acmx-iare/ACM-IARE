import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, subject, message, role, honeypot } = body;

    // Anti-spam check: if hidden honeypot is populated, reject silently
    if (honeypot) {
      return NextResponse.json({ success: true, message: "Message received." });
    }

    // Server-side validation
    if (!fullName || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, message: "Please fill out all required fields." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const referenceId = `INQ-${Math.floor(100000 + Math.random() * 900000)}`;

    return NextResponse.json({
      success: true,
      referenceId,
      message: `Thank you, ${fullName} (${role}). Your inquiry regarding "${subject}" has been submitted to the chapter desk.`,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Server error processing inquiry." },
      { status: 500 }
    );
  }
}
