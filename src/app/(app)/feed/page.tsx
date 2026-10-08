import { canLike } from "@/lib/likes";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { isStaff, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { videoCovers } from "@/lib/video";
import { coverUrl } from "@/lib/cover-url";
import { photoPreviews } from "@/lib/photos";
import { getLocale, getT, getTx, pick } from "@/lib/i18n";
import { FeedView, TYPES, SORTS, type Category, type Row } from "./feed-view";

export async function generateMetadata({ searchParams }: PageProps<"/feed">): Promise<Metadata> {
  const [t, tx, locale, sp] = await Promise.all([getT(), getTx(), getLocale(), searchParams]);
  const slug = typeof sp.categorie === "string" ? sp.categorie.slice(0, 80) : "";
  if (slug) {
    const supabase = await createClient();
    const { data: c } = await supabase.from("categories").select("name,name_en").eq("slug", slug).maybeSingle();
    if (c) {
      const name = pick(locale, c.name, c.name_en);
      return { title: name, description: tx(`Resurse din categoria ${name}: webinarii, cazuri și materiale pentru medicii din MentorMed.`, `Resources in ${name}: webinars, cases and materials for MentorMed doctors.`) };
    }
  }
  return { title: t.feed.title, description: tx("Webinarii, cazuri și materiale pentru medicii din programul MentorMed, într-un singur loc.", "Webinars, cases and materials for doctors in the MentorMed program, in one place.") };
}

const PAGE = 12;

export default async function FeedPage({ searchParams }: PageProps<"/feed">) {
  const viewer = await requireUser();
  const locale = await getLocale();
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 80);
  const categorie = typeof sp.categorie === "string" ? sp.categorie : "";
  const tip = TYPES.find((x) => x === sp.tip);
  const fav = sp.fav === "1";
  const sort = SORTS.find((x) => x === sp.sortare) ?? "noi";
  const cookieView = (await cookies()).get("vedere")?.value;
  const view: "lista" | "grila" = sp.vedere === "grila" || sp.vedere === "lista" ? sp.vedere : cookieView === "grila" ? "grila" : "lista";
  const pages = Math.min(Math.max(Number(sp.pagina) || 1, 1), 20);
  const isAdmin = isStaff(viewer.role);

  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const [{ data: cats }, { data: rowsRaw }, { data: views }, { data: myTags }, { data: favRows }] = await Promise.all([
    supabase.from("categories").select("id,name,name_en,slug").order("position"),
    supabase
      .from("resources")
      .select("id,title,title_en,description,description_en,presenter,type,video_url,is_pinned,publish_at,created_at,category_id,cover_path,resource_attachments(id)")
      .eq("status", "published")
      .is("deleted_at", null)
      .or(`publish_at.is.null,publish_at.lte.${nowIso}`)
      .order("is_pinned", { ascending: false })
      .order("publish_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("resource_views").select("resource_id,last_viewed_at,completed").eq("user_id", viewer.id).order("last_viewed_at", { ascending: false }),
    supabase.from("user_tags").select("tags(name,position,welcome_message)").eq("user_id", viewer.id),
    supabase.from("favorites").select("resource_id").eq("user_id", viewer.id),
  ]);

  // Content is localized once here (English falls back to Romanian when empty), so every view downstream just displays it.
  const categories = ((cats ?? []) as Category[]).map((c) => ({ ...c, name: pick(locale, c.name, c.name_en) }));
  const all = ((rowsRaw ?? []) as unknown as (Row & { title_en: string | null; description_en: string | null })[]).map((r) => ({ ...r, title: pick(locale, r.title, r.title_en), description: pick(locale, r.description, r.description_en) })) as Row[];
  const catById = new Map(categories.map((c) => [c.id, c]));
  const seen = new Set((views ?? []).map((v: { resource_id: string }) => v.resource_id));
  const weekAgo = new Date(nowIso).getTime() - 7 * 86400000;
  const isNew = (r: Row) => (isAdmin ? new Date(r.publish_at ?? r.created_at).getTime() > weekAgo : !seen.has(r.id));
  const dateOf = (r: Row) => formatDate(r.publish_at ?? r.created_at, locale);
  const chronological = [...all].sort((a, b) => +new Date(b.publish_at ?? b.created_at) - +new Date(a.publish_at ?? a.created_at));

  const activeCategory = categories.find((c) => c.slug === categorie);
  let following = false;
  if (activeCategory) {
    const { data: sub } = await supabase.from("category_subscriptions").select("category_id").eq("user_id", viewer.id).eq("category_id", activeCategory.id).maybeSingle();
    following = Boolean(sub);
  }
  // Searches of 3 or more characters feed the popular searches; failures are ignored.
  if (q.length >= 3) {
    try {
      await supabase.rpc("log_search", { p_term: q });
    } catch {}
  }
  const favSet = new Set((favRows ?? []).map((f: { resource_id: string }) => f.resource_id));
  const filtered = Boolean(q || activeCategory || tip || fav);
  // Text search runs in the database over title, description and body.
  let matchIds: Set<string> | null = null;
  if (q) {
    const needle = q.replace(/[%,()*\\]/g, " ").trim();
    const { data: hits } = needle ? await supabase.rpc("search_resources", { p_q: needle, p_en: locale === "en" }) : { data: [] };
    matchIds = new Set((hits ?? []).map((h: { id: string }) => h.id));
  }
  // View counts feed both the popular videos row and the "most viewed" sort.
  const { data: counts } = await supabase.rpc("resource_view_counts");
  const viewCount = new Map(((counts ?? []) as { resource_id: string; views: number }[]).map((c) => [c.resource_id, Number(c.views)]));
  const list = all.filter(
    (r) =>
      (!activeCategory || r.category_id === activeCategory.id) &&
      (!tip || r.type === tip) &&
      (!fav || favSet.has(r.id)) &&
      (!matchIds || matchIds.has(r.id)),
  );
  if (sort === "vizionate") list.sort((a, b) => (viewCount.get(b.id) ?? 0) - (viewCount.get(a.id) ?? 0));
  else if (sort === "alfabetic") list.sort((a, b) => a.title.localeCompare(b.title, locale));
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

  const featuredRows = filtered
    ? []
    : chronological
        .filter((r) => r.type === "video")
        .sort((a, b) => (viewCount.get(b.id) ?? 0) - (viewCount.get(a.id) ?? 0))
        .slice(0, 6);
  const completedIds = (views ?? []).filter((v: { completed: boolean }) => v.completed).map((v: { resource_id: string }) => v.resource_id);
  const startHere = filtered ? [] : chronological.filter((r) => r.is_pinned && r.category_id !== announceCat?.id).slice(0, 4);
  const coverIds = new Set([...heroRows, ...shown, ...featuredRows, ...startHere].map((r) => r.id));
  const coverEntries = await Promise.all(all.filter((r) => coverIds.has(r.id) && (r.type === "video" || r.cover_path)).map(async (r) => [r.id, [...(r.cover_path ? [coverUrl(r.cover_path)] : []), ...(r.type === "video" ? await videoCovers(r.video_url) : [])]] as [string, string[]]));
  const covers = new Map(coverEntries);
  // Like-urile apar doar pe resursele din Învață: numărul total și dacă le-am apreciat noi.
  const likeIds = shown.filter((r) => canLike(catById.get(r.category_id)?.slug)).map((r) => r.id);
  const [{ data: likeCounts }, { data: myLikes }] = likeIds.length
    ? await Promise.all([supabase.rpc("resource_like_counts", { p_ids: likeIds }), supabase.from("resource_likes").select("resource_id").eq("user_id", viewer.id).in("resource_id", likeIds)])
    : [{ data: [] }, { data: [] }];
  const likeCountMap = new Map(((likeCounts ?? []) as { resource_id: string; n: number }[]).map((l) => [l.resource_id, Number(l.n)]));
  const myLikeSet = new Set(((myLikes ?? []) as { resource_id: string }[]).map((l) => l.resource_id));
  const likes: Record<string, { n: number; mine: boolean }> = Object.fromEntries(likeIds.map((id) => [id, { n: likeCountMap.get(id) ?? 0, mine: myLikeSet.has(id) }]));
  const photos = await photoPreviews(supabase, all.filter((r) => coverIds.has(r.id) && r.type === "photo").map((r) => r.id));
  photos.forEach((v, id) => covers.set(id, [v.urls[0]]));

  return (
    <FeedView
      firstName={viewer.firstName}
      groups={groups}
      categories={categories}
      activeCategory={activeCategory}
      following={following}
      q={q}
      tip={tip}
      fav={fav}
      sort={sort}
      view={view}
      completedIds={completedIds}
      likes={likes}
      startHere={startHere}
      welcomes={welcomes}
      featured={featuredRows}
      pages={pages}
      filtered={filtered}
      newTotal={newTotal}
      newByCategory={Object.fromEntries(newByCategory)}
      shown={shown}
      totalMatching={list.length}
      newIds={all.filter(isNew).map((r) => r.id)}
      dates={Object.fromEntries(all.map((r) => [r.id, dateOf(r)]))}
      covers={Object.fromEntries(covers)}
      photos={Object.fromEntries(photos)}
      heroRows={heroRows}
      resume={resumeRow ? { id: resumeRow.id, title: resumeRow.title, category: catById.get(resumeRow.category_id)?.name ?? "" } : null}
      announcements={announcements}
    />
  );
}
