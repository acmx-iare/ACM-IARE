import { NextResponse } from "next/server";
import {
  getAuthenticatedAdminUser,
  setAdminSession,
  clearAdminSession,
} from "@/lib/admin-auth";

export async function GET() {
  const user = await getAuthenticatedAdminUser();
  return NextResponse.json({
    authenticated: Boolean(user && user.isActive),
    user: user
      ? {
          username: user.username,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
        }
      : null,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawPassword = body.password ? String(body.password).trim() : "";
    if (!rawPassword) {
      return NextResponse.json({ success: false, error: "Password required" }, { status: 400 });
    }

    const result = await setAdminSession(rawPassword);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Invalid administrator credentials" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true, message: "Authentication successful" });
    if (result.sessionToken) {
      response.cookies.set("acm_admin_session", result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (err) {
    console.error("POST /api/admin/auth error:", err);
    return NextResponse.json({ success: false, error: "Authentication system error" }, { status: 500 });
  }
}

export async function DELETE() {
  await clearAdminSession();
  return NextResponse.json({ success: true, message: "Logged out" });
}
