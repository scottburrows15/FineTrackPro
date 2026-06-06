const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "FoulPay <onboarding@resend.dev>";

type SendResult = { delivered: boolean };

async function sendViaResend(to: string, subject: string, html: string, text: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html, text }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Resend email failed (${res.status}): ${body}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Resend email error:", error);
    return false;
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<SendResult> {
  const subject = "Reset your FoulPay password";
  const text = [
    "We received a request to reset your FoulPay password.",
    "",
    `Reset your password using this link (valid for 1 hour):`,
    resetUrl,
    "",
    "If you didn't request this, you can safely ignore this email.",
  ].join("\n");

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #0f172a;">
      <h2 style="margin: 0 0 16px;">Reset your password</h2>
      <p style="margin: 0 0 16px; color: #475569;">We received a request to reset your FoulPay password. Click the button below to choose a new one. This link is valid for 1 hour and can only be used once.</p>
      <p style="margin: 0 0 24px;">
        <a href="${resetUrl}" style="display: inline-block; background: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">Reset password</a>
      </p>
      <p style="margin: 0 0 8px; color: #475569; font-size: 14px;">Or paste this link into your browser:</p>
      <p style="margin: 0 0 24px; word-break: break-all; font-size: 13px; color: #2563eb;">${resetUrl}</p>
      <p style="margin: 0; color: #94a3b8; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  if (RESEND_API_KEY) {
    const delivered = await sendViaResend(to, subject, html, text);
    if (delivered) return { delivered: true };
  }

  // No email provider configured (or send failed): log the link so the flow
  // remains usable. Never throw — the caller must not reveal delivery status.
  console.log(
    `[password-reset] Email not sent via provider. Reset link for ${to}: ${resetUrl}`,
  );
  return { delivered: false };
}
