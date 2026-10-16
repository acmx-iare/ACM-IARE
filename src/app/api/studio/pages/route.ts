import { NextResponse } from "next/server";
import { getAuthenticatedAdminUser } from "@/lib/admin-auth";
import { getAllCmsPages } from "@/lib/cms-store";

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedAdminUser();
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pages = await getAllCmsPages();
    return NextResponse.json({ success: true, pages });
  } catch (err: unknown) {
    console.error("Studio pages GET error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch CMS pages" }, { status: 500 });
  }
}
