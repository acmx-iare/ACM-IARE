import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { getPresignedDownloadUrl, getFileBuffer } from "@/lib/r2";

/**
 * GET /api/admin/certificates/download?certificateNumber=...&stream=true
 * Secure, authenticated download for private certificates stored in Cloudflare R2
 */
export async function GET(request: NextRequest) {
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized. Admin privileges required to download private credentials." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const certNumber = searchParams.get("certificateNumber");
  const streamDirect = searchParams.get("stream") === "true";

  if (!certNumber) {
    return NextResponse.json(
      { error: "Missing certificateNumber parameter." },
      { status: 400 }
    );
  }

  try {
    const rows = await sql`
      SELECT 
        certificate_number, 
        pdf_storage_key, 
        recipient_name, 
        event_title 
      FROM issued_certificates 
      WHERE certificate_number = ${certNumber} 
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
    }

    const cert = rows[0];
    const filename = `${cert.recipient_name.replace(/[^a-zA-Z0-9_-]/g, "_")}_${cert.certificate_number}.pdf`;

    if (streamDirect) {
      // Direct authenticated buffer stream
      const { buffer, contentType } = await getFileBuffer(cert.pdf_storage_key);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": contentType || "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // 5-minute secure presigned URL
    const presignedUrl = await getPresignedDownloadUrl(
      cert.pdf_storage_key,
      300, // 5 minutes validity
      filename
    );

    return NextResponse.json({
      success: true,
      downloadUrl: presignedUrl,
      filename,
      expiresInSeconds: 300,
    });
  } catch (err: unknown) {
    console.error("Certificate download error:", err);
    return NextResponse.json(
      { error: "Failed to generate secure download." },
      { status: 500 }
    );
  }
}
