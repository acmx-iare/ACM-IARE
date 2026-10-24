import { NextResponse } from "next/server";
import { getAuthenticatedAdminUser } from "@/lib/admin-auth";
import { getAllCmsPages } from "@/lib/cms-store";

export async function GET() {
  try {
    const user = await getAuthenticatedAdminUser();
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pages = await getAllCmsPages();
    return NextResponse.json({ success: true, pages });
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "digest" in err) {
      throw err;
    }
    console.error("Studio pages GET error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch CMS pages" }, { status: 500 });
  }
}
