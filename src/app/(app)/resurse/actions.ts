"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function setFavorite(resourceId: string, on: boolean): Promise<boolean> {
  const viewer = await requireUser();
  const id = z.string().uuid().safeParse(resourceId);
  if (!id.success) return !on;
  const supabase = await createClient();
  const { error } = on
    ? await supabase.from("favorites").upsert({ user_id: viewer.id, resource_id: id.data }, { onConflict: "user_id,resource_id", ignoreDuplicates: true })
    : await supabase.from("favorites").delete().eq("user_id", viewer.id).eq("resource_id", id.data);
  revalidatePath("/feed");
  return error ? !on : on;
}
