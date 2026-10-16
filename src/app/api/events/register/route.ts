import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, rollNumber, email, phone, eventId, eventTitle } = body;

    // Server-side validation
    if (!fullName || !rollNumber || !email || !phone || !eventId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields." },
        { status: 400 }
      );
    }

    // Generate authenticated reservation reference code
    const ticketId = `ACM-IARE-${Math.floor(100000 + Math.random() * 900000)}`;

    const { addRegistration } = await import("@/lib/events-store");
    await addRegistration({
      eventId,
      eventTitle: eventTitle || "ACM IARE Event",
      fullName,
      rollNumber,
      email,
      phone,
      department: body.department || "Computer Science & Engineering",
      yearOfStudy: body.yearOfStudy || "3rd Year (B.Tech)",
      acmId: body.acmMemberId || undefined,
    });

    return NextResponse.json({
      success: true,
      ticketId,
      message: `Registration successfully recorded for ${fullName} (${rollNumber}) for ${eventTitle}.`,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Server error processing registration request." },
      { status: 500 }
    );
  }
}
