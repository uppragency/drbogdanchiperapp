"use server";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { getLocale, getTx, pick } from "@/lib/i18n";

export type SearchHit = { id: string; title: string; category: string; type: "video" | "pdf" | "text" | "link" };
export type NoticeItem = { key: string; kind: "reply" | "new"; text: string; sub: string; href: string; unread: boolean };

export async function searchPreview(q: string): Promise<SearchHit[]> {
  await requireUser();
  const needle = q.trim().slice(0, 80).replace(/[%,()*\\]/g, " ").trim();
  if (needle.length < 2) return [];
  const supabase = await createClient();
  const locale = await getLocale();
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from("resources")
    .select("id,title,title_en,type,categories(name,name_en)")
    .eq("status", "published")
    .is("deleted_at", null)
    .or(`publish_at.is.null,publish_at.lte.${nowIso}`)
    .or(`title.ilike.%${needle}%,description.ilike.%${needle}%,presenter.ilike.%${needle}%,body.ilike.%${needle}%${locale === "en" ? `,title_en.ilike.%${needle}%,description_en.ilike.%${needle}%,body_en.ilike.%${needle}%` : ""}`)
    .order("created_at", { ascending: false })
    .limit(8);
  type Cat = { name: string; name_en: string | null };
  return ((data ?? []) as unknown as { id: string; title: string; title_en: string | null; type: SearchHit["type"]; categories: Cat | Cat[] | null }[]).map((r) => {
    const c = Array.isArray(r.categories) ? r.categories[0] : r.categories;
    return { id: r.id, title: pick(locale, r.title, r.title_en), type: r.type, category: c ? pick(locale, c.name, c.name_en) : "" };
  });
}

export async function notificationsPreview(): Promise<NoticeItem[]> {
  const viewer = await requireUser();
  const tx = await getTx();
  const locale = await getLocale();
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data: prof } = await supabase.from("profiles").select("notifications_seen_at").eq("id", viewer.id).maybeSingle();
  const seen = (prof?.notifications_seen_at as string | undefined) ?? now;
  const [{ data: replies }, { data: fresh }] = await Promise.all([
    supabase.from("notifications").select("id,resource_id,message,created_at,read_at").eq("user_id", viewer.id).order("created_at", { ascending: false }).limit(6),
    supabase
      .from("resources")
      .select("id,title,title_en,publish_at,created_at,categories(name,name_en)")
      .eq("status", "published")
      .is("deleted_at", null)
      .or(`and(publish_at.is.null,created_at.gt.${seen}),and(publish_at.gt.${seen},publish_at.lte.${now})`)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const items: NoticeItem[] = [
    ...((fresh ?? []) as unknown as { id: string; title: string; title_en: string | null; publish_at: string | null; created_at: string; categories: { name: string; name_en: string | null } | { name: string; name_en: string | null }[] | null }[]).map((r) => {
      const c = Array.isArray(r.categories) ? r.categories[0] : r.categories;
      return {
        key: `f-${r.id}`,
        kind: "new" as const,
        text: `${tx("Resursă nouă", "New resource")}: ${pick(locale, r.title, r.title_en)}`,
        sub: `${c ? pick(locale, c.name, c.name_en) : ""} · ${formatDate(r.publish_at ?? r.created_at, locale)}`,
        href: `/resurse/${r.id}`,
        unread: true,
      };
    }),
    ...((replies ?? []) as { id: string; resource_id: string; message: string; created_at: string; read_at: string | null }[]).map((r) => ({
      key: r.id,
      kind: "reply" as const,
      text: r.message,
      sub: formatDate(r.created_at, locale),
      href: `/resurse/${r.resource_id}#comentarii`,
      unread: !r.read_at,
    })),
  ];
  return items.slice(0, 8);
}
