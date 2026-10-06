"use server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getLocale, pick } from "@/lib/i18n";

// One vote per member and question; a new vote replaces the old one.
export async function rateFaq(faqId: string, helpful: boolean) {
  const viewer = await requireUser();
  const id = z.string().uuid().safeParse(faqId);
  if (!id.success) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("faq_feedback").upsert({ faq_id: id.data, user_id: viewer.id, helpful, updated_at: new Date().toISOString() }, { onConflict: "faq_id,user_id" });
  return { ok: !error };
}

// Posts from "Întrebări și răspunsuri" that match a search the FAQ could not answer.
export async function searchQa(q: string): Promise<{ id: string; title: string }[]> {
  await requireUser();
  const needle = q.replace(/[%,()*\\]/g, " ").trim().slice(0, 80);
  if (needle.length < 2) return [];
  const supabase = await createClient();
  const locale = await getLocale();
  const { data: cat } = await supabase.from("categories").select("id").eq("slug", "intrebari-si-raspunsuri").maybeSingle();
  if (!cat) return [];
  const { data: hits } = await supabase.rpc("search_resources", { p_q: needle, p_en: locale === "en" });
  const ids = (hits ?? []).map((h: { id: string }) => h.id).slice(0, 60);
  if (ids.length === 0) return [];
  const { data } = await supabase.from("resources").select("id,title,title_en").in("id", ids).eq("category_id", cat.id).eq("status", "published").is("deleted_at", null).limit(3);
  return (data ?? []).map((r) => ({ id: r.id as string, title: pick(locale, r.title as string, r.title_en as string) }));
}
