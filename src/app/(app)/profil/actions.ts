"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FormState } from "@/app/login/actions";
import { t } from "@/lib/texts";

const schema = z.object({ firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80) });

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireUser();
  const parsed = schema.safeParse({ firstName: formData.get("firstName"), lastName: formData.get("lastName") });
  if (!parsed.success) return { error: t.profile.required };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ first_name: parsed.data.firstName, last_name: parsed.data.lastName }).eq("id", viewer.id);
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
