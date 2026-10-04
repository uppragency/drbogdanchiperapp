import type { SupabaseClient } from "@supabase/supabase-js";

// Categories the member follows. Empty means no filtering: every new resource counts.
export async function followedCategoryIds(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const { data } = await supabase.from("category_subscriptions").select("category_id").eq("user_id", userId);
  return ((data ?? []) as { category_id: string }[]).map((r) => r.category_id);
}

// Unread count = replies not yet read + resources published after the member last opened notifications.
// Visibility of resources is enforced by row level security.
export async function notificationCount(supabase: SupabaseClient, userId: string): Promise<number> {
  const { data: prof } = await supabase.from("profiles").select("notifications_seen_at").eq("id", userId).maybeSingle();
  const seen = (prof?.notifications_seen_at as string | undefined) ?? new Date().toISOString();
  const now = new Date().toISOString();
  const followed = await followedCategoryIds(supabase, userId);
  let freshQuery = supabase
    .from("resources")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .is("deleted_at", null)
    .or(`and(publish_at.is.null,created_at.gt.${seen}),and(publish_at.gt.${seen},publish_at.lte.${now})`);
  if (followed.length > 0) freshQuery = freshQuery.in("category_id", followed);
  const [{ count: replies }, { count: fresh }] = await Promise.all([
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null),
    freshQuery,
  ]);
  return (replies ?? 0) + (fresh ?? 0);
}
