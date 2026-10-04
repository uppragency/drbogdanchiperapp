"use server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { allow, clientIp } from "@/lib/throttle";
import { renderEmail, sendEmails } from "@/lib/email";
import { getTx } from "@/lib/i18n";
import { env } from "@/lib/env";
import type { FormState } from "@/app/login/actions";

const makeSchema = (tx: (ro: string, en: string) => string) =>
  z.object({
    firstName: z.string().trim().min(1, tx("Completează prenumele.", "Enter your first name.")).max(80),
    lastName: z.string().trim().max(80),
    email: z.string().trim().toLowerCase().email(tx("Emailul nu este valid.", "The email address is not valid.")).max(200),
    message: z.string().trim().max(1000),
  });

export async function requestAccess(_: FormState, formData: FormData): Promise<FormState> {
  const tx = await getTx();
  const DONE = tx("Cererea a fost trimisă. Revenim pe email după ce o analizăm.", "Your request has been sent. We will get back to you by email once we review it.");
  if (String(formData.get("website") ?? "")) return { ok: DONE }; // honeypot
  const p = makeSchema(tx).safeParse({ firstName: formData.get("firstName"), lastName: formData.get("lastName") ?? "", email: formData.get("email"), message: formData.get("message") ?? "" });
  if (!p.success) return { error: p.error.issues[0]?.message ?? tx("Date invalide.", "Invalid data.") };
  const ip = await clientIp();
  if (!(await allow(`access-ip:${ip}`, 5, 3600)) || !(await allow(`access-email:${p.data.email}`, 2, 86400))) return { error: tx("Ai trimis prea multe cereri. Încearcă din nou mai târziu.", "You have sent too many requests. Please try again later.") };

  const admin = createAdminClient();
  const { data: existing } = await admin.from("access_requests").select("id").eq("email", p.data.email).eq("status", "pending").maybeSingle();
  if (existing) return { ok: DONE };
  const { error } = await admin.from("access_requests").insert({ email: p.data.email, first_name: p.data.firstName, last_name: p.data.lastName, message: p.data.message });
  if (error) return { error: tx("Nu am putut trimite cererea. Încearcă din nou.", "We could not send your request. Please try again.") };

  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (to) {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    await sendEmails([{ to, subject: "Cerere nouă de acces", html: renderEmail({ title: "Cerere nouă de acces", body: `${esc(`${p.data.firstName} ${p.data.lastName}`.trim())}<br>${esc(p.data.email)}`, ctaLabel: "Vezi cererea", ctaUrl: `${env.siteUrl}/admin/cereri` }) }]);
  }
  return { ok: DONE };
}
