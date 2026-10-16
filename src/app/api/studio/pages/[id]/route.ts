import { NextResponse } from "next/server";
import { getAuthenticatedAdminUser } from "@/lib/admin-auth";
import { getCmsPage, saveCmsDraft, publishCmsPage } from "@/lib/cms-store";

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
    const page = await getCmsPage(id);
    if (!page) {
      return NextResponse.json({ success: false, error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, page });
  } catch (err: unknown) {
    console.error("Studio page GET error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
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
    const { draftContent } = body;

    if (!draftContent) {
      return NextResponse.json({ success: false, error: "Missing draft content" }, { status: 400 });
    }

    const result = await saveCmsDraft(id, draftContent, user.username);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Draft saved successfully" });
  } catch (err: unknown) {
    console.error("Studio page PUT draft error:", err);
    return NextResponse.json({ success: false, error: "Server error saving draft" }, { status: 500 });
  }
}

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
    const body = await request.json().catch(() => ({}));
    const changeSummary = body.changeSummary || `Published by ${user.username}`;

    // Publish requires publisher or admin role
    const result = await publishCmsPage(id, user.username, changeSummary);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Page published successfully to live website",
      newVersion: result.newVersion,
    });
  } catch (err: unknown) {
    console.error("Studio page POST publish error:", err);
    return NextResponse.json({ success: false, error: "Server error publishing page" }, { status: 500 });
  }
}
