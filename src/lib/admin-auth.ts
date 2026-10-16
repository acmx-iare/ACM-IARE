import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "acm_admin_session";
const DEFAULT_ADMIN_PASSWORD = "acmiare2026admin";

function getExpectedToken(): string {
  const secret = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  return crypto.createHash("sha256").update(`acm_iare_admin_${secret}`).digest("hex");
}

export async function isAuthenticatedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie || !sessionCookie.value) {
    return false;
  }
  return sessionCookie.value === getExpectedToken();
}

export async function setAdminSession(password: string): Promise<boolean> {
  const expectedPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  if (password !== expectedPassword) {
    return false;
  }

  const cookieStore = await cookies();
  const token = getExpectedToken();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return true;
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
