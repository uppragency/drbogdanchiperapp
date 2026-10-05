"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function markHandled(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("contact_messages").update({ handled_at: formData.get("undo") ? null : new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/mesaje");
}
