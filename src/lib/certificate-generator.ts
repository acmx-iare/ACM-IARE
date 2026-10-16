import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { sql } from "./db";
import { uploadPrivateFile } from "./r2";
import { CertificateTemplate, IssuedCertificate, CertificateType } from "@/types";

export interface GenerateCertOptions {
  recipientName: string;
  recipientEmail: string;
  recipientRollNumber?: string;
  recipientDepartment?: string;
  eventId: string;
  eventTitle: string;
  eventDate?: string;
  certificateType?: CertificateType;
  templateId?: string;
  customBody?: string;
  signatories?: Array<{ name: string; role: string; title?: string }>;
  issuedBy?: string;
}

/**
 * Generates an alphanumeric secure credential ID
 */
export function generateCertificateNumber(prefix = "ACM-IARE-2026"): string {
  const randomChars = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${randomChars}`;
}

/**
 * Helper to split text into lines based on maximum character length
 */
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length > maxCharsPerLine) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + " " + word : word;
    }
  }
  if (currentLine) lines.push(currentLine.trim());
  return lines;
}

/**
 * Renders a high-resolution, professional PDF certificate buffer
 */
export async function renderCertificatePdf(params: {
  certificateNumber: string;
  recipientName: string;
  recipientRollNumber?: string;
  recipientDepartment?: string;
  eventTitle: string;
  eventDate?: string;
  certificateType: CertificateType;
  title?: string;
  subtitle?: string;
  bodyText: string;
  verificationUrl: string;
  signatories?: Array<{ name: string; role: string; title?: string }>;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // A4 Landscape: 841.89 x 595.28 points
  const pageWidth = 842;
  const pageHeight = 595;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Embed Fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Palette
  const darkNavy = rgb(15 / 255, 23 / 255, 42 / 255); // #0F172A
  const acmTeal = rgb(0 / 255, 131 / 255, 143 / 255); // #00838F
  const goldAccent = rgb(217 / 255, 119 / 255, 6 / 255); // #D97706
  const lightBg = rgb(250 / 255, 252 / 255, 254 / 255);
  const grayMuted = rgb(100 / 255, 116 / 255, 139 / 255);
  const lineGray = rgb(226 / 255, 232 / 255, 240 / 255);

  // 1. Background fill
  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: lightBg,
  });

  // 2. Multi-border framing
  // Outer border
  page.drawRectangle({
    x: 20,
    y: 20,
    width: pageWidth - 40,
    height: pageHeight - 40,
    borderColor: acmTeal,
    borderWidth: 3,
  });

  // Inner border
  page.drawRectangle({
    x: 28,
    y: 28,
    width: pageWidth - 56,
    height: pageHeight - 56,
    borderColor: goldAccent,
    borderWidth: 1,
  });

  // Corner decorative flourishes
  const cornerSize = 16;
  const corners = [
    { x: 28, y: pageHeight - 28 - cornerSize }, // top-left
    { x: pageWidth - 28 - cornerSize, y: pageHeight - 28 - cornerSize }, // top-right
    { x: 28, y: 28 }, // bottom-left
    { x: pageWidth - 28 - cornerSize, y: 28 }, // bottom-right
  ];
  for (const corner of corners) {
    page.drawRectangle({
      x: corner.x,
      y: corner.y,
      width: cornerSize,
      height: cornerSize,
      color: acmTeal,
    });
  }

  // 3. Embed Logo if present
  let logoEmbedded = false;
  try {
    const logoPathJpg = path.join(process.cwd(), "public", "images", "acm-iare-logo.jpg");
    if (fs.existsSync(logoPathJpg)) {
      const logoBytes = fs.readFileSync(logoPathJpg);
      const embeddedLogo = await pdfDoc.embedJpg(logoBytes);
      page.drawImage(embeddedLogo, {
        x: 45,
        y: pageHeight - 110,
        width: 65,
        height: 65,
      });
      logoEmbedded = true;
    }
  } catch (err) {
    console.warn("Logo embedding skipped:", err);
  }

  if (!logoEmbedded) {
    // Fallback badge
    page.drawCircle({
      x: 75,
      y: pageHeight - 80,
      size: 28,
      color: acmTeal,
    });
    page.drawText("ACM", {
      x: 62,
      y: pageHeight - 85,
      size: 11,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
  }

  // 4. Header Titles
  const headerMain = "ASSOCIATION FOR COMPUTING MACHINERY";
  const headerMainWidth = fontBold.widthOfTextAtSize(headerMain, 13);
  page.drawText(headerMain, {
    x: (pageWidth - headerMainWidth) / 2,
    y: pageHeight - 65,
    size: 13,
    font: fontBold,
    color: darkNavy,
  });

  const headerSub = "IARE STUDENT CHAPTER — INSTITUTE OF AERONAUTICAL ENGINEERING";
  const headerSubWidth = fontRegular.widthOfTextAtSize(headerSub, 9.5);
  page.drawText(headerSub, {
    x: (pageWidth - headerSubWidth) / 2,
    y: pageHeight - 80,
    size: 9.5,
    font: fontRegular,
    color: acmTeal,
  });

  const headerLoc = "Autonomous Institution | Approved by AICTE, Affiliated to JNTUH | Hyderabad, Telangana";
  const headerLocWidth = fontRegular.widthOfTextAtSize(headerLoc, 8);
  page.drawText(headerLoc, {
    x: (pageWidth - headerLocWidth) / 2,
    y: pageHeight - 93,
    size: 8,
    font: fontRegular,
    color: grayMuted,
  });

  // Divider Line
  page.drawLine({
    start: { x: 120, y: pageHeight - 105 },
    end: { x: pageWidth - 120, y: pageHeight - 105 },
    color: lineGray,
    thickness: 1,
  });

  // 5. Certificate Category / Title
  const certTitle = (params.title || (params.certificateType === "winner" ? "CERTIFICATE OF EXCELLENCE" : "CERTIFICATE OF PARTICIPATION")).toUpperCase();
  const certTitleWidth = fontBold.widthOfTextAtSize(certTitle, 22);
  page.drawText(certTitle, {
    x: (pageWidth - certTitleWidth) / 2,
    y: pageHeight - 145,
    size: 22,
    font: fontBold,
    color: params.certificateType === "winner" ? goldAccent : acmTeal,
  });

  // 6. Subtitle
  const subtitle = (params.subtitle || "PROUDLY PRESENTED TO").toUpperCase();
  const subtitleWidth = fontRegular.widthOfTextAtSize(subtitle, 10);
  page.drawText(subtitle, {
    x: (pageWidth - subtitleWidth) / 2,
    y: pageHeight - 170,
    size: 10,
    font: fontRegular,
    color: grayMuted,
  });

  // 7. Recipient Name
  const recipient = params.recipientName.toUpperCase();
  const recipientWidth = fontBold.widthOfTextAtSize(recipient, 25);
  page.drawText(recipient, {
    x: (pageWidth - recipientWidth) / 2,
    y: pageHeight - 210,
    size: 25,
    font: fontBold,
    color: darkNavy,
  });

  // Underline for recipient name
  const underlineWidth = Math.min(Math.max(recipientWidth + 40, 240), pageWidth - 200);
  page.drawLine({
    start: { x: (pageWidth - underlineWidth) / 2, y: pageHeight - 218 },
    end: { x: (pageWidth + underlineWidth) / 2, y: pageHeight - 218 },
    color: goldAccent,
    thickness: 1.5,
  });

  // Optional Department / Roll Number
  let detailsText = "";
  if (params.recipientRollNumber && params.recipientDepartment) {
    detailsText = `Roll No: ${params.recipientRollNumber}  •  Dept: ${params.recipientDepartment}`;
  } else if (params.recipientRollNumber) {
    detailsText = `Roll No: ${params.recipientRollNumber}`;
  } else if (params.recipientDepartment) {
    detailsText = `Department of ${params.recipientDepartment}`;
  }

  if (detailsText) {
    const detailsWidth = fontRegular.widthOfTextAtSize(detailsText, 10);
    page.drawText(detailsText, {
      x: (pageWidth - detailsWidth) / 2,
      y: pageHeight - 235,
      size: 10,
      font: fontRegular,
      color: grayMuted,
    });
  }

  // 8. Body Text
  const bodyYStart = detailsText ? pageHeight - 275 : pageHeight - 265;
  const wrappedLines = wrapText(params.bodyText, 85);
  wrappedLines.forEach((line, idx) => {
    const lineWidth = fontRegular.widthOfTextAtSize(line, 11);
    page.drawText(line, {
      x: (pageWidth - lineWidth) / 2,
      y: bodyYStart - idx * 17,
      size: 11,
      font: fontRegular,
      color: darkNavy,
    });
  });

  // 9. QR Code generation & embedding
  try {
    const qrBuffer = await QRCode.toBuffer(params.verificationUrl, {
      width: 160,
      margin: 1,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    });
    const qrImage = await pdfDoc.embedPng(qrBuffer);
    const qrSize = 65;
    const qrX = pageWidth / 2 - qrSize / 2;
    const qrY = 75;

    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    });

    const qrLabel = "Scan to verify validity";
    const qrLabelWidth = fontRegular.widthOfTextAtSize(qrLabel, 7.5);
    page.drawText(qrLabel, {
      x: (pageWidth - qrLabelWidth) / 2,
      y: qrY - 10,
      size: 7.5,
      font: fontRegular,
      color: grayMuted,
    });
  } catch (err) {
    console.warn("QR code generation notice:", err);
  }

  // 10. Signatories
  const signatories = params.signatories && params.signatories.length > 0
    ? params.signatories
    : [
        { name: "Dr. K. Srinivasa Rao", role: "Faculty Sponsor", title: "Prof. & HOD, CSE" },
        { name: "Faculty Coordinator", role: "Branch Counselor", title: "ACM IARE Chapter" },
      ];

  // Left Signatory
  const sigLeft = signatories[0];
  if (sigLeft) {
    const leftX = 130;
    const leftY = 90;
    page.drawLine({
      start: { x: leftX - 60, y: leftY },
      end: { x: leftX + 80, y: leftY },
      color: lineGray,
      thickness: 1,
    });
    page.drawText(sigLeft.name, {
      x: leftX - 50,
      y: leftY - 14,
      size: 10,
      font: fontBold,
      color: darkNavy,
    });
    page.drawText(sigLeft.role, {
      x: leftX - 50,
      y: leftY - 26,
      size: 8.5,
      font: fontRegular,
      color: grayMuted,
    });
    if (sigLeft.title) {
      page.drawText(sigLeft.title, {
        x: leftX - 50,
        y: leftY - 37,
        size: 7.5,
        font: fontOblique,
        color: grayMuted,
      });
    }
  }

  // Right Signatory
  const sigRight = signatories[1] || signatories[0];
  if (sigRight) {
    const rightX = pageWidth - 160;
    const rightY = 90;
    page.drawLine({
      start: { x: rightX - 60, y: rightY },
      end: { x: rightX + 80, y: rightY },
      color: lineGray,
      thickness: 1,
    });
    page.drawText(sigRight.name, {
      x: rightX - 50,
      y: rightY - 14,
      size: 10,
      font: fontBold,
      color: darkNavy,
    });
    page.drawText(sigRight.role, {
      x: rightX - 50,
      y: rightY - 26,
      size: 8.5,
      font: fontRegular,
      color: grayMuted,
    });
    if (sigRight.title) {
      page.drawText(sigRight.title, {
        x: rightX - 50,
        y: rightY - 37,
        size: 7.5,
        font: fontOblique,
        color: grayMuted,
      });
    }
  }

  // 11. Footer Credential Reference
  const certIdText = `Credential ID: ${params.certificateNumber}`;
  page.drawText(certIdText, {
    x: 45,
    y: 36,
    size: 8,
    font: fontRegular,
    color: grayMuted,
  });

  const verifiedLabel = "ACM IARE Accredited Digital Credential";
  const verifiedLabelWidth = fontRegular.widthOfTextAtSize(verifiedLabel, 8);
  page.drawText(verifiedLabel, {
    x: pageWidth - 45 - verifiedLabelWidth,
    y: 36,
    size: 8,
    font: fontRegular,
    color: acmTeal,
  });

  return await pdfDoc.save();
}

/**
 * End-to-end issuance of a certificate:
 * - Generates ID & QR verification link
 * - Creates PDF
 * - Saves PDF buffer to Cloudflare R2
 * - Saves record to Neon PostgreSQL
 */
export async function issueCertificate(options: GenerateCertOptions): Promise<IssuedCertificate> {
  const certificateNumber = generateCertificateNumber();
  const certType = options.certificateType || "participation";

  // Construct public verification URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://acm-iare.pages.dev";
  const verificationUrl = `${baseUrl.replace(/\/$/, "")}/verify/${certificateNumber}`;

  // Fetch template if provided
  let template: CertificateTemplate | null = null;
  if (options.templateId) {
    const rows = await sql`SELECT * FROM certificate_templates WHERE id = ${options.templateId} LIMIT 1`;
    if (rows && rows.length > 0) {
      const r = rows[0];
      template = {
        id: r.id,
        name: r.name,
        type: r.type,
        title: r.title,
        subtitle: r.subtitle,
        bodyTemplate: r.body_template,
        issuerOrganization: r.issuer_organization,
        signatories: r.signatories || [],
        branding: r.branding || {},
        layout: r.layout || {},
        isActive: r.is_active,
      };
    }
  }

  // Prepare body text with variable replacement
  let bodyText = options.customBody || "";
  if (!bodyText) {
    if (template?.bodyTemplate) {
      bodyText = template.bodyTemplate
        .replace(/{{event_title}}/g, options.eventTitle)
        .replace(/{{recipient_name}}/g, options.recipientName)
        .replace(/{{event_date}}/g, options.eventDate || "");
    } else {
      bodyText = `has successfully participated in the technical event "${options.eventTitle}" organized by the ACM Student Chapter, Institute of Aeronautical Engineering (IARE), Dundigal, Hyderabad.`;
    }
  }

  // Render the PDF
  const pdfBytes = await renderCertificatePdf({
    certificateNumber,
    recipientName: options.recipientName,
    recipientRollNumber: options.recipientRollNumber,
    recipientDepartment: options.recipientDepartment,
    eventTitle: options.eventTitle,
    eventDate: options.eventDate,
    certificateType: certType,
    title: template?.title,
    subtitle: template?.subtitle,
    bodyText,
    verificationUrl,
    signatories: options.signatories || template?.signatories,
  });

  // Storage key in private R2 bucket: certificates/{eventId}/{certificateNumber}.pdf
  const storageKey = `certificates/${options.eventId || "general"}/${certificateNumber}.pdf`;

  // Upload to Cloudflare R2
  await uploadPrivateFile(
    Buffer.from(pdfBytes),
    storageKey,
    "application/pdf",
    {
      fileName: `${certificateNumber}.pdf`,
      category: "certificates",
      entityType: "certificate",
      entityId: certificateNumber,
    }
  );

  // Store metadata in Neon PostgreSQL
  const certRecordId = `cert_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  const now = new Date().toISOString();

  await sql`
    INSERT INTO issued_certificates (
      id, certificate_number, event_id, template_id,
      recipient_name, recipient_email, recipient_roll_number, recipient_department,
      event_title, event_date, certificate_type, status,
      pdf_storage_key, pdf_file_size, qr_verification_url, issued_at, issued_by
    ) VALUES (
      ${certRecordId},
      ${certificateNumber},
      ${options.eventId || null},
      ${options.templateId || null},
      ${options.recipientName},
      ${options.recipientEmail.toLowerCase()},
      ${options.recipientRollNumber || null},
      ${options.recipientDepartment || null},
      ${options.eventTitle},
      ${options.eventDate || null},
      ${certType},
      'valid',
      ${storageKey},
      ${pdfBytes.length},
      ${verificationUrl},
      NOW(),
      ${options.issuedBy || "admin"}
    );
  `;

  return {
    id: certRecordId,
    certificateNumber,
    eventId: options.eventId,
    templateId: options.templateId,
    recipientName: options.recipientName,
    recipientEmail: options.recipientEmail,
    recipientRollNumber: options.recipientRollNumber,
    recipientDepartment: options.recipientDepartment,
    eventTitle: options.eventTitle,
    eventDate: options.eventDate,
    certificateType: certType,
    status: "valid",
    revokedAt: null,
    revokedReason: null,
    pdfStorageKey: storageKey,
    pdfFileSize: pdfBytes.length,
    qrVerificationUrl: verificationUrl,
    issuedAt: now,
    issuedBy: options.issuedBy || "admin",
  };
}
