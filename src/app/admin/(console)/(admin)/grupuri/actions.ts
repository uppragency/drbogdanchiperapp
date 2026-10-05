"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function saveWelcome(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const message = z.string().trim().max(1500).parse(formData.get("message") ?? "");
  const supabase = await createClient();
  await supabase.from("tags").update({ welcome_message: message }).eq("id", id);
  revalidatePath("/admin/grupuri");
  revalidatePath("/feed");
}
