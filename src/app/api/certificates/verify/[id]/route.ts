import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // 1. Rate limiting check per client IP
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

  const rateLimit = checkRateLimit(`verify_${ip}`, 30, 60000);
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        status: "rate_limited",
        message: "Too many verification requests. Please try again in a minute.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
        },
      }
    );
  }

  try {
    const { id } = await context.params;
    const certNumber = decodeURIComponent(id || "").trim();

    if (!certNumber || certNumber.length < 5 || certNumber.length > 50) {
      return NextResponse.json(
        { status: "not_found", message: "Invalid certificate identifier." },
        { status: 404 }
      );
    }

    // Query Neon PostgreSQL
    const rows = await sql`
      SELECT 
        certificate_number,
        recipient_name,
        event_title,
        event_date,
        certificate_type,
        status,
        revoked_at,
        revoked_reason,
        issued_at
      FROM issued_certificates
      WHERE certificate_number = ${certNumber}
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        {
          status: "not_found",
          message: "No credential matching this ID was found in the ACM IARE registry.",
        },
        { status: 404 }
      );
    }

    const cert = rows[0];

    // If revoked, display clear revoked status without exposing private details
    if (cert.status === "revoked") {
      return NextResponse.json({
        status: "revoked",
        certificate: {
          certificateNumber: cert.certificate_number,
          recipientName: cert.recipient_name,
          eventTitle: cert.event_title,
          eventDate: cert.event_date,
          certificateType: cert.certificate_type,
          issuedAt: cert.issued_at,
          revokedAt: cert.revoked_at,
          revokedReason: cert.revoked_reason || "Revoked by Chapter Administrator",
          issuerOrganization: "ACM Student Chapter, Institute of Aeronautical Engineering (IARE)",
        },
        message: "This certificate was revoked and is no longer valid.",
      });
    }

    // Valid certificate
    return NextResponse.json({
      status: "valid",
      certificate: {
        certificateNumber: cert.certificate_number,
        recipientName: cert.recipient_name,
        eventTitle: cert.event_title,
        eventDate: cert.event_date,
        certificateType: cert.certificate_type,
        issuedAt: cert.issued_at,
        issuerOrganization: "ACM Student Chapter, Institute of Aeronautical Engineering (IARE)",
      },
      message: "Certificate verified as authentic and active.",
    });
  } catch (err: unknown) {
    console.error("Certificate verification query error:", err);
    return NextResponse.json(
      { status: "error", message: "Unable to verify credential at this moment." },
      { status: 500 }
    );
  }
}
