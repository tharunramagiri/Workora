// Outbound email for agent → human notifications (reports, incidents, approvals).
// Disabled by default (like devLoginEnabled/setupToken): the SMTP credential lives only in this
// process's env, never handed to agents/daemon, so agents can request an email via the server API
// but can never read or exfiltrate the credential itself.
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let cachedTransport: Transporter | null | undefined; // undefined = not yet built, null = disabled

/** True when SMTP env vars are present. Read at call-time so tests/env changes are honored. */
export const mailEnabled = (): boolean =>
  !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

function getTransport(): Transporter | null {
  if (!mailEnabled()) return null;
  if (cachedTransport !== undefined) return cachedTransport;
  cachedTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587/STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return cachedTransport;
}

export interface SendMailInput {
  to: string;
  subject: string;
  text: string;
  fromLabel?: string; // e.g. agent display name, prefixed onto the From header
}

/** Send a plaintext notification email. Throws if mail is disabled or the send fails — callers
 *  (agent-api route) turn that into a clean 4xx/5xx instead of silently dropping the report. */
export async function sendMail(input: SendMailInput): Promise<{ messageId: string }> {
  const t = getTransport();
  if (!t) throw new Error("email is not configured on this server (SMTP_HOST/SMTP_USER/SMTP_PASS unset)");
  const from = input.fromLabel ? `${input.fromLabel} <${process.env.SMTP_USER}>` : String(process.env.SMTP_USER);
  const info = await t.sendMail({ from, to: input.to, subject: input.subject, text: input.text });
  return { messageId: info.messageId };
}
