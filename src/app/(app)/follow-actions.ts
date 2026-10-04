"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Follows or unfollows a category for the signed-in member. Returns the resulting state.
export async function setCategoryFollow(categoryId: string, on: boolean): Promise<boolean> {
  const viewer = await requireUser();
  const id = z.string().uuid().safeParse(categoryId);
  if (!id.success) return !on;
  const supabase = await createClient();
  const { error } = on
    ? await supabase.from("category_subscriptions").upsert({ user_id: viewer.id, category_id: id.data }, { onConflict: "user_id,category_id", ignoreDuplicates: true })
    : await supabase.from("category_subscriptions").delete().eq("user_id", viewer.id).eq("category_id", id.data);
  revalidatePath("/profil");
  revalidatePath("/feed");
  revalidatePath("/notificari");
  return error ? !on : on;
}
