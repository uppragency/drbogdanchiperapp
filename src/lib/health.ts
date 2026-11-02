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
  // The untagged list comes from a SQL function: the API returns at most 1000 rows, fewer than the resource_tags table holds.
  const [{ data: untagged }, { data: drafts }, { count: deadLinks }, { data: lastRow }] = await Promise.all([
    supabase.rpc("admin_untagged_resources"),
    supabase.from("resources").select("id,title").eq("status", "draft").is("deleted_at", null).not("publish_at", "is", null).limit(200),
    supabase.from("link_checks").select("resource_id", { count: "exact", head: true }).eq("ok", false),
    supabase.from("link_checks").select("checked_at").order("checked_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const now = Date.now();
  const rows = (untagged ?? []) as { id: string; title: string; publish_at: string | null }[];
  const pick = (r: { id: string; title: string }): HealthItem => ({ id: r.id, title: r.title });
  return {
    deadLinks: deadLinks ?? 0,
    lastLinkCheck: (lastRow as { checked_at: string } | null)?.checked_at ?? null,
    noGroup: rows.filter((r) => !(r.publish_at && Date.parse(r.publish_at) > now)).map(pick),
    scheduledNoGroup: rows.filter((r) => r.publish_at && Date.parse(r.publish_at) > now).map(pick),
    draftsWithDate: ((drafts ?? []) as { id: string; title: string }[]).map(pick),
  };
}
