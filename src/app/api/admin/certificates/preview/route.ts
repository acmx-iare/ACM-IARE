import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { renderCertificatePdf } from "@/lib/certificate-generator";
import { CertificateType } from "@/types";

/**
 * POST /api/admin/certificates/preview
 * Generates an in-memory PDF preview for admin design customization
 */
export async function POST(request: NextRequest) {
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      templateId,
      title = "Certificate of Participation",
      subtitle = "This is proudly presented to",
      bodyText,
      recipientName = "K. SAI HARSHA",
      recipientRollNumber = "23951A0501",
      recipientDepartment = "Computer Science and Engineering",
      eventTitle = "ACM Web & Cloud Architecture Summit 2026",
      eventDate = "October 24, 2026",
      certificateType = "participation",
      signatories,
    } = body;

    let resolvedBody = bodyText;
    let resolvedTitle = title;
    let resolvedSubtitle = subtitle;
    let resolvedSignatories = signatories;

    if (templateId) {
      const rows = await sql`SELECT * FROM certificate_templates WHERE id = ${templateId} LIMIT 1`;
      if (rows && rows.length > 0) {
        const tmpl = rows[0];
        resolvedTitle = tmpl.title || resolvedTitle;
        resolvedSubtitle = tmpl.subtitle || resolvedSubtitle;
        resolvedBody = (tmpl.body_template || "")
          .replace(/{{event_title}}/g, eventTitle)
          .replace(/{{recipient_name}}/g, recipientName)
          .replace(/{{event_date}}/g, eventDate);
        if (!resolvedSignatories || resolvedSignatories.length === 0) {
          resolvedSignatories = tmpl.signatories;
        }
      }
    }

    if (!resolvedBody) {
      resolvedBody = `has successfully participated in the technical event "${eventTitle}" organized by the ACM Student Chapter, Institute of Aeronautical Engineering (IARE), Dundigal, Hyderabad on ${eventDate}.`;
    }

    const previewPdfBytes = await renderCertificatePdf({
      certificateNumber: "ACM-IARE-PREVIEW-SAMPLE",
      recipientName,
      recipientRollNumber,
      recipientDepartment,
      eventTitle,
      eventDate,
      certificateType: certificateType as CertificateType,
      title: resolvedTitle,
      subtitle: resolvedSubtitle,
      bodyText: resolvedBody,
      verificationUrl: "https://acm-iare.pages.dev/verify/ACM-IARE-PREVIEW-SAMPLE",
      signatories: resolvedSignatories,
    });

    const base64Pdf = Buffer.from(previewPdfBytes).toString("base64");
    const dataUri = `data:application/pdf;base64,${base64Pdf}`;

    return NextResponse.json({
      success: true,
      dataUri,
    });
  } catch (err: unknown) {
    console.error("Preview generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate certificate preview" },
      { status: 500 }
    );
  }
}
