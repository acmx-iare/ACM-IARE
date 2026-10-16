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
const { S3Client, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');

async function testPipeline() {
  console.log("=== Testing Certificate Generation & Storage Pipeline ===");
  const sql = neon(process.env.DATABASE_URL);

  const testCertNumber = `ACM-TEST-${Date.now()}`;
  const testStorageKey = `certificates/test/${testCertNumber}.pdf`;
  const verificationUrl = `https://acm-iare.pages.dev/verify/${testCertNumber}`;

  // 1. Create a test PDF with pdf-lib & qrcode
  console.log("\n1. Rendering PDF with pdf-lib and embedded QR code...");
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawText("ACM IARE TEST CERTIFICATE", { x: 250, y: 500, size: 20, font: fontBold });
  page.drawText("Candidate: Test Participant", { x: 250, y: 450, size: 14, font: fontRegular });
  page.drawText(`Credential: ${testCertNumber}`, { x: 250, y: 400, size: 12, font: fontRegular });

  const qrBuffer = await QRCode.toBuffer(verificationUrl, { width: 150 });
  const qrImage = await pdfDoc.embedPng(qrBuffer);
  page.drawImage(qrImage, { x: 350, y: 200, width: 100, height: 100 });

  const pdfBytes = await pdfDoc.save();
  console.log(`✓ PDF rendered successfully (${pdfBytes.length} bytes)`);

  // 2. Upload to Cloudflare R2
  console.log("\n2. Uploading PDF to Cloudflare R2 bucket acm-iare-files...");
  const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  const { PutObjectCommand } = require('@aws-sdk/client-s3');
  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME || 'acm-iare-files',
    Key: testStorageKey,
    Body: Buffer.from(pdfBytes),
    ContentType: 'application/pdf',
  }));
  console.log(`✓ Successfully uploaded private PDF to R2: ${testStorageKey}`);

  // 3. Verify object exists in R2
  const head = await s3.send(new HeadObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME || 'acm-iare-files',
    Key: testStorageKey,
  }));
  console.log(`✓ Confirmed object exists in R2 (ContentLength: ${head.ContentLength} bytes)`);

  // 4. Test Presigned Download URL
  const downloadUrl = await getSignedUrl(s3, new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME || 'acm-iare-files',
    Key: testStorageKey,
  }), { expiresIn: 300 });
  console.log(`✓ Presigned URL generated successfully (valid for 5 minutes)`);

  // 5. Insert test record in Neon
  console.log("\n3. Inserting certificate record in Neon PostgreSQL...");
  const certId = `test_${Date.now()}`;
  await sql`
    INSERT INTO issued_certificates (
      id, certificate_number, event_id, recipient_name, recipient_email,
      event_title, certificate_type, status, pdf_storage_key,
      pdf_file_size, qr_verification_url, issued_at
    ) VALUES (
      ${certId},
      ${testCertNumber},
      null,
      'Test Participant',
      'test@iare.ac.in',
      'ACM Genesis Hackathon 2026',
      'participation',
      'valid',
      ${testStorageKey},
      ${pdfBytes.length},
      ${verificationUrl},
      NOW()
    );
  `;
  console.log(`✓ Inserted certificate record into Neon`);

  // 6. Query from Neon
  const rows = await sql`SELECT * FROM issued_certificates WHERE certificate_number = ${testCertNumber}`;
  console.log(`✓ Queried from Neon: status is "${rows[0].status}", recipient is "${rows[0].recipient_name}"`);

  // 7. Test Revocation
  console.log("\n4. Testing Revocation status update...");
  await sql`
    UPDATE issued_certificates 
    SET status = 'revoked', revoked_at = NOW(), revoked_reason = 'Integration test revocation'
    WHERE certificate_number = ${testCertNumber};
  `;
  const updatedRows = await sql`SELECT status, revoked_reason FROM issued_certificates WHERE certificate_number = ${testCertNumber}`;
  console.log(`✓ Revocation verified: status is "${updatedRows[0].status}", reason is "${updatedRows[0].revoked_reason}"`);

  // 8. Clean up test record and object
  console.log("\n5. Cleaning up test data...");
  await sql`DELETE FROM issued_certificates WHERE certificate_number = ${testCertNumber}`;
  await s3.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME || 'acm-iare-files',
    Key: testStorageKey,
  }));
  console.log(`✓ Test record cleaned up from Neon and test PDF deleted from R2.`);

  console.log("\n=== ALL TESTS PASSED SUCCESSFULLY! ===");
}

testPipeline().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
