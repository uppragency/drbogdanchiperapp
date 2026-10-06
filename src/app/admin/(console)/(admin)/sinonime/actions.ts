"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// "GBR, regenerare osoasă ghidată" becomes one group: a search for any of them also finds the others.
export async function saveSynonyms(formData: FormData) {
  await requireAdmin();
  const terms = [...new Set(String(formData.get("terms") ?? "").split(/[,\n]/).map((t) => t.trim().slice(0, 80)).filter((t) => t.length >= 2))].slice(0, 20);
  if (terms.length < 2) return;
  const supabase = await createClient();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (id.success) await supabase.from("search_synonyms").update({ terms }).eq("id", id.data);
  else await supabase.from("search_synonyms").insert({ terms });
  revalidatePath("/admin/sinonime");
}

export async function deleteSynonyms(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("search_synonyms").delete().eq("id", id);
  revalidatePath("/admin/sinonime");
}
