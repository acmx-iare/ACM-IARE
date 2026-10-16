const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

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

async function runAudit() {
  console.log('====================================================');
  console.log('ACM IARE — PHASE 1 AUDIT & CONNECTIVITY VERIFICATION');
  console.log('====================================================\n');

  const report = {
    envVars: {},
    neon: {},
    r2: {},
    googleAppsScript: {},
  };

  // 1. Inspect Environment Variables presence (without exposing secrets)
  const requiredKeys = [
    'DATABASE_URL',
    'POSTGRES_URL',
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'R2_ENDPOINT',
    'GOOGLE_APPS_SCRIPT_URL',
    'GOOGLE_APPS_SCRIPT_API_KEY',
    'ADMIN_PASSWORD'
  ];

  for (const key of requiredKeys) {
    const isSet = Boolean(process.env[key]);
    report.envVars[key] = isSet ? 'Configured (Present)' : 'MISSING';
    console.log(`[ENV] ${key}: ${report.envVars[key]}`);
  }

  // 2. Test Neon Database Connectivity
  console.log('\n--- 1. Testing Neon PostgreSQL Connection ---');
  if (!process.env.DATABASE_URL) {
    report.neon.status = 'FAILED (DATABASE_URL not set)';
    console.log('Neon Test: FAILED (DATABASE_URL missing)');
  } else {
    try {
      const sql = neon(process.env.DATABASE_URL);
      const pingRes = await sql`SELECT 1 as result, current_database() as db, version() as ver`;
      if (pingRes[0]?.result === 1) {
        report.neon.status = 'SUCCESS (Connected)';
        report.neon.database = pingRes[0].db;
        report.neon.version = pingRes[0].ver.split(' ')[0] + ' ' + pingRes[0].ver.split(' ')[1];

        // Inspect existing tables
        const tables = await sql`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name;
        `;
        report.neon.tables = tables.map(t => t.table_name);
        console.log(`✓ Neon Ping (SELECT 1): OK`);
        console.log(`✓ Neon Database Name: ${report.neon.database}`);
        console.log(`✓ Neon Version: ${report.neon.version}`);
        console.log(`✓ Existing Tables in public schema: [ ${report.neon.tables.join(', ')} ]`);
      }
    } catch (err) {
      report.neon.status = 'FAILED';
      report.neon.error = err.message;
      console.error(`✗ Neon Connection Error: ${err.message}`);
    }
  }

  // 3. Test Cloudflare R2 Object Storage
  console.log('\n--- 2. Testing Cloudflare R2 Storage (acm-iare-files) ---');
  if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    report.r2.status = 'FAILED (R2 credentials missing)';
    console.log('R2 Test: FAILED (Credentials missing)');
  } else {
    try {
      const s3 = new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      });

      const bucketName = process.env.R2_BUCKET_NAME || 'acm-iare-files';

      // A. List bucket (minimal test)
      const listRes = await s3.send(new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 5,
      }));
      console.log(`✓ R2 Bucket Accessible: "${bucketName}" (Found ${listRes.KeyCount || 0} objects sample)`);

      // B. Private test object upload
      const testKey = `_system_test/audit_verification_${Date.now()}.json`;
      const testBody = JSON.stringify({ verified: true, timestamp: new Date().toISOString() });
      await s3.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testBody,
        ContentType: 'application/json',
      }));
      console.log(`✓ R2 Private PutObject Succeeded: ${testKey}`);

      // C. Private test object download
      const getRes = await s3.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      }));
      const downloaded = await getRes.Body.transformToString();
      const parsed = JSON.parse(downloaded);
      if (parsed.verified) {
        console.log(`✓ R2 Private GetObject Succeeded (integrity verified)`);
      }

      // D. Clean up test object
      await s3.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      }));
      console.log(`✓ R2 Private DeleteObject Succeeded (cleanup complete)`);

      report.r2.status = 'SUCCESS (Verified Read/Write/Delete in private bucket)';
      report.r2.bucket = bucketName;
    } catch (err) {
      report.r2.status = 'FAILED';
      report.r2.error = err.message;
      console.error(`✗ Cloudflare R2 Error: ${err.message}`);
    }
  }

  // 4. Test Google Apps Script Integration
  console.log('\n--- 3. Testing Google Apps Script Integration ---');
  if (!process.env.GOOGLE_APPS_SCRIPT_URL) {
    report.googleAppsScript.status = 'NOT CONFIGURED';
    console.log('Google Apps Script URL is missing');
  } else {
    try {
      const response = await fetch(process.env.GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          apiKey: process.env.GOOGLE_APPS_SCRIPT_API_KEY,
          action: 'get_events',
        }),
        redirect: 'follow',
      });
      const text = await response.text();
      const data = JSON.parse(text);
      if (data.success) {
        report.googleAppsScript.status = `SUCCESS (Connected, ${data.events?.length || 0} events retrieved)`;
        console.log(`✓ Google Apps Script: Connected successfully (${data.events?.length || 0} events in Sheets)`);
      } else {
        report.googleAppsScript.status = `FAILED (${data.error || 'Unknown response'})`;
        console.log(`✗ Google Apps Script response: ${data.error}`);
      }
    } catch (err) {
      report.googleAppsScript.status = `FAILED (${err.message})`;
      console.log(`✗ Google Apps Script Error: ${err.message}`);
    }
  }

  console.log('\n====================================================');
  console.log('PHASE 1 AUDIT SUMMARY');
  console.log('====================================================');
  console.log(JSON.stringify(report, null, 2));
}

runAudit();
