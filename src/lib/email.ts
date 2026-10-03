import "server-only";
import { Resend } from "resend";
import { env, serverSecret } from "@/lib/env";
import { t } from "@/lib/texts";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderEmail(opts: { title: string; body: string; ctaLabel: string; ctaUrl: string }) {
  return `<!doctype html><html lang="ro"><body style="margin:0;background:#f4f5f9;font-family:Montserrat,Arial,sans-serif;color:#0f1535">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f9;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden">
<tr><td style="background:#101c5c;padding:24px 32px;color:#ffffff;font-size:20px;font-weight:700">MentorMed</td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3">${esc(opts.title)}</h1>
<p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#3b4266">${esc(opts.body)}</p>
<a href="${esc(opts.ctaUrl)}" style="display:inline-block;background:#1f6fb2;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:12px">${esc(opts.ctaLabel)}</a>
<p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#6b7194">Dacă butonul nu funcționează, copiază acest link în browser:<br><span style="word-break:break-all">${esc(opts.ctaUrl)}</span></p>
</td></tr>
<tr><td style="padding:0 32px 28px;font-size:12px;color:#6b7194">${esc(t.email.footer)}</td></tr>
</table></td></tr></table></body></html>`;
}

export type OutgoingEmail = { to: string; subject: string; html: string };

export async function sendEmails(items: OutgoingEmail[]): Promise<{ sent: number; failed: string[] }> {
  if (items.length === 0) return { sent: 0, failed: [] };
  const resend = new Resend(serverSecret("RESEND_API_KEY"));
  const failed: string[] = [];
  let sent = 0;
  for (let i = 0; i < items.length; i += 50) {
    const chunk = items.slice(i, i + 50);
    const { error } = await resend.batch.send(chunk.map((m) => ({ from: env.emailFrom, to: [m.to], subject: m.subject, html: m.html })));
    if (error) failed.push(...chunk.map((m) => m.to));
    else sent += chunk.length;
  }
  return { sent, failed };
}

export function inviteEmail(to: string, link: string): OutgoingEmail {
  return { to, subject: t.email.inviteSubject, html: renderEmail({ title: t.email.inviteTitle, body: t.email.inviteBody, ctaLabel: t.email.inviteCta, ctaUrl: link }) };
}

export function resetEmail(to: string, link: string): OutgoingEmail {
  return { to, subject: t.email.resetSubject, html: renderEmail({ title: t.email.resetTitle, body: t.email.resetBody, ctaLabel: t.email.resetCta, ctaUrl: link }) };
}

// Builds a one time sign in link (token hash flow) for invitations and password resets.
export function confirmLink(tokenHash: string, next: string) {
  return `${env.siteUrl}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=recovery&next=${encodeURIComponent(next)}`;
}
