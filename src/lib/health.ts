import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type HealthItem = { id: string; title: string };
export type Health = {
  deadLinks: number;
  lastLinkCheck: string | null;
  noGroup: HealthItem[];
  scheduledNoGroup: HealthItem[];
  draftsWithDate: HealthItem[];
};

// Problems an admin would otherwise only find by accident. Computed live from the database.
export async function platformHealth(supabase: SupabaseClient): Promise<Health> {
  const [{ data: res }, { data: tags }, { data: links }, { data: lastRow }] = await Promise.all([
    supabase.from("resources").select("id,title,status,publish_at").is("deleted_at", null).limit(5000),
    supabase.from("resource_tags").select("resource_id").limit(20000),
    supabase.from("link_checks").select("resource_id").eq("ok", false).limit(5000),
    supabase.from("link_checks").select("checked_at").order("checked_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const tagged = new Set(((tags ?? []) as { resource_id: string }[]).map((t) => t.resource_id));
  const now = Date.now();
  const rows = (res ?? []) as { id: string; title: string; status: string; publish_at: string | null }[];
  const pick = (r: { id: string; title: string }): HealthItem => ({ id: r.id, title: r.title });
  const published = rows.filter((r) => r.status === "published");
  return {
    deadLinks: (links ?? []).length,
    lastLinkCheck: (lastRow as { checked_at: string } | null)?.checked_at ?? null,
    noGroup: published.filter((r) => !tagged.has(r.id) && !(r.publish_at && Date.parse(r.publish_at) > now)).map(pick),
    scheduledNoGroup: published.filter((r) => !tagged.has(r.id) && r.publish_at && Date.parse(r.publish_at) > now).map(pick),
    draftsWithDate: rows.filter((r) => r.status === "draft" && r.publish_at).map(pick),
  };
}
