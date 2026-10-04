"use server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { allow, clientIp } from "@/lib/throttle";
import { renderEmail, sendEmails } from "@/lib/email";
import { env } from "@/lib/env";
import type { FormState } from "@/app/login/actions";

const schema = z.object({
  firstName: z.string().trim().min(1, "Completează prenumele.").max(80),
  lastName: z.string().trim().max(80),
  email: z.string().trim().toLowerCase().email("Emailul nu este valid.").max(200),
  message: z.string().trim().max(1000),
});
const DONE = "Cererea a fost trimisă. Revenim pe email după ce o analizăm.";

export async function requestAccess(_: FormState, formData: FormData): Promise<FormState> {
  if (String(formData.get("website") ?? "")) return { ok: DONE }; // honeypot
  const p = schema.safeParse({ firstName: formData.get("firstName"), lastName: formData.get("lastName") ?? "", email: formData.get("email"), message: formData.get("message") ?? "" });
  if (!p.success) return { error: p.error.issues[0]?.message ?? "Date invalide." };
  const ip = await clientIp();
  if (!(await allow(`access-ip:${ip}`, 5, 3600)) || !(await allow(`access-email:${p.data.email}`, 2, 86400))) return { error: "Ai trimis prea multe cereri. Încearcă din nou mai târziu." };

  const admin = createAdminClient();
  const { data: existing } = await admin.from("access_requests").select("id").eq("email", p.data.email).eq("status", "pending").maybeSingle();
  if (existing) return { ok: DONE };
  const { error } = await admin.from("access_requests").insert({ email: p.data.email, first_name: p.data.firstName, last_name: p.data.lastName, message: p.data.message });
  if (error) return { error: "Nu am putut trimite cererea. Încearcă din nou." };

  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (to) {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    await sendEmails([{ to, subject: "Cerere nouă de acces", html: renderEmail({ title: "Cerere nouă de acces", body: `${esc(`${p.data.firstName} ${p.data.lastName}`.trim())}<br>${esc(p.data.email)}`, ctaLabel: "Vezi cererea", ctaUrl: `${env.siteUrl}/admin/cereri` }) }]);
  }
  return { ok: DONE };
}
