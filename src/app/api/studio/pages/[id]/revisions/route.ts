import { NextResponse } from "next/server";
import { getAuthenticatedAdminUser } from "@/lib/admin-auth";
import { getCmsPageRevisions } from "@/lib/cms-store";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedAdminUser();
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const revisions = await getCmsPageRevisions(id);

    return NextResponse.json({ success: true, revisions });
  } catch (err: unknown) {
    console.error("Revisions GET error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch revisions" }, { status: 500 });
  }
}
