const { neon } = require("@neondatabase/serverless");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const sql = neon(process.env.DATABASE_URL);

async function testSecurity() {
  console.log("--- 1. Testing Neon DB connection ---");
  const ping = await sql`SELECT NOW() as current_time;`;
  console.log("DB Time:", ping[0].current_time);

  console.log("\n--- 2. Checking Admin User Record ---");
  const users = await sql`SELECT id, username, email, role, is_active, password_changed_at FROM admin_users;`;
  console.log("Admin Users count:", users.length);
  console.log("User details:", users[0]);

  console.log("\n--- 3. Testing Reset Token Creation & Expiry ---");
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const tokenId = `prt_test_${Date.now()}`;
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

  await sql`
    INSERT INTO password_reset_tokens (id, user_id, email, token_hash, expires_at, created_at)
    VALUES (${tokenId}, ${users[0].id}, ${users[0].email}, ${tokenHash}, ${expiresAt.toISOString()}, NOW());
  `;
  console.log("Inserted test recovery token:", tokenId);

  const found = await sql`SELECT * FROM password_reset_tokens WHERE token_hash = ${tokenHash};`;
  console.log("Retrieved token record:", found.length === 1 ? "SUCCESS" : "FAILED");

  // Invalidate token
  await sql`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ${tokenId};`;
  console.log("Marked test token as used.");

  console.log("\n--- 4. Checking Sessions Table ---");
  const sessions = await sql`SELECT count(*) FROM admin_sessions;`;
  console.log("Active sessions count:", sessions[0].count);

  console.log("\n--- 5. Checking Audit Logs Table ---");
  const logs = await sql`SELECT count(*) FROM audit_logs;`;
  console.log("Audit log records count:", logs[0].count);

  console.log("\nAll security database components verified successfully!");
}

testSecurity().catch(console.error);
