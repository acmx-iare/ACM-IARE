import { NextResponse } from "next/server";
import { getAuthenticatedAdminUser, changeAdminPassword, validatePasswordPolicy } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedAdminUser();
    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Current password, new password, and confirmation are required." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "New password and confirmation do not match." },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, error: "New password must be different from current password." },
        { status: 400 }
      );
    }

    const policy = validatePasswordPolicy(newPassword);
    if (!policy.valid) {
      return NextResponse.json(
        { success: false, error: policy.error },
        { status: 400 }
      );
    }

    const result = await changeAdminPassword(user.id, currentPassword, newPassword);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to change password." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password changed successfully. Your active session has been renewed securely.",
    });
  } catch (err: unknown) {
    console.error("Change password API error:", err);
    return NextResponse.json(
      { success: false, error: "Server error while updating password." },
      { status: 500 }
    );
  }
}
