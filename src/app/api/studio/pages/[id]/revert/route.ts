import { NextResponse } from "next/server";
import { getAuthenticatedAdminUser } from "@/lib/admin-auth";
import { revertCmsPageRevision } from "@/lib/cms-store";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedAdminUser();
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { version } = body;

    if (!version || typeof version !== "number") {
      return NextResponse.json({ success: false, error: "Valid target revision version is required." }, { status: 400 });
    }

    const result = await revertCmsPageRevision(id, version, user.username);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Page successfully reverted to revision ${version}.`,
    });
  } catch (err: unknown) {
    console.error("Revert revision POST error:", err);
    return NextResponse.json({ success: false, error: "Failed to revert page" }, { status: 500 });
  }
}
