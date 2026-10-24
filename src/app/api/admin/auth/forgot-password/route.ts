import { NextResponse } from "next/server";
import { createPasswordResetToken } from "@/lib/admin-auth";
import { sendPasswordResetEmail } from "@/lib/email";

// Simple in-memory rate limiting: 5 requests per IP per 15 minutes
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.expiresAt < now) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 5) {
    return false;
  }
  entry.count += 1;
  return true;
}

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many password recovery requests. Please wait a few minutes before trying again.",
        },
        { status: 429 }
      );
    }

    const { email } = await request.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid administrator email address." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // In accordance with recovery policy:
    // Support the designated administrator recovery email (acmiare@gmail.com)
    // or any registered admin account
    const tokenResult = await createPasswordResetToken(normalizedEmail, ip);

    if (tokenResult) {
      // Determine application base URL
      let baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || "";
      if (!baseUrl) {
        const host = request.headers.get("host") || "localhost:3000";
        const protocol = host.includes("localhost") ? "http" : "https";
        baseUrl = `${protocol}://${host}`;
      }
      // Strip trailing slash
      baseUrl = baseUrl.replace(/\/+$/, "");

      const resetUrl = `${baseUrl}/admin/reset-password?token=${encodeURIComponent(tokenResult.token)}`;

      // Dispatch recovery email
      await sendPasswordResetEmail({
        toEmail: normalizedEmail,
        resetUrl,
        expiresInMinutes: 30,
      });
    }

    // Generic confirmation message so the interface does not reveal whether an account exists
    return NextResponse.json({
      success: true,
      message:
        "If an authorized administrator account matches this address, a time-limited recovery link has been dispatched to it. Check your inbox and spam folder.",
    });
  } catch (err: unknown) {
    console.error("Forgot password route error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while processing recovery request.",
      },
      { status: 500 }
    );
  }
}
