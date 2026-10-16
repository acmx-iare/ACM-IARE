import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { issueCertificate } from "@/lib/certificate-generator";
import { CertificateType, IssuedCertificate } from "@/types";

/**
 * GET /api/admin/certificates
 * Lists issued certificates with search, filtering, and summary statistics
 */
export async function GET(request: NextRequest) {
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.toLowerCase().trim();

  try {
    let query = sql`
      SELECT 
        id, certificate_number, event_id, recipient_name, recipient_email,
        recipient_roll_number, recipient_department, event_title, event_date,
        certificate_type, status, revoked_at, revoked_reason,
        pdf_storage_key, pdf_file_size, qr_verification_url, issued_at, issued_by
      FROM issued_certificates
      WHERE 1=1
    `;

    if (eventId) {
      query = sql`${query} AND event_id = ${eventId}`;
    }
    if (status) {
      query = sql`${query} AND status = ${status}`;
    }
    if (search) {
      const searchPattern = `%${search}%`;
      query = sql`${query} AND (
        LOWER(recipient_name) LIKE ${searchPattern} OR
        LOWER(recipient_email) LIKE ${searchPattern} OR
        LOWER(certificate_number) LIKE ${searchPattern} OR
        LOWER(recipient_roll_number) LIKE ${searchPattern}
      )`;
    }

    query = sql`${query} ORDER BY issued_at DESC LIMIT 500;`;

    const rows = await query;

    // Aggregate stats
    const statsRows = await sql`
      SELECT 
        count(*) as total,
        count(*) FILTER (WHERE status = 'valid') as active,
        count(*) FILTER (WHERE status = 'revoked') as revoked
      FROM issued_certificates;
    `;

    return NextResponse.json({
      success: true,
      certificates: rows.map((r) => ({
        id: r.id,
        certificateNumber: r.certificate_number,
        eventId: r.event_id,
        recipientName: r.recipient_name,
        recipientEmail: r.recipient_email,
        recipientRollNumber: r.recipient_roll_number,
        recipientDepartment: r.recipient_department,
        eventTitle: r.event_title,
        eventDate: r.event_date,
        certificateType: r.certificate_type,
        status: r.status,
        revokedAt: r.revoked_at,
        revokedReason: r.revoked_reason,
        pdfStorageKey: r.pdf_storage_key,
        pdfFileSize: r.pdf_file_size,
        qrVerificationUrl: r.qr_verification_url,
        issuedAt: r.issued_at,
        issuedBy: r.issued_by,
      })),
      stats: {
        total: Number(statsRows[0]?.total || 0),
        active: Number(statsRows[0]?.active || 0),
        revoked: Number(statsRows[0]?.revoked || 0),
      },
    });
  } catch (err: unknown) {
    console.error("Fetch certificates error:", err);
    return NextResponse.json(
      { error: "Failed to fetch certificates from Neon" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/certificates
 * Generates and issues individual or bulk certificates with duplicate detection
 */
export async function POST(request: NextRequest) {
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      eventId,
      eventTitle,
      eventDate,
      templateId,
      certificateType = "participation",
      customBody,
      recipients, // Array of { name, email, rollNumber?, department? }
      preventDuplicates = true,
    } = body;

    if (!eventTitle || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: "Missing event title or recipients list." },
        { status: 400 }
      );
    }

    const issuedList: IssuedCertificate[] = [];
    const skippedList: Array<{ name: string; email: string; reason: string }> = [];
    const failedList: Array<{ recipient: unknown; error: string }> = [];

    for (const rec of recipients) {
      const email = (rec.email || "").trim().toLowerCase();
      const name = (rec.name || rec.fullName || "").trim();
      const rollNumber = (rec.rollNumber || "").trim();
      const department = (rec.department || "").trim();

      if (!name || !email) {
        failedList.push({ recipient: rec, error: "Missing name or email" });
        continue;
      }

      // Duplicate check: check if already has a valid certificate for this event
      if (preventDuplicates && eventId) {
        const existing = await sql`
          SELECT certificate_number FROM issued_certificates
          WHERE event_id = ${eventId} 
            AND LOWER(recipient_email) = ${email}
            AND status = 'valid'
          LIMIT 1;
        `;
        if (existing && existing.length > 0) {
          skippedList.push({
            name,
            email,
            reason: `Already issued certificate (${existing[0].certificate_number})`,
          });
          continue;
        }
      }

      try {
        const cert = await issueCertificate({
          recipientName: name,
          recipientEmail: email,
          recipientRollNumber: rollNumber || undefined,
          recipientDepartment: department || undefined,
          eventId: eventId || "general",
          eventTitle,
          eventDate,
          certificateType: certificateType as CertificateType,
          templateId: templateId || undefined,
          customBody: customBody || undefined,
          issuedBy: "admin",
        });

        issuedList.push(cert);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        failedList.push({ recipient: rec, error: msg });
      }
    }

    // Record in audit log
    await sql`
      INSERT INTO audit_logs (action, event_id, status, error_message)
      VALUES (
        'issue_certificates_batch',
        ${eventId || null},
        ${failedList.length === 0 ? "success" : "partial_success"},
        ${`Issued: ${issuedList.length}, Skipped: ${skippedList.length}, Failed: ${failedList.length}`}
      );
    `;

    return NextResponse.json({
      success: true,
      issuedCount: issuedList.length,
      skippedCount: skippedList.length,
      failedCount: failedList.length,
      issued: issuedList,
      skipped: skippedList,
      failed: failedList,
    });
  } catch (err: unknown) {
    console.error("Issue certificates API error:", err);
    return NextResponse.json(
      { error: "Failed to process certificate issuance." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/certificates
 * Revokes an issued certificate
 */
export async function PATCH(request: NextRequest) {
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { certificateNumber, reason } = await request.json();

    if (!certificateNumber) {
      return NextResponse.json(
        { error: "Certificate number is required" },
        { status: 400 }
      );
    }

    const updated = await sql`
      UPDATE issued_certificates
      SET 
        status = 'revoked',
        revoked_at = NOW(),
        revoked_reason = ${reason || "Revoked by Administrator"}
      WHERE certificate_number = ${certificateNumber}
      RETURNING *;
    `;

    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { error: "Certificate not found." },
        { status: 404 }
      );
    }

    // Log to audit table
    await sql`
      INSERT INTO audit_logs (action, event_id, status, error_message)
      VALUES (
        'revoke_certificate',
        ${updated[0].event_id || null},
        'success',
        ${`Revoked ${certificateNumber}. Reason: ${reason || "N/A"}`}
      );
    `;

    return NextResponse.json({
      success: true,
      certificate: updated[0],
      message: `Certificate ${certificateNumber} has been successfully revoked.`,
    });
  } catch (err: unknown) {
    console.error("Revoke certificate error:", err);
    return NextResponse.json(
      { error: "Failed to revoke certificate." },
      { status: 500 }
    );
  }
}
