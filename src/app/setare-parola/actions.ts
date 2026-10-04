"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { isPasswordCompromised, MIN_PASSWORD_LENGTH } from "@/lib/password";
import type { FormState } from "@/app/login/actions";
import { getT } from "@/lib/i18n";

export async function setPassword(_: FormState, formData: FormData): Promise<FormState> {
  await requireUser({ allowUnacceptedTerms: true });
  const t = await getT();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < MIN_PASSWORD_LENGTH) return { error: t.setPassword.tooShort };
  if (password !== confirm) return { error: t.setPassword.mismatch };
  if (await isPasswordCompromised(password)) return { error: t.setPassword.compromised };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: t.setPassword.failed };
  redirect("/feed");
}
