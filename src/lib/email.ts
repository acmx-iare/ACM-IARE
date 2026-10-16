import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "ACM IARE Student Chapter <acmiare@gmail.com>";

export const DESIGNATED_RECOVERY_EMAIL = "acmiare@gmail.com";

export function isEmailConfigured(): boolean {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

export function getEmailDiagnostics(): {
  configured: boolean;
  host: string;
  port: number;
  userSet: boolean;
  from: string;
} {
  return {
    configured: isEmailConfigured(),
    host: SMTP_HOST ? SMTP_HOST.replace(/.(?=.{3})/g, "*") : "not set",
    port: SMTP_PORT,
    userSet: Boolean(SMTP_USER),
    from: EMAIL_FROM,
  };
}

export interface SendPasswordResetOptions {
  toEmail: string;
  resetUrl: string;
  expiresInMinutes?: number;
}

/**
 * Sends a secure, professional ACM IARE-branded password reset email.
 */
export async function sendPasswordResetEmail({
  toEmail,
  resetUrl,
  expiresInMinutes = 30,
}: SendPasswordResetOptions): Promise<{ success: boolean; configured: boolean; messageId?: string; error?: string }> {
  const configured = isEmailConfigured();

  if (!configured) {
    console.warn("\n[ACM Security Notice] SMTP credentials are not configured in environment variables.");
    console.info(`[Password Reset Test Mode] Direct recovery link generated for ${toEmail}: ${resetUrl}\n`);
    return {
      success: false,
      configured: false,
      error: "SMTP credentials not configured on server. Check SMTP_HOST, SMTP_USER, and SMTP_PASS.",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background-color: #14213d; padding: 28px 24px; text-align: center; }
          .title { color: #ffffff; font-size: 18px; font-weight: 800; letter-spacing: -0.025em; margin: 0; }
          .subtitle { color: #94a3b8; font-size: 12px; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
          .body-content { padding: 32px 28px; line-height: 1.6; font-size: 14px; }
          .button-wrap { text-align: center; margin: 32px 0; }
          .button { display: inline-block; background-color: #00838f; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 8px; }
          .footer { background-color: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .warning-box { background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px 16px; margin: 20px 0; font-size: 12px; color: #92400e; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">ACM IARE Administration</h1>
            <div class="subtitle">Institute of Aeronautical Engineering • Security Portal</div>
          </div>
          <div class="body-content">
            <p>Hello Administrator,</p>
            <p>We received an official request to reset the administrator account password for the ACM IARE Student Chapter portal.</p>
            <div class="button-wrap">
              <a href="${resetUrl}" class="button" target="_blank">Reset Administrator Password</a>
            </div>
            <div class="warning-box">
              <strong>Important Security Notice:</strong> This single-use recovery link will expire in <strong>${expiresInMinutes} minutes</strong>. If you did not initiate this request, your account remains secure; please disregard this email.
            </div>
            <p style="font-size: 12px; color: #64748b;">If the button above does not work, copy and paste the following link into your browser:<br>
            <a href="${resetUrl}" style="color: #00838f; word-break: break-all;">${resetUrl}</a></p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} ACM Student Chapter, Institute of Aeronautical Engineering (IARE).<br>
            Official Communications • Autonomous Institution, Hyderabad.
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: toEmail,
      subject: "Reset Your ACM IARE Administrator Password",
      html: htmlContent,
      text: `ACM IARE Administrator Password Reset\n\nA request has been received to reset your password. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in ${expiresInMinutes} minutes. If you did not request this, please ignore this message.`,
    });

    return {
      success: true,
      configured: true,
      messageId: info.messageId,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Failed to deliver password reset email:", errorMsg);
    return {
      success: false,
      configured: true,
      error: errorMsg,
    };
  }
}
