import { NextResponse } from "next/server";
import { isAuthenticatedAdmin, setAdminSession, clearAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const isAuth = await isAuthenticatedAdmin();
  return NextResponse.json({ authenticated: isAuth });
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    if (!password) {
      return NextResponse.json({ success: false, error: "Password required" }, { status: 400 });
    }

    const success = await setAdminSession(password);
    if (!success) {
      return NextResponse.json({ success: false, error: "Invalid administrator credentials" }, { status: 401 });
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
