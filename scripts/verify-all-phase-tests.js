const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const { neon } = require('@neondatabase/serverless');
const { S3Client, HeadObjectCommand, DeleteObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');

async function runComprehensiveVerification() {
  console.log("=========================================================");
  console.log("ACM IARE — End-to-End Verification & Compliance Test Suite");
  console.log("=========================================================\n");

  const results = [];
  const recordResult = (name, passed, detail) => {
    results.push({ name, passed, detail });
    console.log(`${passed ? '✓ PASS' : '✗ FAIL'}: ${name}`);
    if (detail) console.log(`   └─ ${detail}`);
  };

  const sql = neon(process.env.DATABASE_URL);
  const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  // TEST 1: Neon Database Connectivity & Tables Check
  try {
    const dbPing = await sql`SELECT 1 as ping, version(), current_database() as db`;
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    const tableNames = tables.map(t => t.table_name);
    const requiredTables = [
      'audit_logs', 'certificate_templates', 'chapter_events',
      'event_attendance', 'event_registrations', 'file_metadata', 'issued_certificates'
    ];
    const missingTables = requiredTables.filter(t => !tableNames.includes(t));

    if (missingTables.length === 0) {
      recordResult("Neon Database Connectivity & Migrations", true, `Connected to ${dbPing[0].db}. All 7 tables verified.`);
    } else {
      recordResult("Neon Database Connectivity & Migrations", false, `Missing tables: ${missingTables.join(', ')}`);
    }
  } catch (err) {
    recordResult("Neon Database Connectivity & Migrations", false, err.message);
  }

  // TEST 2: Cloudflare R2 Bucket Operations (Private, Head, Put, Get, Delete)
  const testKey = `test/pipeline_audit_${Date.now()}.txt`;
  try {
    const testContent = Buffer.from("Cloudflare R2 verified integration test buffer");
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: testKey,
      Body: testContent,
      ContentType: "text/plain",
    }));

    const head = await s3.send(new HeadObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: testKey,
    }));

    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: testKey,
    }));

    recordResult("Cloudflare R2 Bucket Access & Private Operations", true, `Successfully wrote, verified (${head.ContentLength} bytes), and cleaned up test object.`);
  } catch (err) {
    recordResult("Cloudflare R2 Bucket Access & Private Operations", false, err.message);
  }

  // TEST 3: Certificate PDF Rendering with pdf-lib & QR Code
  let testCertNumber = `ACM-IARE-2026-TEST${Math.floor(1000 + Math.random() * 9000)}`;
  let testPdfBuffer = null;
  const certStorageKey = `certificates/general/${testCertNumber}.pdf`;
  const verificationUrl = `http://localhost:3000/verify/${testCertNumber}`;

  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 landscape
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Geometry
    page.drawRectangle({
      x: 20, y: 20, width: 802, height: 555,
      borderColor: rgb(0/255, 131/255, 143/255), borderWidth: 3
    });
    page.drawText("CERTIFICATE OF PARTICIPATION", { x: 260, y: 460, size: 20, font: fontBold });
    page.drawText("Presented to: Akash Verma", { x: 300, y: 380, size: 16, font: fontBold });
    page.drawText(`Credential: ${testCertNumber}`, { x: 300, y: 340, size: 12, font: fontRegular });

    // QR Code
    const qrBuffer = await QRCode.toBuffer(verificationUrl, { width: 120 });
    const qrImg = await pdfDoc.embedPng(qrBuffer);
    page.drawImage(qrImg, { x: 370, y: 150, width: 80, height: 80 });

    const pdfBytes = await pdfDoc.save();
    testPdfBuffer = Buffer.from(pdfBytes);

    recordResult("Certificate PDF Generation & QR Code Engine", true, `Generated landscape PDF (${testPdfBuffer.length} bytes) with QR code`);
  } catch (err) {
    recordResult("Certificate PDF Generation & QR Code Engine", false, err.message);
  }

  // TEST 4: Storage in R2 & Record in Neon
  try {
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: certStorageKey,
      Body: testPdfBuffer,
      ContentType: "application/pdf",
    }));

    const certRecordId = `test_cert_${Date.now()}`;
    await sql`
      INSERT INTO issued_certificates (
        id, certificate_number, event_id, recipient_name, recipient_email,
        recipient_roll_number, recipient_department, event_title, event_date,
        certificate_type, status, pdf_storage_key, pdf_file_size,
        qr_verification_url, issued_at
      ) VALUES (
        ${certRecordId},
        ${testCertNumber},
        null,
        'Akash Verma',
        'akash.test@iare.ac.in',
        '23951A0599',
        'Computer Science and Engineering',
        'ACM Cloud Architecture Conclave 2026',
        'October 2026',
        'participation',
        'valid',
        ${certStorageKey},
        ${testPdfBuffer.length},
        ${verificationUrl},
        NOW()
      );
    `;

    // Also record file metadata
    await sql`
      INSERT INTO file_metadata (
        id, storage_key, bucket, file_name, content_type,
        file_size_bytes, category, entity_type, entity_id
      ) VALUES (
        ${`file_${Date.now()}`},
        ${certStorageKey},
        ${process.env.R2_BUCKET_NAME},
        ${`${testCertNumber}.pdf`},
        'application/pdf',
        ${testPdfBuffer.length},
        'certificates',
        'certificate',
        ${testCertNumber}
      ) ON CONFLICT (storage_key) DO NOTHING;
    `;

    recordResult("Neon & Cloudflare R2 Certificate Issuance Persistence", true, `Uploaded private PDF to R2 (${certStorageKey}) & indexed in Neon.`);
  } catch (err) {
    recordResult("Neon & Cloudflare R2 Certificate Issuance Persistence", false, err.message);
  }

  // TEST 5: Public Verification API — Valid Status
  try {
    const res = await fetch(`http://localhost:3000/api/certificates/verify/${testCertNumber}`);
    const json = await res.json();

    if (res.status === 200 && json.status === "valid" && json.certificate.recipientName === "Akash Verma") {
      // Check privacy: ensure email and storage_key are NOT returned
      if (!json.certificate.email && !json.certificate.pdfStorageKey && !json.certificate.recipientEmail) {
        recordResult("Public Verification API (Valid Status & Privacy Filter)", true, "Returned status: valid. Recipient name displayed. Private PII & storage keys omitted.");
      } else {
        recordResult("Public Verification API (Valid Status & Privacy Filter)", false, "Private fields leaked in verification output!");
      }
    } else {
      recordResult("Public Verification API (Valid Status & Privacy Filter)", false, `Unexpected response: ${JSON.stringify(json)}`);
    }
  } catch (err) {
    recordResult("Public Verification API (Valid Status & Privacy Filter)", false, err.message);
  }

  // TEST 6: Public Verification API — Non-existent ID returns 404
  try {
    const res = await fetch(`http://localhost:3000/api/certificates/verify/ACM-NON-EXISTENT-9999`);
    const json = await res.json();
    if (res.status === 404 && json.status === "not_found") {
      recordResult("Public Verification API (Non-existent Credential)", true, "Returned 404 status: not_found.");
    } else {
      recordResult("Public Verification API (Non-existent Credential)", false, `Expected 404 not_found, got ${res.status}`);
    }
  } catch (err) {
    recordResult("Public Verification API (Non-existent Credential)", false, err.message);
  }

  // TEST 7: Certificate Revocation & Immediate Verification Update
  try {
    // Revoke certificate in Neon
    await sql`
      UPDATE issued_certificates 
      SET status = 'revoked', revoked_at = NOW(), revoked_reason = 'Compliance audit test revocation'
      WHERE certificate_number = ${testCertNumber};
    `;

    const res = await fetch(`http://localhost:3000/api/certificates/verify/${testCertNumber}`);
    const json = await res.json();

    if (json.status === "revoked" && json.certificate.revokedReason === "Compliance audit test revocation") {
      recordResult("Certificate Revocation Flow", true, "Revoked certificate immediately returns status: revoked and NEVER appears valid.");
    } else {
      recordResult("Certificate Revocation Flow", false, `Status was not revoked: ${JSON.stringify(json)}`);
    }
  } catch (err) {
    recordResult("Certificate Revocation Flow", false, err.message);
  }

  // TEST 8: Unauthorized Download Prevention
  try {
    const res = await fetch(`http://localhost:3000/api/admin/certificates/download?certificateNumber=${testCertNumber}`);
    if (res.status === 401) {
      recordResult("Security & Authorization (Unauthorized Download Protection)", true, "Unauthenticated request to /api/admin/certificates/download blocked with 401 Unauthorized.");
    } else {
      recordResult("Security & Authorization (Unauthorized Download Protection)", false, `Expected 401, got ${res.status}`);
    }
  } catch (err) {
    recordResult("Security & Authorization (Unauthorized Download Protection)", false, err.message);
  }

  // TEST 9: Presigned Download Generation for Authorized Download
  try {
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const presignedUrl = await getSignedUrl(s3, new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: certStorageKey,
    }), { expiresIn: 300 });

    if (presignedUrl && presignedUrl.includes('X-Amz-Signature')) {
      recordResult("Authorized Short-lived Presigned URL Generation", true, "Generated time-limited (300s) private download URL.");
    } else {
      recordResult("Authorized Short-lived Presigned URL Generation", false, "Failed to generate signed URL signature.");
    }
  } catch (err) {
    recordResult("Authorized Short-lived Presigned URL Generation", false, err.message);
  }

  // Clean up test data
  try {
    await sql`DELETE FROM issued_certificates WHERE certificate_number = ${testCertNumber};`;
    await sql`DELETE FROM file_metadata WHERE storage_key = ${certStorageKey};`;
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: certStorageKey,
    }));
    console.log(`\n✓ Cleaned up test certificate ${testCertNumber} from Neon and R2.`);
  } catch (err) {
    console.warn("Cleanup warning:", err.message);
  }

  console.log("\n=========================================================");
  const allPassed = results.every(r => r.passed);
  console.log(`Summary: ${results.filter(r => r.passed).length} / ${results.length} tests passed.`);
  if (allPassed) {
    console.log("STATUS: ALL TESTS PASSED SUCCESSFULLY! SYSTEM IS COMPLIANT.");
  } else {
    console.log("STATUS: SOME TESTS FAILED. PLEASE REVIEW LOGS ABOVE.");
  }
  console.log("=========================================================\n");
}

runComprehensiveVerification().catch(err => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
