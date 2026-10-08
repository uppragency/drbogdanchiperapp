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

export async function setCompleted(resourceId: string, on: boolean): Promise<boolean> {
  await requireUser();
  const id = z.string().uuid().safeParse(resourceId);
  if (!id.success) return !on;
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_completed", { p_resource: id.data, p_on: on });
  revalidatePath("/feed");
  revalidatePath("/colectii");
  return error ? !on : on;
}

export async function setLike(resourceId: string, on: boolean): Promise<{ liked: boolean; count: number } | null> {
  const viewer = await requireUser();
  const id = z.string().uuid().safeParse(resourceId);
  if (!id.success) return null;
  const supabase = await createClient();
  const { error } = on
    ? await supabase.from("resource_likes").upsert({ user_id: viewer.id, resource_id: id.data }, { onConflict: "user_id,resource_id", ignoreDuplicates: true })
    : await supabase.from("resource_likes").delete().eq("user_id", viewer.id).eq("resource_id", id.data);
  if (error) return null;
  const { data } = await supabase.rpc("resource_like_counts", { p_ids: [id.data] });
  const count = Number((data as { n: number }[] | null)?.[0]?.n ?? 0);
  return { liked: on, count };
}
