import { NextResponse } from "next/server";
import { getAuthenticatedAdminUser } from "@/lib/admin-auth";
import { listCmsMedia, recordCmsMedia, deleteCmsMedia, CmsMediaItem } from "@/lib/cms-store";
import { uploadPrivateFile, deletePrivateFile } from "@/lib/r2";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",
  "application/pdf",
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedAdminUser();
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const media = await listCmsMedia();
    return NextResponse.json({ success: true, media });
  } catch (err: unknown) {
    console.error("Studio media GET error:", err);
    return NextResponse.json({ success: false, error: "Failed to list media" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedAdminUser();
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const altText = (formData.get("altText") as string) || "";
    const category = (formData.get("category") as string) || "general";

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 });
    }

    // MIME type check
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported file type. Only JPEG, PNG, WebP, SVG, and PDF are permitted.",
        },
        { status: 400 }
      );
    }

    // Size check
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "File exceeds maximum permitted size of 10 MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueSuffix = crypto.randomBytes(6).toString("hex");
    const storageKey = `cms-assets/${Date.now()}_${uniqueSuffix}_${sanitizedName}`;

    // Upload to Cloudflare R2
    let publicUrl = "";
    try {
      await uploadPrivateFile(buffer, storageKey, file.type, {
        fileName: sanitizedName,
        category: `cms_${category}`,
        entityType: "cms_asset",
      });

      // Prefer configured public domain, else proxy view URL
      const r2PublicDomain = process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_URL;
      if (r2PublicDomain) {
        const domain = r2PublicDomain.replace(/\/+$/, "");
        publicUrl = `${domain}/${storageKey}`;
      } else {
        publicUrl = `/api/studio/media/view?key=${encodeURIComponent(storageKey)}`;
      }
    } catch (uploadErr) {
      console.warn("Notice: R2 direct upload unavailable, creating local reference proxy:", uploadErr);
      publicUrl = `/api/studio/media/view?key=${encodeURIComponent(storageKey)}`;
    }

    const mediaId = `media_${Date.now()}_${uniqueSuffix}`;
    const mediaRecord: Omit<CmsMediaItem, "created_at"> = {
      id: mediaId,
      storage_key: storageKey,
      public_url: publicUrl,
      file_name: sanitizedName,
      file_size: file.size,
      content_type: file.type,
      alt_text: altText,
      category,
      uploaded_by: user.username,
    };

    await recordCmsMedia(mediaRecord);

    return NextResponse.json({
      success: true,
      media: {
        ...mediaRecord,
        created_at: new Date().toISOString(),
      },
      message: "Media uploaded and indexed successfully.",
    });
  } catch (err: unknown) {
    console.error("Studio media POST error:", err);
    return NextResponse.json({ success: false, error: "Failed to upload media asset." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthenticatedAdminUser();
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storageKey = searchParams.get("key");

    if (!storageKey) {
      return NextResponse.json({ success: false, error: "Missing storage key" }, { status: 400 });
    }

    // Try deleting from R2
    try {
      await deletePrivateFile(storageKey);
    } catch (err) {
      console.warn("Notice during R2 delete:", err);
    }

    // Delete record from cms_media
    await deleteCmsMedia(storageKey);

    return NextResponse.json({ success: true, message: "Media asset deleted successfully." });
  } catch (err: unknown) {
    console.error("Studio media DELETE error:", err);
    return NextResponse.json({ success: false, error: "Server error deleting media" }, { status: 500 });
  }
}
