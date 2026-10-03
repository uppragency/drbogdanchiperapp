"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/app/login/actions";
import { t } from "@/lib/texts";

export async function acceptTerms(_: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireUser({ allowUnacceptedTerms: true });
  if (formData.get("accept") !== "on") return { error: t.terms.required };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ terms_accepted_at: new Date().toISOString() }).eq("id", viewer.id);
  if (error) return { error: t.common.error };
  redirect("/feed");
}
