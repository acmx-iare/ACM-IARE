import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sql } from "./db";

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "acm-iare-files";
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_ENDPOINT =
  process.env.R2_ENDPOINT ||
  (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : "");

let s3ClientInstance: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!s3ClientInstance) {
    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT) {
      throw new Error(
        "Cloudflare R2 is not fully configured. Missing R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, or R2_ENDPOINT."
      );
    }

    s3ClientInstance = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3ClientInstance;
}

export interface UploadOptions {
  fileName?: string;
  category?: string;
  entityType?: string;
  entityId?: string;
  maxSizeBytes?: number;
}

/**
 * Uploads a private file buffer to Cloudflare R2 and tracks metadata in Neon
 */
export async function uploadPrivateFile(
  buffer: Buffer | Uint8Array,
  storageKey: string,
  contentType: string,
  options: UploadOptions = {}
): Promise<{ success: boolean; storageKey: string; size: number }> {
  const client = getR2Client();
  const size = buffer.length;

  const maxAllowed = options.maxSizeBytes || 20 * 1024 * 1024; // 20 MB max
  if (size > maxAllowed) {
    throw new Error(`File size (${(size / 1024 / 1024).toFixed(2)} MB) exceeds allowed limit.`);
  }

  // Upload to R2 private bucket
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: storageKey,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);

  // Record metadata in Neon PostgreSQL
  try {
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    await sql`
      INSERT INTO file_metadata (
        id, storage_key, bucket, file_name, content_type,
        file_size_bytes, category, entity_type, entity_id, created_at
      ) VALUES (
        ${fileId},
        ${storageKey},
        ${R2_BUCKET_NAME},
        ${options.fileName || storageKey.split("/").pop() || "file"},
        ${contentType},
        ${size},
        ${options.category || "certificates"},
        ${options.entityType || "certificate"},
        ${options.entityId || null},
        NOW()
      )
      ON CONFLICT (storage_key) DO UPDATE SET
        file_size_bytes = EXCLUDED.file_size_bytes,
        content_type = EXCLUDED.content_type;
    `;
  } catch (err) {
    console.warn("Neon file_metadata sync notice:", err);
  }

  return { success: true, storageKey, size };
}

/**
 * Generates a secure, short-lived signed URL for private certificate download
 */
export async function getPresignedDownloadUrl(
  storageKey: string,
  expiresInSeconds: number = 300,
  downloadFilename?: string
): Promise<string> {
  const client = getR2Client();

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: storageKey,
    ResponseContentDisposition: downloadFilename
      ? `attachment; filename="${downloadFilename.replace(/"/g, "")}"`
      : undefined,
  });

  return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Securely streams file buffer directly from R2 (for server-side proxies)
 */
export async function getFileBuffer(storageKey: string): Promise<{ buffer: Buffer; contentType: string }> {
  const client = getR2Client();

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: storageKey,
  });

  const response = await client.send(command);
  if (!response.Body) {
    throw new Error(`File ${storageKey} has empty body.`);
  }

  const byteArray = await response.Body.transformToByteArray();
  return {
    buffer: Buffer.from(byteArray),
    contentType: response.ContentType || "application/octet-stream",
  };
}

/**
 * Deletes a file from R2 and removes metadata from Neon
 */
export async function deletePrivateFile(storageKey: string): Promise<boolean> {
  const client = getR2Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storageKey,
    })
  );

  try {
    await sql`DELETE FROM file_metadata WHERE storage_key = ${storageKey}`;
  } catch (err) {
    console.warn("Neon file_metadata deletion notice:", err);
  }

  return true;
}

/**
 * Verifies R2 connectivity and health
 */
export async function checkR2Health(): Promise<{ connected: boolean; bucket: string; error?: string }> {
  try {
    const client = getR2Client();
    await client.send(new HeadBucketCommand({ Bucket: R2_BUCKET_NAME }));
    return { connected: true, bucket: R2_BUCKET_NAME };
  } catch (err: unknown) {
    return {
      connected: false,
      bucket: R2_BUCKET_NAME,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
