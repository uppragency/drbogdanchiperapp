"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FormState } from "@/app/login/actions";
import { getT, getTx } from "@/lib/i18n";
import { allow } from "@/lib/throttle";
import { renderEmail, sendEmails } from "@/lib/email";
import { env } from "@/lib/env";
import { SPECIALTY_KEYS } from "@/lib/specialties";

const schema = z.object({ firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80), specialty: z.enum(["", ...SPECIALTY_KEYS]).default(""), city: z.string().trim().max(80).default("") });

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireUser();
  const t = await getT();
  const parsed = schema.safeParse({ firstName: formData.get("firstName"), lastName: formData.get("lastName"), specialty: formData.get("specialty") ?? "", city: formData.get("city") ?? "" });
  if (!parsed.success) return { error: t.profile.required };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ first_name: parsed.data.firstName, last_name: parsed.data.lastName, specialty: parsed.data.specialty, city: parsed.data.city }).eq("id", viewer.id);
  if (error) return { error: t.common.error };
  revalidatePath("/profil");
  return { ok: t.profile.saved };
}

// Signs the member out of one specific device. The current device is excluded (it uses the normal sign out).
export async function revokeDevice(formData: FormData) {
  const viewer = await requireUser();
  const id = z.string().uuid().safeParse(formData.get("session"));
  if (!id.success || id.data === viewer.sessionId) return;
  await createAdminClient().rpc("revoke_session", { p_user: viewer.id, p_session: id.data });
  revalidatePath("/profil");
}

export async function completeTour() {
  const viewer = await requireUser();
  const supabase = await createClient();
  await supabase.from("profiles").update({ tour_seen_at: new Date().toISOString() }).eq("id", viewer.id);
}

// Personal notes: private to the member. Written with the service role after checking the resource is visible to them (admins have no group tags, so the row policy alone would block them).
export async function saveNote(resourceId: string, body: string): Promise<boolean> {
  const viewer = await requireUser();
  const id = z.string().uuid().safeParse(resourceId);
  const text = z.string().trim().max(4000).safeParse(body);
  if (!id.success || !text.success) return false;
  const supabase = await createClient();
  const { data: visible } = await supabase.from("resources").select("id").eq("id", id.data).is("deleted_at", null).maybeSingle();
  if (!visible) return false;
  const admin = createAdminClient();
  if (!text.data) {
    const { error } = await admin.from("resource_notes").delete().eq("user_id", viewer.id).eq("resource_id", id.data);
    revalidatePath("/profil");
    return !error;
  }
  const { error } = await admin.from("resource_notes").upsert({ user_id: viewer.id, resource_id: id.data, body: text.data, updated_at: new Date().toISOString() }, { onConflict: "user_id,resource_id" });
  revalidatePath("/profil");
  return !error;
}

export async function setWeeklyGoal(_: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireUser();
  const tx = await getTx();
  const supabase = await createClient();
  const raw = String(formData.get("goal") ?? "");
  if (raw === "0") {
    await supabase.from("user_goals").delete().eq("user_id", viewer.id);
    revalidatePath("/profil");
    return { ok: tx("Obiectivul a fost scos.", "Goal removed.") };
  }
  const n = z.coerce.number().int().min(1).max(20).safeParse(raw);
  if (!n.success) return { error: tx("Alege un număr între 1 și 20.", "Choose a number between 1 and 20.") };
  const { error } = await supabase.from("user_goals").upsert({ user_id: viewer.id, weekly_goal: n.data, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) return { error: tx("Nu am putut salva.", "Could not save.") };
  revalidatePath("/profil");
  return { ok: tx("Obiectivul a fost salvat.", "Goal saved.") };
}

// Email changes are done by the team, so this just sends them a prefilled request.
export async function requestEmailChange(_: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireUser();
  const tx = await getTx();
  const email = z.string().trim().toLowerCase().email().max(200).safeParse(formData.get("email"));
  if (!email.success) return { error: tx("Adresa de email nu este validă.", "The email address is not valid.") };
  if (email.data === viewer.email.toLowerCase()) return { error: tx("Aceasta este deja adresa contului.", "This is already your account email.") };
  if (!(await allow(`email-change:${viewer.id}`, 3, 3600))) return { error: tx("Ai trimis prea multe cereri. Încearcă din nou peste o oră.", "Too many requests. Try again in an hour.") };
  const supabase = await createClient();
  const message = `Cerere de schimbare a adresei de email.\nAdresa actuală: ${viewer.email}\nAdresa nouă dorită: ${email.data}`;
  const { error } = await supabase.from("contact_messages").insert({ user_id: viewer.id, subject: "Acces: Schimbare email", message });
  if (error) return { error: tx("Nu am putut trimite cererea.", "We could not send the request.") };
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (to) {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    await sendEmails([{ to, subject: "Cerere schimbare email", html: renderEmail({ title: "Cerere de schimbare a emailului", body: esc(message).replace(/\n/g, "<br>"), ctaLabel: "Deschide în administrare", ctaUrl: `${env.siteUrl}/admin/mesaje` }) }]);
  }
  return { ok: tx("Cererea a fost trimisă. Echipa schimbă adresa și te anunță.", "Request sent. The team will change the address and let you know.") };
}
