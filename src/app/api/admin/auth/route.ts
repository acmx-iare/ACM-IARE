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
    const { password } = await request.json();
    if (!password) {
      return NextResponse.json({ success: false, error: "Password required" }, { status: 400 });
    }

    const result = await setAdminSession(password);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Invalid administrator credentials" },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, message: "Authentication successful" });
  } catch {
    return NextResponse.json({ success: false, error: "Authentication error" }, { status: 500 });
  }
}

export async function DELETE() {
  await clearAdminSession();
  return NextResponse.json({ success: true, message: "Logged out" });
}
