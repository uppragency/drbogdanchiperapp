"use server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { allow, clientIp } from "@/lib/throttle";
import { confirmLink, resetEmail, sendEmails } from "@/lib/email";
import type { FormState } from "@/app/login/actions";
import { t } from "@/lib/texts";

export async function requestReset(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.string().trim().email().max(200).safeParse(formData.get("email"));
  // Always answer the same way so the form never reveals which emails exist.
  const done: FormState = { ok: t.forgot.done };
  if (!parsed.success) return done;

  const ip = await clientIp();
  if (!(await allow(`reset-ip:${ip}`, 10, 3600)) || !(await allow(`reset-email:${parsed.data}`, 3, 3600))) return done;

  const admin = createAdminClient();
  const { data } = await admin.auth.admin.generateLink({ type: "recovery", email: parsed.data });
  const hash = data?.properties?.hashed_token;
  if (hash) await sendEmails([resetEmail(parsed.data, confirmLink(hash, "/setare-parola"))]);
  return done;
}
