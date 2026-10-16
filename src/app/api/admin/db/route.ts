import { NextResponse } from "next/server";
import { getDatabaseHealth, sql } from "@/lib/db";

export async function GET() {
  const health = await getDatabaseHealth();
  return NextResponse.json(health);
}

export async function POST() {
  try {
    const testId = `neon_test_${Date.now()}`;
    await sql`
      INSERT INTO audit_logs (action, event_id, status, error_message)
      VALUES ('api_health_check', ${testId}, 'success', 'End-to-end API test of Neon PostgreSQL');
    `;

    const recent = await sql`
      SELECT * FROM audit_logs WHERE event_id = ${testId} LIMIT 1;
    `;

    return NextResponse.json({
      success: true,
      message: "Neon PostgreSQL read/write verification passed",
      testRecord: recent[0],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
