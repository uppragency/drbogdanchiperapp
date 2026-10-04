import "server-only";
import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { confirmLink, inviteEmail, sendEmails } from "@/lib/email";

type Admin = ReturnType<typeof createAdminClient>;

// Accepts "3", "MentorMed 3" or any custom name. Numbers map to "MentorMed N".
export function normalizeTagName(raw: string) {
  const v = raw.trim();
  if (!v) return "";
  return /^\d{1,3}$/.test(v) ? `MentorMed ${Number(v)}` : v.replace(/\s+/g, " ");
}

export function splitTags(raw: string) {
  return Array.from(new Set(raw.split(/[;,|]/).map(normalizeTagName).filter(Boolean)));
}

// Finds tags by name (case insensitive) and creates the missing ones.
export async function ensureTags(admin: Admin, names: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!names.length) return map;
  const { data: existing } = await admin.from("tags").select("id,name,position");
  const byLower = new Map<string, string>((existing ?? []).map((t: { id: string; name: string }) => [t.name.toLowerCase(), t.id]));
  let position = Math.max(0, ...(existing ?? []).map((t: { position: number }) => t.position));
  for (const name of names) {
    let id = byLower.get(name.toLowerCase());
    if (!id) {
      position += 1;
      const { data } = await admin.from("tags").insert({ name, position }).select("id").single();
      id = data?.id;
      if (id) byLower.set(name.toLowerCase(), id);
    }
    if (id) map.set(name, id);
  }
  return map;
}

export async function setUserTags(admin: Admin, userId: string, tagIds: string[]) {
  await admin.from("user_tags").delete().eq("user_id", userId);
  if (tagIds.length) await admin.from("user_tags").insert(tagIds.map((tag_id) => ({ user_id: userId, tag_id })));
}

export type CreateUserInput = { email: string; firstName: string; lastName: string; tagIds: string[]; accessExpiresAt?: string | null; paidAt?: string | null; password?: string };

export async function createMember(admin: Admin, input: CreateUserInput): Promise<{ id?: string; error?: string }> {
  const email = input.email.trim().toLowerCase();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password: input.password || randomBytes(24).toString("base64url"),
    user_metadata: { first_name: input.firstName, last_name: input.lastName },
  });
  if (error || !data.user) return { error: /already|registered|exists/i.test(error?.message ?? "") ? "Există deja un cont cu acest email." : "Nu am putut crea contul." };
  const id = data.user.id;
  await admin.from("profiles").update({ first_name: input.firstName, last_name: input.lastName, access_expires_at: input.accessExpiresAt ?? null, paid_at: input.paidAt ?? null }).eq("id", id);
  await setUserTags(admin, id, input.tagIds);
  await admin.from("invitations").insert({ user_id: id });
  return { id };
}

// Generates a one time link per user and sends the invitation. Marks invitations as sent.
export async function sendInvitations(admin: Admin, userIds: string[]): Promise<{ sent: number; failed: string[] }> {
  if (!userIds.length) return { sent: 0, failed: [] };
  const { data: profiles } = await admin.from("profiles").select("id,email").in("id", userIds);
  const emails: { id: string; mail: ReturnType<typeof inviteEmail> }[] = [];
  const failed: string[] = [];
  for (const p of profiles ?? []) {
    const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email: p.email });
    const hash = data?.properties?.hashed_token;
    if (error || !hash) failed.push(p.email);
    else emails.push({ id: p.id, mail: inviteEmail(p.email, confirmLink(hash, "/setare-parola")) });
  }
  const res = await sendEmails(emails.map((e) => e.mail));
  const failedSet = new Set(res.failed);
  const okIds = emails.filter((e) => !failedSet.has(e.mail.to)).map((e) => e.id);
  const now = new Date().toISOString();
  if (okIds.length) {
    await admin.from("invitations").update({ sent_at: now, last_reminder_at: now }).in("user_id", okIds);
  }
  return { sent: okIds.length, failed: [...failed, ...res.failed] };
}
