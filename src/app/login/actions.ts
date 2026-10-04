"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { allow, clientIp } from "@/lib/throttle";
import { safeNext } from "@/lib/safe-next";
import { t } from "@/lib/texts";

export type FormState = { error?: string; ok?: string; field?: string };

const schema = z.object({ email: z.string().trim().email().max(200), password: z.string().min(1).max(200) });

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: t.login.invalid, field: "password" };

  const ip = await clientIp();
  const okIp = await allow(`login-ip:${ip}`, 30, 900);
  const okEmail = await allow(`login-email:${parsed.data.email}`, 8, 900);
  if (!okIp || !okEmail) return { error: t.login.throttled, field: "password" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: t.login.invalid, field: "password" };

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const next = safeNext(String(formData.get("next") ?? ""));
  if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") redirect(`/mfa?next=${encodeURIComponent(next)}`);
  redirect(next);
}
