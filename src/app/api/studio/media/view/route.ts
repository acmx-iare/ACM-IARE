import { NextRequest, NextResponse } from "next/server";
import { getFileBuffer } from "@/lib/r2";

export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get("key");

    if (!key) {
      return new NextResponse("File key required", { status: 400 });
    }

    // Prevent directory traversal attacks
    if (key.includes("..") || key.startsWith("/")) {
      return new NextResponse("Invalid file key path", { status: 400 });
    }

    const { buffer, contentType } = await getFileBuffer(key);

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: unknown) {
    console.warn("Media view notice:", err);
    return new NextResponse("File not found or unreachable", { status: 404 });
  }
}
