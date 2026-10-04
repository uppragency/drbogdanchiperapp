"use server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { allow } from "@/lib/throttle";
import { renderEmail, sendEmails } from "@/lib/email";
import { env } from "@/lib/env";
import type { FormState } from "@/app/login/actions";

const schema = z.object({ subject: z.string().trim().max(120), message: z.string().trim().min(5, "Scrie un mesaj de cel puțin 5 caractere.").max(5000) });

export async function sendContact(_: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireUser();
  const p = schema.safeParse({ subject: formData.get("subject") ?? "", message: formData.get("message") });
  if (!p.success) return { error: p.error.issues[0]?.message ?? "Date invalide." };
  if (!(await allow(`contact:${viewer.id}`, 5, 3600))) return { error: "Ai trimis prea multe mesaje. Încearcă din nou peste o oră." };
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert({ user_id: viewer.id, subject: p.data.subject, message: p.data.message });
  if (error) return { error: "Nu am putut trimite mesajul." };
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (to) {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    await sendEmails([{ to, subject: `Mesaj nou: ${p.data.subject || "fără subiect"}`.slice(0, 150), html: renderEmail({ title: "Mesaj nou de la un membru", body: `${esc(viewer.email)}<br><br>${esc(p.data.message).replace(/\n/g, "<br>")}`, ctaLabel: "Deschide în administrare", ctaUrl: `${env.siteUrl}/admin/mesaje` }) }]);
  }
  return { ok: "Mesajul a fost trimis. Îți răspundem pe emailul din cont." };
}
