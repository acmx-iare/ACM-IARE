import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName,
      rollNumber,
      email,
      phone,
      department,
      yearOfStudy,
      section,
      acmId,
      interests,
      statementOfPurpose,
      honeypot,
    } = body;

    // Anti-spam check
    if (honeypot) {
      return NextResponse.json({ success: true, message: "Application received." });
    }

    // Required fields check
    if (!fullName || !rollNumber || !email || !phone || !department || !yearOfStudy) {
      return NextResponse.json(
        { success: false, message: "Please complete all mandatory application fields." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const applicationId = `ACM-APP-${Math.floor(100000 + Math.random() * 900000)}`;

    return NextResponse.json({
      success: true,
      applicationId,
      interestsCount: interests?.length || 0,
      details: { section, acmId: acmId || "N/A", hasSop: Boolean(statementOfPurpose) },
      message: `Membership application successfully logged for ${fullName} (${rollNumber}, Section ${section}).`,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Server error processing membership application." },
      { status: 500 }
    );
  }
}
