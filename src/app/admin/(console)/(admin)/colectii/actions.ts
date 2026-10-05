"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const uuid = z.string().uuid();
const meta = z.object({ title: z.string().trim().min(1).max(160), description: z.string().trim().max(500), title_en: z.string().trim().max(160), description_en: z.string().trim().max(500) });

export async function createCollection(formData: FormData) {
  await requireAdmin();
  const p = meta.safeParse({ title: formData.get("title"), description: formData.get("description") ?? "", title_en: formData.get("titleEn") ?? "", description_en: formData.get("descriptionEn") ?? "" });
  if (!p.success) redirect("/admin/colectii");
  const supabase = await createClient();
  const { count } = await supabase.from("collections").select("id", { count: "exact", head: true });
  const { data } = await supabase.from("collections").insert({ ...p.data, position: (count ?? 0) + 1 }).select("id").single();
  revalidatePath("/colectii");
  redirect(data ? `/admin/colectii/${data.id}` : "/admin/colectii");
}

export async function updateCollection(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const p = meta.safeParse({ title: formData.get("title"), description: formData.get("description") ?? "", title_en: formData.get("titleEn") ?? "", description_en: formData.get("descriptionEn") ?? "" });
  if (!p.success) return;
  const supabase = await createClient();
  await supabase.from("collections").update(p.data).eq("id", id);
  revalidatePath("/colectii");
  revalidatePath(`/admin/colectii/${id}`);
}

export async function deleteCollection(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("collection_resources").delete().eq("collection_id", id);
  await supabase.from("collections").delete().eq("id", id);
  revalidatePath("/colectii");
  redirect("/admin/colectii");
}

export async function addToCollection(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const resourceId = uuid.safeParse(formData.get("resourceId"));
  if (!resourceId.success) return;
  const supabase = await createClient();
  const { count } = await supabase.from("collection_resources").select("resource_id", { count: "exact", head: true }).eq("collection_id", id);
  await supabase.from("collection_resources").upsert({ collection_id: id, resource_id: resourceId.data, position: (count ?? 0) + 1 }, { onConflict: "collection_id,resource_id", ignoreDuplicates: true });
  revalidatePath(`/admin/colectii/${id}`);
  revalidatePath("/colectii");
}

export async function removeFromCollection(formData: FormData) {
  await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const resourceId = uuid.parse(formData.get("resourceId"));
  const supabase = await createClient();
  await supabase.from("collection_resources").delete().eq("collection_id", id).eq("resource_id", resourceId);
  revalidatePath(`/admin/colectii/${id}`);
  revalidatePath("/colectii");
}
