"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationsSeen() {
  const viewer = await requireUser();
  const supabase = await createClient();
  const now = new Date().toISOString();
  await Promise.all([
    supabase.from("profiles").update({ notifications_seen_at: now }).eq("id", viewer.id),
    supabase.from("notifications").update({ read_at: now }).eq("user_id", viewer.id).is("read_at", null),
  ]);
  revalidatePath("/", "layout");
}
