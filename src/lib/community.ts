import "server-only";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { getLocale, pick } from "@/lib/i18n";
import type { ShellCategory, ShellLink } from "@/components/community-shell";

type Row = { id: string; title: string; title_en: string | null; category_id: string; is_pinned: boolean; publish_at: string | null; created_at: string };

// Data for the shared side columns: category counters, announcements and same category suggestions.
export async function loadCommunity(viewerId: string, isAdmin: boolean, current?: { id: string; categoryId: string }) {
  const supabase = await createClient();
  const locale = await getLocale();
  const nowIso = new Date().toISOString();
  const [{ data: cats }, { data: rowsRaw }, { data: views }] = await Promise.all([
    supabase.from("categories").select("id,name,name_en,slug").order("position"),
    supabase
      .from("resources")
      .select("id,title,title_en,category_id,is_pinned,publish_at,created_at")
      .eq("status", "published")
      .is("deleted_at", null)
      .or(`publish_at.is.null,publish_at.lte.${nowIso}`)
      .order("publish_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("resource_views").select("resource_id").eq("user_id", viewerId),
  ]);
  const categories = ((cats ?? []) as ShellCategory[]).map((c) => ({ ...c, name: pick(locale, c.name, c.name_en) }));
  const rows = (rowsRaw ?? []) as Row[];
  const seen = new Set((views ?? []).map((v: { resource_id: string }) => v.resource_id));
  const weekAgo = new Date(nowIso).getTime() - 7 * 86400000;
  const isNew = (r: Row) => (isAdmin ? new Date(r.publish_at ?? r.created_at).getTime() > weekAgo : !seen.has(r.id));
  const link = (r: Row): ShellLink => ({ id: r.id, title: pick(locale, r.title, r.title_en), date: formatDate(r.publish_at ?? r.created_at, locale) });

  const newByCategory: Record<string, number> = {};
  rows.filter(isNew).forEach((r) => (newByCategory[r.category_id] = (newByCategory[r.category_id] ?? 0) + 1));
  const announceCat = categories.find((c) => c.slug === "anunturi");
  const announcements = announceCat ? rows.filter((r) => r.category_id === announceCat.id).sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned)).slice(0, 4).map(link) : [];
  const related = current ? rows.filter((r) => r.category_id === current.categoryId && r.id !== current.id).slice(0, 4).map(link) : [];

  return { categories, newByCategory, newTotal: rows.filter(isNew).length, announcements, related };
}
