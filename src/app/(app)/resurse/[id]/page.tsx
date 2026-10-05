import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowSquareOut, DownloadSimple, FilePdf, Link as LinkIcon, Paperclip } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadCommunity } from "@/lib/community";
import { CommunityShell } from "@/components/community-shell";
import { Cover } from "@/components/cover";
import { Comments } from "@/components/comments";
import { LinkButton } from "@/components/ui";
import { VideoPlayer } from "@/components/video-player";
import { CategoryIcon } from "@/lib/category-icons";
import { formatDate } from "@/lib/format";
import { embedUrl, parseVideo, videoCovers } from "@/lib/video";
import { coverUrl } from "@/lib/cover-url";
import { FavoriteButton } from "../favorite-button";
import { CompleteButton } from "../complete-button";
import { CinemaFrame } from "@/components/cinema-frame";
import { FocusToggle } from "@/components/focus-toggle";
import { getLocale, getT, getTx, pick } from "@/lib/i18n";

type Params = { id: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function load(id: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("resources")
    .select("id,title,title_en,description,description_en,presenter,type,body,body_en,video_url,status,publish_at,created_at,category_id,cover_path,event_at,comments_enabled,categories(name,name_en,slug),resource_attachments(id,kind,label,url,file_path,position)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const r = await load(id);
  const locale = await getLocale();
  const t = await getT();
  return { title: r ? pick(locale, r.title, r.title_en) : t.brand };
}

export default async function ResourcePage({ params }: { params: Promise<Params> }) {
  const viewer = await requireUser();
  const locale = await getLocale();
  const t = await getT();
  const tx = await getTx();
  const { id } = await params;
  const r = await load(id);
  if (!r) notFound();
  const title = pick(locale, r.title, r.title_en);
  const description = pick(locale, r.description, r.description_en);

  // Admin views are stored too (for the "continue" banner) but are left out of the popularity counts.
  {
    const supabase = await createClient();
    await supabase.rpc("record_view", { p_resource: r.id });
  }

  const supabase0 = await createClient();
  const community = await loadCommunity(viewer.id, viewer.role === "admin", { id: r.id, categoryId: r.category_id });
  const category0 = Array.isArray(r.categories) ? r.categories[0] : r.categories;
  const category = category0 ? { ...category0, name: pick(locale, category0.name, category0.name_en) } : category0;
  const video = r.type === "video" ? parseVideo(r.video_url) : null;
  const embed = video ? embedUrl(video, true) : null;
  const { data: sib } = await supabase0.from("resources").select("id,title,title_en,publish_at,created_at").eq("category_id", r.category_id).eq("status", "published").is("deleted_at", null).order("publish_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(200);
  const siblings = ((sib ?? []) as { id: string; title: string; title_en: string | null }[]).map((x) => ({ id: x.id, title: pick(locale, x.title, x.title_en) }));
  const at = siblings.findIndex((x) => x.id === r.id);
  const newer = at > 0 ? siblings[at - 1] : null;
  const older = at >= 0 && at < siblings.length - 1 ? siblings[at + 1] : null;
  const covers = [...(r.cover_path ? [coverUrl(r.cover_path)] : []), ...(r.type === "video" ? await videoCovers(r.video_url) : [])];
  const supabaseFav = await createClient();
  const [{ data: favRow }, { data: viewRow }] = await Promise.all([
    supabaseFav.from("favorites").select("resource_id").eq("user_id", viewer.id).eq("resource_id", r.id).maybeSingle(),
    supabaseFav.from("resource_views").select("completed").eq("user_id", viewer.id).eq("resource_id", r.id).maybeSingle(),
  ]);
  const attachments = [...(r.resource_attachments ?? [])].sort((a: { position: number }, b: { position: number }) => a.position - b.position);
  const paragraphs = pick(locale, r.body, r.body_en).split(/\n{2,}/).filter((p: string) => p.trim());
  const externalUrl = r.type === "link" || (r.type === "video" && !embed) ? r.video_url : null;

  return (
    <CommunityShell
      categories={community.categories}
      activeSlug={category?.slug}
      newByCategory={community.newByCategory}
      newTotal={community.newTotal}
      announcements={community.announcements}
      related={community.related}
      className="pt-10"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/feed" className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-ink">
          <ArrowLeft size={16} /> {t.resource.back}
        </Link>
        <FocusToggle />
      </div>

      <article className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
        <header className="flex items-center gap-3 px-5 pt-5 md:px-8 md:pt-8">
          <span className="flex size-11 items-center justify-center rounded-full bg-violet-soft text-violet"><CategoryIcon slug={category?.slug} size={22} /></span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-bold">{category?.name}</span>
            <span className="text-xs text-muted">{formatDate(r.publish_at ?? r.created_at, locale)} · {t.feed.types[r.type as keyof typeof t.feed.types]}{r.presenter ? ` · ${r.presenter}` : ""}</span>
          </span>
          {r.status === "draft" && <span className="rounded-full bg-danger-bg px-3 py-1 text-xs font-bold text-danger">{tx("Ciornă", "Draft")}</span>}
          <FavoriteButton resourceId={r.id} initial={Boolean(favRow)} compact />
        </header>

        <div className="flex flex-col gap-3 px-5 pb-8 pt-6 md:px-8">
          <h1 className="text-[28px] font-bold leading-tight tracking-tight md:text-4xl">{title}</h1>
          {description && <p className="max-w-[65ch] text-lg font-normal leading-[1.6] text-muted">{description}</p>}
        </div>

        {embed && (
          <div className="flex flex-col gap-4 px-5 pb-10 pt-2 md:px-8">
            <CinemaFrame><VideoPlayer title={title} embed={embed} covers={covers} /></CinemaFrame>
            <p className="text-sm text-muted">{t.resource.videoHelp}</p>
          </div>
        )}

        {!embed && (r.type !== "text" || covers.length > 0) && (
          <Cover covers={covers} type={r.type} label={category?.name} title={title} slug={category?.slug} play={r.type === "video"} ratio="aspect-[5/2]" />
        )}

        {externalUrl && (
          <div className="px-5 pt-6 md:px-8">
            <LinkButton href={externalUrl} target="_blank" rel="noopener noreferrer" className="rounded-full">
              {t.resource.open} <ArrowSquareOut size={18} />
            </LinkButton>
          </div>
        )}

        {paragraphs.length > 0 && (
          <div className="flex max-w-[65ch] flex-col gap-5 px-5 py-6 text-[17px] font-normal leading-[1.6] md:px-8">
            {paragraphs.map((p: string, i: number) => (
              <p key={i} className="whitespace-pre-line">{p}</p>
            ))}
          </div>
        )}

        {attachments.length > 0 && (
          <section className="flex flex-col gap-3 border-t border-line px-5 py-6 md:px-8">
            <h2 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted"><Paperclip size={18} /> {t.resource.attachments}</h2>
            <ul className="flex flex-col gap-3">
              {attachments.map((a: { id: string; kind: string; label: string; url: string | null; file_path: string | null }) => (
                <li key={a.id} className="flex items-center gap-4 rounded-control border border-line p-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-soft text-violet">
                    {a.kind === "pdf" ? <FilePdf size={20} /> : <LinkIcon size={20} />}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{a.label}</span>
                  {a.file_path ? (
                    <LinkButton href={`/fisiere/${a.id}`} variant="secondary" prefetch={false} className="rounded-full">
                      <DownloadSimple size={18} /> {t.resource.download}
                    </LinkButton>
                  ) : (
                    <LinkButton href={a.url ?? "#"} variant="secondary" target="_blank" rel="noopener noreferrer" className="rounded-full">
                      <ArrowSquareOut size={18} /> {t.resource.open}
                    </LinkButton>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
      <CompleteButton resourceId={r.id} initial={Boolean(viewRow?.completed)} />
      {(newer || older) && (
        <nav aria-label={tx("Alte resurse din categorie", "More resources in this category")} className="grid gap-3 sm:grid-cols-2">
          {older ? (
            <Link href={`/resurse/${older.id}`} className="flex flex-col gap-1 rounded-card border border-line bg-surface p-5 transition-colors hover:bg-surface2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">{tx("Anterioară", "Previous")}</span>
              <span className="line-clamp-2 font-bold">{older.title}</span>
            </Link>
          ) : <span />}
          {newer && (
            <Link href={`/resurse/${newer.id}`} className="flex flex-col gap-1 rounded-card border border-line bg-surface p-5 text-right transition-colors hover:bg-surface2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">{tx("Următoarea", "Next")}</span>
              <span className="line-clamp-2 font-bold">{newer.title}</span>
            </Link>
          )}
        </nav>
      )}
      <Comments resourceId={r.id} viewerId={viewer.id} isAdmin={viewer.role === "admin"} enabled={r.comments_enabled} />
    </CommunityShell>
  );
}
