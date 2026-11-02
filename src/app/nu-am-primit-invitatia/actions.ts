"use server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { allow, clientIp } from "@/lib/throttle";
import { sendInvitations } from "@/lib/users";
import type { FormState } from "@/app/login/actions";
import { getT } from "@/lib/i18n";

// Sends the permanent activation link again to a member whose invitation is not accepted yet.
export async function requestInvite(_: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  const parsed = z.string().trim().toLowerCase().email().max(200).safeParse(formData.get("email"));
  // Always answer the same way so the form never reveals which emails exist.
  const done: FormState = { ok: t.noInvite.done };
  if (!parsed.success) return done;

  const ip = await clientIp();
  if (!(await allow(`invite-ip:${ip}`, 10, 3600))) return done;
  if (!(await allow(`invite-email:${parsed.data}`, 1, 3600))) return done;
  // Keeps the free Resend plan (100 emails per day) safe for password resets.
  if (!(await allow("invite-resend-global", 40, 86400))) return done;

  const admin = createAdminClient();
  const { data: p } = await admin.from("profiles").select("id,is_active,deleted_at").eq("email", parsed.data).maybeSingle();
  if (!p || !p.is_active || p.deleted_at) return done;
  const { data: inv } = await admin.from("invitations").select("accepted_at").eq("user_id", p.id).maybeSingle();
  if (!inv || inv.accepted_at) return done;
  await sendInvitations(admin, [p.id], true);
  return done;
}
