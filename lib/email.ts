import { Resend } from "resend";

/**
 * Sender address: until tryforgeai.app is verified as a sending domain in
 * Resend, their sandbox only delivers to the address that owns the Resend
 * account — real users won't receive anything sent from onboarding@resend.dev.
 * Once the domain is verified, set EMAIL_FROM (e.g. "ForgeAI <noreply@tryforgeai.app>")
 * to switch over with no code change.
 */
const DEFAULT_FROM = "ForgeAI <onboarding@resend.dev>";

function getClient(): Resend | null {
  const key = (process.env.RESEND_API_KEY ?? "").trim();
  return key ? new Resend(key) : null;
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  const client = getClient();
  if (!client) {
    throw new Error("Email isn't configured on the server (missing RESEND_API_KEY).");
  }

  await client.emails.send({
    from: process.env.EMAIL_FROM || DEFAULT_FROM,
    to: email,
    subject: "Reset your ForgeAI password",
    html: `
      <p>Someone asked to reset the password for this ForgeAI account.</p>
      <p><a href="${resetUrl}">Click here to set a new password</a> — this link expires in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });
}
