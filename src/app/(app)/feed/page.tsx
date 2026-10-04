import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { videoCovers } from "@/lib/video";
import { coverUrl } from "@/lib/cover-url";
import { t } from "@/lib/texts";
import { FeedView, TYPES, type Category, type Row } from "./feed-view";

export const metadata: Metadata = { title: t.feed.title };

const PAGE = 12;

export default async function FeedPage({ searchParams }: PageProps<"/feed">) {
  const viewer = await requireUser();
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 80);
  const categorie = typeof sp.categorie === "string" ? sp.categorie : "";
  const tip = TYPES.find((x) => x === sp.tip);
  const fav = sp.fav === "1";
  const pages = Math.min(Math.max(Number(sp.pagina) || 1, 1), 20);
  const isAdmin = viewer.role === "admin";

  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const [{ data: cats }, { data: rowsRaw }, { data: views }, { data: myTags }, { data: favRows }] = await Promise.all([
    supabase.from("categories").select("id,name,slug").order("position"),
    supabase
      .from("resources")
      .select("id,title,description,type,video_url,is_pinned,publish_at,created_at,category_id,cover_path,resource_attachments(id)")
      .eq("status", "published")
      .is("deleted_at", null)
      .or(`publish_at.is.null,publish_at.lte.${nowIso}`)
      .order("is_pinned", { ascending: false })
      .order("publish_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("resource_views").select("resource_id,last_viewed_at").eq("user_id", viewer.id).order("last_viewed_at", { ascending: false }),
    supabase.from("user_tags").select("tags(name,position,welcome_message)").eq("user_id", viewer.id),
    supabase.from("favorites").select("resource_id").eq("user_id", viewer.id),
  ]);

  const categories = (cats ?? []) as Category[];
  const all = (rowsRaw ?? []) as unknown as Row[];
  const catById = new Map(categories.map((c) => [c.id, c]));
  const seen = new Set((views ?? []).map((v: { resource_id: string }) => v.resource_id));
  const weekAgo = new Date(nowIso).getTime() - 7 * 86400000;
  const isNew = (r: Row) => (isAdmin ? new Date(r.publish_at ?? r.created_at).getTime() > weekAgo : !seen.has(r.id));
  const dateOf = (r: Row) => formatDate(r.publish_at ?? r.created_at);
  const chronological = [...all].sort((a, b) => +new Date(b.publish_at ?? b.created_at) - +new Date(a.publish_at ?? a.created_at));

  const activeCategory = categories.find((c) => c.slug === categorie);
  const favSet = new Set((favRows ?? []).map((f: { resource_id: string }) => f.resource_id));
  const filtered = Boolean(q || activeCategory || tip || fav);
  const list = all.filter(
    (r) =>
      (!activeCategory || r.category_id === activeCategory.id) &&
      (!tip || r.type === tip) &&
      (!fav || favSet.has(r.id)) &&
      (!q || `${r.title} ${r.description}`.toLowerCase().includes(q.toLowerCase())),
  );
  const shown = list.slice(0, PAGE * pages);

  const newByCategory = new Map<string, number>();
  all.filter(isNew).forEach((r) => newByCategory.set(r.category_id, (newByCategory.get(r.category_id) ?? 0) + 1));
  const newTotal = all.filter(isNew).length;

  // Hero data (home only).
  const heroRows = filtered ? [] : [...chronological.filter(isNew), ...chronological.filter((r) => !isNew(r))].slice(0, 5);
  const lastView = (views ?? [])[0] as { resource_id: string } | undefined;
  const resumeRow = !filtered && lastView ? all.find((r) => r.id === lastView.resource_id) : undefined;
  const announceCat = categories.find((c) => c.slug === "anunturi");
  const announcements = announceCat ? chronological.filter((r) => r.category_id === announceCat.id).sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned)).slice(0, 4) : [];
  const myGroups = ((myTags ?? []) as unknown as { tags: { name: string; position: number; welcome_message: string } | null }[])
    .map((x) => x.tags)
    .filter((x): x is { name: string; position: number; welcome_message: string } => Boolean(x))
    .sort((a, b) => a.position - b.position);
  const groups = myGroups.map((x) => x.name);
  const welcomes = filtered ? [] : myGroups.filter((x) => x.welcome_message.trim()).map((x) => ({ name: x.name, message: x.welcome_message }));

  const heroIds = new Set(heroRows.map((r) => r.id));
  const featuredRows = filtered ? [] : [...chronological.filter((r) => r.is_pinned), ...chronological.filter((r) => !r.is_pinned)].filter((r, i, a) => a.findIndex((x) => x.id === r.id) === i).filter((r) => !heroIds.has(r.id) || r.is_pinned).slice(0, 6);
  const rtf = new Intl.RelativeTimeFormat("ro", { numeric: "auto" });
  const ago = (iso: string) => {
    const mins = Math.round((new Date(nowIso).getTime() - new Date(iso).getTime()) / 60000);
    if (mins < 60) return rtf.format(-Math.max(mins, 1), "minute");
    if (mins < 1440) return rtf.format(-Math.round(mins / 60), "hour");
    return rtf.format(-Math.round(mins / 1440), "day");
  };
  const byId = new Map(all.map((r) => [r.id, r]));
  const continueItems = filtered
    ? []
    : ((views ?? []) as { resource_id: string; last_viewed_at: string }[])
        .map((v) => ({ v, r: byId.get(v.resource_id) }))
        .filter((x): x is { v: { resource_id: string; last_viewed_at: string }; r: Row } => Boolean(x.r))
        .slice(0, 8)
        .map(({ v, r }) => ({ id: r.id, title: r.title, category: catById.get(r.category_id)?.name ?? "", type: r.type, ago: ago(v.last_viewed_at), favorite: favSet.has(r.id) }));
  const coverIds = new Set([...heroRows, ...shown, ...featuredRows].map((r) => r.id));
  const coverEntries = await Promise.all(all.filter((r) => coverIds.has(r.id) && (r.type === "video" || r.cover_path)).map(async (r) => [r.id, [...(r.cover_path ? [coverUrl(r.cover_path)] : []), ...(r.type === "video" ? await videoCovers(r.video_url) : [])]] as [string, string[]]));
  const covers = new Map(coverEntries);

  return (
    <FeedView
      firstName={viewer.firstName}
      groups={groups}
      categories={categories}
      activeCategory={activeCategory}
      q={q}
      tip={tip}
      fav={fav}
      welcomes={welcomes}
      featured={featuredRows}
      continueItems={continueItems}
      pages={pages}
      filtered={filtered}
      newTotal={newTotal}
      newByCategory={Object.fromEntries(newByCategory)}
      shown={shown}
      totalMatching={list.length}
      newIds={all.filter(isNew).map((r) => r.id)}
      dates={Object.fromEntries(all.map((r) => [r.id, dateOf(r)]))}
      covers={Object.fromEntries(covers)}
      heroRows={heroRows}
      resume={resumeRow ? { id: resumeRow.id, title: resumeRow.title, category: catById.get(resumeRow.category_id)?.name ?? "" } : null}
      announcements={announcements}
    />
  );
}
