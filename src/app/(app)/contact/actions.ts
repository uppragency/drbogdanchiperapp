"use server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { allow } from "@/lib/throttle";
import { renderEmail, sendEmails } from "@/lib/email";
import { env } from "@/lib/env";
import type { FormState } from "@/app/login/actions";
import { getTx } from "@/lib/i18n";

export async function sendContact(_: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireUser();
  const tx = await getTx();
  // Reason values stay Romanian: they are stored and shown to the admin team.
  const schema = z.object({ reason: z.enum(["Problemă tehnică", "Acces", "Altceva"]).default("Altceva"), subject: z.string().trim().max(120), message: z.string().trim().min(5, tx("Scrie un mesaj de cel puțin 5 caractere.", "Write a message of at least 5 characters.")).max(5000) });
  const p = schema.safeParse({ reason: formData.get("reason") ?? undefined, subject: formData.get("subject") ?? "", message: formData.get("message") });
  if (!p.success) return { error: p.error.issues[0]?.message ?? tx("Date invalide.", "Invalid data.") };
  if (!(await allow(`contact:${viewer.id}`, 5, 3600))) return { error: tx("Ai trimis prea multe mesaje. Încearcă din nou peste o oră.", "You have sent too many messages. Try again in an hour.") };
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert({ user_id: viewer.id, subject: (p.data.subject ? `${p.data.reason}: ${p.data.subject}` : p.data.reason).slice(0, 200), message: p.data.message });
  if (error) return { error: tx("Nu am putut trimite mesajul.", "We could not send your message.") };
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (to) {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    await sendEmails([{ to, subject: `Mesaj nou (${p.data.reason}): ${p.data.subject || "fără subiect"}`.slice(0, 150), html: renderEmail({ title: "Mesaj nou de la un membru", body: `${esc(viewer.email)}<br><br>${esc(p.data.message).replace(/\n/g, "<br>")}`, ctaLabel: "Deschide în administrare", ctaUrl: `${env.siteUrl}/admin/mesaje` }) }]);
  }
  return { ok: tx("Mesajul a fost trimis. Îți răspundem pe emailul din cont.", "Your message was sent. We will reply to the email on your account.") };
}
