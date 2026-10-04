"use server";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export type SearchHit = { id: string; title: string; category: string; type: "video" | "pdf" | "text" | "link" };
export type NoticeItem = { key: string; kind: "reply" | "new"; text: string; sub: string; href: string; unread: boolean };

export async function searchPreview(q: string): Promise<SearchHit[]> {
  await requireUser();
  const needle = q.trim().slice(0, 80).replace(/[%,()*\\]/g, " ").trim();
  if (needle.length < 2) return [];
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from("resources")
    .select("id,title,type,categories(name)")
    .eq("status", "published")
    .is("deleted_at", null)
    .or(`publish_at.is.null,publish_at.lte.${nowIso}`)
    .or(`title.ilike.%${needle}%,description.ilike.%${needle}%,body.ilike.%${needle}%`)
    .order("created_at", { ascending: false })
    .limit(8);
  return ((data ?? []) as unknown as { id: string; title: string; type: SearchHit["type"]; categories: { name: string } | { name: string }[] | null }[]).map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    category: (Array.isArray(r.categories) ? r.categories[0]?.name : r.categories?.name) ?? "",
  }));
}

export async function notificationsPreview(): Promise<NoticeItem[]> {
  const viewer = await requireUser();
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data: prof } = await supabase.from("profiles").select("notifications_seen_at").eq("id", viewer.id).maybeSingle();
  const seen = (prof?.notifications_seen_at as string | undefined) ?? now;
  const [{ data: replies }, { data: fresh }] = await Promise.all([
    supabase.from("notifications").select("id,resource_id,message,created_at,read_at").eq("user_id", viewer.id).order("created_at", { ascending: false }).limit(6),
    supabase
      .from("resources")
      .select("id,title,publish_at,created_at,categories(name)")
      .eq("status", "published")
      .is("deleted_at", null)
      .or(`and(publish_at.is.null,created_at.gt.${seen}),and(publish_at.gt.${seen},publish_at.lte.${now})`)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const items: NoticeItem[] = [
    ...((fresh ?? []) as unknown as { id: string; title: string; publish_at: string | null; created_at: string; categories: { name: string } | { name: string }[] | null }[]).map((r) => ({
      key: `f-${r.id}`,
      kind: "new" as const,
      text: `Resursă nouă: ${r.title}`,
      sub: `${(Array.isArray(r.categories) ? r.categories[0]?.name : r.categories?.name) ?? ""} · ${formatDate(r.publish_at ?? r.created_at)}`,
      href: `/resurse/${r.id}`,
      unread: true,
    })),
    ...((replies ?? []) as { id: string; resource_id: string; message: string; created_at: string; read_at: string | null }[]).map((r) => ({
      key: r.id,
      kind: "reply" as const,
      text: r.message,
      sub: formatDate(r.created_at),
      href: `/resurse/${r.resource_id}#comentarii`,
      unread: !r.read_at,
    })),
  ];
  return items.slice(0, 8);
}
