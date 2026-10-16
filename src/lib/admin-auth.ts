import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sql } from "./db";

const COOKIE_NAME = "acm_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days
const DEFAULT_FALLBACK_PASSWORD = "acmiare2026admin";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: "super_admin" | "admin" | "publisher" | "editor";
  fullName?: string;
  isActive: boolean;
  passwordChangedAt?: string;
}

/**
 * Validates password strength policy
 */
export function validatePasswordPolicy(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long." };
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain both letters and numbers." };
  }
  const commonWeak = ["password", "12345678", "admin123", "acmiare", "qwerty123"];
  if (commonWeak.includes(password.toLowerCase())) {
    return { valid: false, error: "This password is too common and easily compromised." };
  }
  return { valid: true };
}

/**
 * Verifies if current request has an active, authenticated admin session.
 */
export async function isAuthenticatedAdmin(): Promise<boolean> {
  const user = await getAuthenticatedAdminUser();
  return Boolean(user && user.isActive);
}

/**
 * Retrieves the currently authenticated admin user record.
 */
export async function getAuthenticatedAdminUser(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    const token = sessionCookie.value;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // 1. Check in admin_sessions table
    const sessionRows = await sql`
      SELECT s.id as session_id, s.expires_at, u.id, u.username, u.email, u.role, u.full_name, u.is_active, u.password_changed_at
      FROM admin_sessions s
      JOIN admin_users u ON s.user_id = u.id
      WHERE s.session_token_hash = ${tokenHash}
        AND s.expires_at > NOW()
        AND u.is_active = true
      LIMIT 1;
    `;

    if (sessionRows && sessionRows.length > 0) {
      const u = sessionRows[0];
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        fullName: u.full_name,
        isActive: u.is_active,
        passwordChangedAt: u.password_changed_at,
      };
    }

    // 2. Fallback check for transition or env-derived token
    const expectedLegacySecret = process.env.ADMIN_PASSWORD || DEFAULT_FALLBACK_PASSWORD;
    const legacyToken = crypto.createHash("sha256").update(`acm_iare_admin_${expectedLegacySecret}`).digest("hex");
    if (token === legacyToken) {
      return {
        id: "legacy_admin",
        username: "admin",
        email: "acmiare@gmail.com",
        role: "super_admin",
        fullName: "Chapter Administrator",
        isActive: true,
      };
    }

    return null;
  } catch (err) {
    console.warn("Session authentication check notice:", err);
    return null;
  }
}

/**
 * Sets an authenticated admin session for a user.
 */
export async function setAdminSession(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    let matchedUser: any = null;

    // 1. Query admin_users from Neon
    const userRows = await sql`
      SELECT id, username, email, password_hash, role, full_name, is_active
      FROM admin_users
      WHERE is_active = true
      ORDER BY created_at ASC;
    `;

    if (userRows && userRows.length > 0) {
      for (const u of userRows) {
        const isMatch = await bcrypt.compare(password, u.password_hash);
        if (isMatch) {
          matchedUser = u;
          break;
        }
      }
    }

    // 2. Fallback check if user not in DB or initial bootstrap
    if (!matchedUser) {
      const expectedPassword = process.env.ADMIN_PASSWORD || DEFAULT_FALLBACK_PASSWORD;
      if (password === expectedPassword) {
        matchedUser = {
          id: "usr_bootstrap_admin",
          username: "admin",
          email: "acmiare@gmail.com",
          role: "super_admin",
          full_name: "Chapter Administrator",
        };
      }
    }

    if (!matchedUser) {
      return { success: false, error: "Invalid administrator credentials" };
    }

    // 3. Generate 32-byte cryptographic session token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const sessionTokenHash = crypto.createHash("sha256").update(sessionToken).digest("hex");
    const sessionId = `sess_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

    // Save session in DB
    try {
      await sql`
        INSERT INTO admin_sessions (id, user_id, session_token_hash, expires_at, created_at)
        VALUES (${sessionId}, ${matchedUser.id}, ${sessionTokenHash}, ${expiresAt.toISOString()}, NOW());
      `;

      await sql`
        UPDATE admin_users SET last_login_at = NOW() WHERE id = ${matchedUser.id};
      `;
    } catch (err) {
      console.warn("Notice saving session to database:", err);
    }

    // Set HTTP-Only Cookie
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    });

    // Record login in audit log
    try {
      await sql`
        INSERT INTO audit_logs (action, event_id, status, error_message)
        VALUES ('admin_login_success', ${matchedUser.username}, 'success', ${`Admin authenticated: ${matchedUser.email}`});
      `;
    } catch {}

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("setAdminSession error:", msg);
    return { success: false, error: "Authentication system error" };
  }
}

/**
 * Clears the active admin session and removes it from database.
 */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (sessionCookie?.value) {
    const tokenHash = crypto.createHash("sha256").update(sessionCookie.value).digest("hex");
    try {
      await sql`DELETE FROM admin_sessions WHERE session_token_hash = ${tokenHash}`;
    } catch {}
  }
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Revokes all sessions for a specific user (on password reset / change).
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  try {
    await sql`DELETE FROM admin_sessions WHERE user_id = ${userId}`;
  } catch (err) {
    console.warn("revokeAllUserSessions notice:", err);
  }
}

/**
 * Creates a single-use password recovery token (valid for 30 minutes).
 */
export async function createPasswordResetToken(
  email: string,
  ipAddress?: string
): Promise<{ token: string; expiresAt: Date } | null> {
  try {
    // Find user by email
    const users = await sql`
      SELECT id, email, username FROM admin_users
      WHERE LOWER(email) = ${email.toLowerCase().trim()} AND is_active = true
      LIMIT 1;
    `;

    if (!users || users.length === 0) {
      return null;
    }

    const user = users[0];
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const tokenId = `prt_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Invalidate any existing unused reset tokens for this user
    await sql`
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE user_id = ${user.id} AND used_at IS NULL;
    `;

    // Insert new token
    await sql`
      INSERT INTO password_reset_tokens (
        id, user_id, email, token_hash, expires_at, ip_address, created_at
      ) VALUES (
        ${tokenId},
        ${user.id},
        ${user.email},
        ${tokenHash},
        ${expiresAt.toISOString()},
        ${ipAddress || null},
        NOW()
      );
    `;

    return { token: rawToken, expiresAt };
  } catch (err) {
    console.error("createPasswordResetToken error:", err);
    return null;
  }
}

/**
 * Validates a password reset token.
 */
export async function verifyPasswordResetToken(rawToken: string): Promise<{
  valid: boolean;
  user?: { id: string; email: string; username: string };
  error?: string;
}> {
  if (!rawToken || rawToken.length < 20) {
    return { valid: false, error: "Invalid password reset token format." };
  }

  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  try {
    const rows = await sql`
      SELECT t.id, t.expires_at, t.used_at, u.id as user_id, u.email, u.username, u.is_active
      FROM password_reset_tokens t
      JOIN admin_users u ON t.user_id = u.id
      WHERE t.token_hash = ${tokenHash}
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      return { valid: false, error: "Password reset link is invalid or has expired." };
    }

    const record = rows[0];

    if (record.used_at) {
      return { valid: false, error: "This password recovery link has already been used." };
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      return { valid: false, error: "This password recovery link has expired (30-minute limit)." };
    }

    if (!record.is_active) {
      return { valid: false, error: "The associated account is currently deactivated." };
    }

    return {
      valid: true,
      user: {
        id: record.user_id,
        email: record.email,
        username: record.username,
      },
    };
  } catch (err) {
    console.error("verifyPasswordResetToken error:", err);
    return { valid: false, error: "Error verifying recovery token." };
  }
}

/**
 * Consumes a recovery token and sets the new account password.
 */
export async function resetPasswordWithToken(
  rawToken: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const verification = await verifyPasswordResetToken(rawToken);
  if (!verification.valid || !verification.user) {
    return { success: false, error: verification.error || "Invalid token" };
  }

  const policyCheck = validatePasswordPolicy(newPassword);
  if (!policyCheck.valid) {
    return { success: false, error: policyCheck.error };
  }

  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(newPassword, salt);
  const userId = verification.user.id;

  try {
    // 1. Update user password
    await sql`
      UPDATE admin_users
      SET 
        password_hash = ${passwordHash},
        password_changed_at = NOW(),
        updated_at = NOW()
      WHERE id = ${userId};
    `;

    // 2. Mark token as used
    await sql`
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE token_hash = ${tokenHash};
    `;

    // 3. Revoke all active sessions for security
    await revokeAllUserSessions(userId);

    // 4. Log security audit event
    await sql`
      INSERT INTO audit_logs (action, event_id, status, error_message)
      VALUES ('admin_password_reset', ${verification.user.username}, 'success', ${`Password reset via verified recovery link for ${verification.user.email}`});
    `;

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("resetPasswordWithToken error:", msg);
    return { success: false, error: "Failed to reset password." };
  }
}

/**
 * Changes an existing administrator's password after verifying current password.
 */
export async function changeAdminPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userRows = await sql`
      SELECT id, username, email, password_hash
      FROM admin_users
      WHERE id = ${userId} AND is_active = true
      LIMIT 1;
    `;

    if (!userRows || userRows.length === 0) {
      return { success: false, error: "Account not found." };
    }

    const user = userRows[0];

    // Verify current password
    const isCurrentValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentValid) {
      return { success: false, error: "Current password does not match our records." };
    }

    // Disallow setting same password
    const isSame = await bcrypt.compare(newPassword, user.password_hash);
    if (isSame) {
      return { success: false, error: "New password must be different from your current password." };
    }

    // Validate password policy
    const policy = validatePasswordPolicy(newPassword);
    if (!policy.valid) {
      return { success: false, error: policy.error };
    }

    // Hash and update
    const salt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash(newPassword, salt);

    await sql`
      UPDATE admin_users
      SET 
        password_hash = ${newHash},
        password_changed_at = NOW(),
        updated_at = NOW()
      WHERE id = ${userId};
    `;

    // Revoke previous sessions
    await revokeAllUserSessions(userId);

    // Establish new session for the current user
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const sessionTokenHash = crypto.createHash("sha256").update(sessionToken).digest("hex");
    const sessionId = `sess_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

    await sql`
      INSERT INTO admin_sessions (id, user_id, session_token_hash, expires_at, created_at)
      VALUES (${sessionId}, ${userId}, ${sessionTokenHash}, ${expiresAt.toISOString()}, NOW());
    `;

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    });

    // Audit log
    await sql`
      INSERT INTO audit_logs (action, event_id, status, error_message)
      VALUES ('admin_password_change', ${user.username}, 'success', ${`Password changed securely by account holder: ${user.email}`});
    `;

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("changeAdminPassword error:", msg);
    return { success: false, error: "Failed to update account password." };
  }
}
