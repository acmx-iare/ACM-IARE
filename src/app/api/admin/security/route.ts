import { NextResponse } from "next/server";
import { getAuthenticatedAdminUser } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const user = await getAuthenticatedAdminUser();
    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch recent security audit logs
    const auditLogs = await sql`
      SELECT id, action, event_id, status, error_message, created_at
      FROM audit_logs
      WHERE action LIKE 'admin_%'
      ORDER BY created_at DESC
      LIMIT 15;
    `;

    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        passwordChangedAt: user.passwordChangedAt,
      },
      auditLogs: auditLogs || [],
    });
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "digest" in err) {
      throw err;
    }
    console.error("Security info API error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve security configuration." },
      { status: 500 }
    );
  }
}
