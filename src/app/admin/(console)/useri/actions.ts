"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMember, ensureTags, sendInvitations, setUserTags, splitTags } from "@/lib/users";
import { localInputToIso } from "@/lib/format";
import { MIN_PASSWORD_LENGTH, isPasswordCompromised } from "@/lib/password";
import { confirmLink, resetEmail, sendEmails } from "@/lib/email";
import type { FormState } from "@/app/login/actions";

const uuid = z.string().uuid();
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).default("");
const toExpiry = (d: string) => (d ? localInputToIso(`${d}T23:59`) : null);

const base = z.object({
  firstName: z.string().trim().max(80).default(""),
  lastName: z.string().trim().max(80).default(""),
  tagIds: z.array(uuid),
  accessExpires: dateOnly,
  paidAt: dateOnly,
  paidNote: z.string().trim().max(300).default(""),
  adminNote: z.string().trim().max(1000).default(""),
});

function read(formData: FormData) {
  return {
    email: String(formData.get("email") ?? ""),
    firstName: formData.get("firstName") ?? "",
    lastName: formData.get("lastName") ?? "",
    tagIds: formData.getAll("tagIds").map(String),
    accessExpires: formData.get("accessExpires") ?? "",
    paidAt: formData.get("paidAt") ?? "",
    paidNote: formData.get("paidNote") ?? "",
    adminNote: formData.get("adminNote") ?? "",
  };
}

export async function createUser(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const raw = read(formData);
  const email = z.string().trim().email().max(200).safeParse(raw.email);
  const parsed = base.safeParse(raw);
  if (!email.success) return { error: "Emailul nu este valid." };
  if (!parsed.success) return { error: "Date invalide." };
  const password = String(formData.get("password") ?? "");
  if (password) {
    if (password.length < MIN_PASSWORD_LENGTH || password.length > 72) return { error: `Parola trebuie să aibă între ${MIN_PASSWORD_LENGTH} și 72 de caractere.` };
    if (await isPasswordCompromised(password)) return { error: "Această parolă apare în breșe de securitate cunoscute. Alege alta." };
  }
  const admin = createAdminClient();
  const res = await createMember(admin, {
    password: password || undefined,
    email: email.data,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    tagIds: parsed.data.tagIds,
    accessExpiresAt: toExpiry(parsed.data.accessExpires),
    paidAt: parsed.data.paidAt || null,
  });
  if (!res.id) return { error: res.error };
  if (formData.get("sendInvite") === "on") await sendInvitations(admin, [res.id]);
  revalidatePath("/admin/useri");
  redirect(`/admin/useri/${res.id}`);
}

export async function updateUser(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = uuid.safeParse(formData.get("id"));
  const parsed = base.safeParse(read(formData));
  if (!id.success || !parsed.success) return { error: "Date invalide." };
  const admin = createAdminClient();
  const d = parsed.data;
  const { error } = await admin
    .from("profiles")
    .update({
      first_name: d.firstName,
      last_name: d.lastName,
      access_expires_at: toExpiry(d.accessExpires),
      paid_at: d.paidAt || null,
      paid_note: d.paidNote || null,
      admin_note: d.adminNote || null,
      is_active: formData.get("isActive") === "on",
    })
    .eq("id", id.data);
  if (error) return { error: "Nu am putut salva." };
  await setUserTags(admin, id.data, d.tagIds);
  revalidatePath("/admin/useri");
  revalidatePath(`/admin/useri/${id.data}`);
  return { ok: "Datele au fost salvate." };
}

export async function resetSessions(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await createAdminClient().rpc("reset_user_sessions", { p_user: id });
  revalidatePath(`/admin/useri/${id}`);
}

export async function resendInvite(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  await sendInvitations(createAdminClient(), [id]);
  revalidatePath(`/admin/useri/${id}`);
}

async function guardNotAdmin(id: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("role").eq("id", id).maybeSingle();
  if (!data || data.role === "admin") throw new Error("Operațiune interzisă pentru administrator.");
  return admin;
}

export async function trashUser(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const admin = await guardNotAdmin(id);
  await admin.from("profiles").update({ deleted_at: new Date().toISOString(), is_active: false }).eq("id", id);
  await admin.rpc("reset_user_sessions", { p_user: id });
  await admin.auth.admin.updateUserById(id, { ban_duration: "876000h" });
  revalidatePath("/admin/useri");
  redirect("/admin/useri");
}

export async function restoreUser(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const admin = await guardNotAdmin(id);
  await admin.auth.admin.updateUserById(id, { ban_duration: "none" });
  await admin.from("profiles").update({ deleted_at: null, is_active: true }).eq("id", id);
  revalidatePath("/admin/useri");
  redirect(`/admin/useri/${id}`);
}

export async function purgeUser(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const admin = await guardNotAdmin(id);
  await admin.auth.admin.deleteUser(id);
  revalidatePath("/admin/useri");
  redirect("/admin/useri?stare=sters");
}

export type ImportRow = { email: string; firstName: string; lastName: string; tags: string };
export type ImportResult = { email: string; status: "created" | "exists" | "error"; message?: string };

// Called in small chunks from the browser so each request stays well below the platform time limit.
export async function importUsers(rows: ImportRow[]): Promise<ImportResult[]> {
  await requireAdmin();
  if (!Array.isArray(rows) || rows.length > 40) return [{ email: "", status: "error", message: "Lot prea mare." }];
  const admin = createAdminClient();
  const emailSchema = z.string().trim().email().max(200);
  const results: ImportResult[] = [];
  for (const row of rows) {
    const email = emailSchema.safeParse(row.email);
    if (!email.success) {
      results.push({ email: String(row.email ?? ""), status: "error", message: "Email invalid" });
      continue;
    }
    const names = splitTags(String(row.tags ?? ""));
    const tagMap = await ensureTags(admin, names);
    const res = await createMember(admin, {
      email: email.data,
      firstName: String(row.firstName ?? "").trim().slice(0, 80),
      lastName: String(row.lastName ?? "").trim().slice(0, 80),
      tagIds: names.map((n) => tagMap.get(n)).filter((x): x is string => Boolean(x)),
    });
    if (res.id) results.push({ email: email.data, status: "created" });
    else results.push({ email: email.data, status: /deja/.test(res.error ?? "") ? "exists" : "error", message: res.error });
  }
  revalidatePath("/admin/useri");
  return results;
}

export async function sendNextInvitations(formData: FormData) {
  await requireAdmin();
  const mode = formData.get("mode") === "reminder" ? "reminder" : "first";
  const admin = createAdminClient();
  const limit = 30;
  let query = admin.from("invitations").select("user_id,profiles!inner(is_active,deleted_at)").is("accepted_at", null).eq("profiles.is_active", true).is("profiles.deleted_at", null).limit(limit);
  if (mode === "first") query = query.is("sent_at", null);
  else query = query.not("sent_at", "is", null).lt("last_reminder_at", new Date(Date.now() - 3 * 86400000).toISOString());
  const { data } = await query;
  const ids = (data ?? []).map((r: { user_id: string }) => r.user_id);
  const res = await sendInvitations(admin, ids);
  revalidatePath("/admin/invitatii");
  redirect(`/admin/invitatii?trimise=${res.sent}&esuate=${res.failed.length}`);
}

// Confirms the email in Auth, activates the profile and lifts any ban from a previous deletion.
export async function validateAccount(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const admin = createAdminClient();
  await admin.auth.admin.updateUserById(id, { email_confirm: true, ban_duration: "none" });
  await admin.from("profiles").update({ is_active: true, deleted_at: null }).eq("id", id);
  revalidatePath(`/admin/useri/${id}`);
  revalidatePath("/admin/useri");
}

export async function setUserPassword(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = z
    .object({ id: uuid, password: z.string().min(MIN_PASSWORD_LENGTH, `Parola trebuie să aibă cel puțin ${MIN_PASSWORD_LENGTH} caractere.`).max(72, "Parola poate avea cel mult 72 de caractere.") })
    .safeParse({ id: formData.get("id"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Date invalide." };
  if (await isPasswordCompromised(parsed.data.password)) return { error: "Această parolă apare în breșe de securitate cunoscute. Alege alta." };

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id").eq("id", parsed.data.id).maybeSingle();
  if (!profile) return { error: "Userul nu există." };
  const { error } = await admin.auth.admin.updateUserById(parsed.data.id, { password: parsed.data.password, email_confirm: true });
  if (error) return { error: "Nu am putut seta parola." };
  if (formData.get("logout") === "on") await admin.rpc("reset_user_sessions", { p_user: parsed.data.id });
  revalidatePath(`/admin/useri/${parsed.data.id}`);
  return { ok: "Parola a fost setată. Comunic-o userului pe un canal sigur." };
}

export async function sendResetLink(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const admin = createAdminClient();
  const { data: p } = await admin.from("profiles").select("email").eq("id", id).maybeSingle();
  if (!p) return;
  const { data } = await admin.auth.admin.generateLink({ type: "recovery", email: p.email });
  const hash = data?.properties?.hashed_token;
  if (hash) await sendEmails([resetEmail(p.email, confirmLink(hash, "/setare-parola"))]);
  revalidatePath(`/admin/useri/${id}`);
}
