import { NextRequest, NextResponse } from "next/server";
import { verifyPasswordResetToken, resetPasswordWithToken, validatePasswordPolicy } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Missing recovery token." },
        { status: 400 }
      );
    }

    const verification = await verifyPasswordResetToken(token);
    if (!verification.valid) {
      return NextResponse.json(
        { valid: false, error: verification.error || "Invalid or expired token." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: verification.user?.email,
      username: verification.user?.username,
    });
  } catch (err: unknown) {
    console.error("Reset password GET verification error:", err);
    return NextResponse.json(
      { valid: false, error: "Token verification failure." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password, confirmPassword } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid recovery token." },
        { status: 400 }
      );
    }

    if (!password || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Both password and confirmation are required." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Passwords do not match." },
        { status: 400 }
      );
    }

    const policy = validatePasswordPolicy(password);
    if (!policy.valid) {
      return NextResponse.json(
        { success: false, error: policy.error },
        { status: 400 }
      );
    }

    const result = await resetPasswordWithToken(token, password);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to reset password." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Administrator password reset successfully. Please log in with your new credentials.",
    });
  } catch (err: unknown) {
    console.error("Reset password POST error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error during password reset." },
      { status: 500 }
    );
  }
}
