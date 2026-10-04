import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowSquareOut, DownloadSimple, FilePdf, Link as LinkIcon } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadCommunity } from "@/lib/community";
import { CommunityShell } from "@/components/community-shell";
import { Cover } from "@/components/cover";
import { BrandMark } from "@/components/brand";
import { Tabs } from "@/components/tabs";
import { LinkButton } from "@/components/ui";
import { VideoPlayer } from "@/components/video-player";
import { CategoryIcon } from "@/lib/category-icons";
import { formatDate } from "@/lib/format";
import { embedUrl, parseVideo, videoCovers } from "@/lib/video";
import { t } from "@/lib/texts";

type Params = { id: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function load(id: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("resources")
    .select("id,title,description,type,body,video_url,status,publish_at,created_at,category_id,categories(name,slug),resource_attachments(id,kind,label,url,file_path,position)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const r = await load(id);
  return { title: r?.title ?? t.brand };
}

export default async function ResourcePage({ params }: { params: Promise<Params> }) {
  const viewer = await requireUser();
  const { id } = await params;
  const r = await load(id);
  if (!r) notFound();

  if (viewer.role !== "admin") {
    const supabase = await createClient();
    await supabase.from("resource_views").upsert({ user_id: viewer.id, resource_id: r.id, last_viewed_at: new Date().toISOString() }, { onConflict: "user_id,resource_id" });
  }

  const community = await loadCommunity(viewer.id, viewer.role === "admin", { id: r.id, categoryId: r.category_id });
  const category = Array.isArray(r.categories) ? r.categories[0] : r.categories;
  const video = r.type === "video" ? parseVideo(r.video_url) : null;
  const embed = video ? embedUrl(video, true) : null;
  const covers = r.type === "video" ? await videoCovers(r.video_url) : [];
  const attachments = [...(r.resource_attachments ?? [])].sort((a: { position: number }, b: { position: number }) => a.position - b.position);
  const paragraphs = r.body.split(/\n{2,}/).filter((p: string) => p.trim());
  const externalUrl = r.type === "link" || (r.type === "video" && !embed) ? r.video_url : null;

  const hasBody = Boolean(r.description) || paragraphs.length > 0;
  const overview = (
    <div className="flex max-w-[65ch] flex-col gap-4 text-base leading-relaxed">
      {r.description && <p className="text-lg text-muted">{r.description}</p>}
      {paragraphs.map((p: string, i: number) => (
        <p key={i} className="whitespace-pre-line">{p}</p>
      ))}
      {!hasBody && <p className="text-muted">Nu există o descriere pentru această resursă.</p>}
    </div>
  );
  const files = (
    <ul className="flex flex-col divide-y divide-line">
      {attachments.map((a: { id: string; kind: string; label: string; url: string | null; file_path: string | null }) => (
        <li key={a.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-soft text-violet">
            {a.kind === "pdf" ? <FilePdf size={20} weight="fill" /> : <LinkIcon size={20} />}
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
  );

  const author = (
    <div className="flex items-center gap-4 rounded-card border border-line bg-surface p-6 shadow-card">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-surface2"><BrandMark height={30} /></span>
      <span className="flex min-w-0 flex-col">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">Autor</span>
        <span className="text-base font-bold leading-snug">Dr. Bogdan Chiper</span>
        <span className="text-sm text-muted">MentorMed</span>
      </span>
    </div>
  );

  return (
    <CommunityShell
      categories={community.categories}
      activeSlug={category?.slug}
      newByCategory={community.newByCategory}
      newTotal={community.newTotal}
      announcements={community.announcements}
      related={community.related}
      aside={author}
      className="pt-6 lg:pt-8"
    >
      <Link href="/feed" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-ink">
        <ArrowLeft size={16} /> {t.resource.back}
      </Link>

      {embed ? (
        <div className="flex flex-col gap-2">
          <VideoPlayer title={r.title} embed={embed} covers={covers} />
          <p className="text-sm text-muted">{t.resource.videoHelp}</p>
        </div>
      ) : (
        r.type !== "text" && <Cover covers={covers} type={r.type} label={category?.name} play={r.type === "video"} ratio="aspect-[5/2]" className="rounded-card" />
      )}

      <header className="flex flex-col gap-3">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-muted">
          <span className="inline-flex items-center gap-2 text-accent"><CategoryIcon slug={category?.slug} size={18} weight="fill" /> {category?.name}</span>
          <span>{formatDate(r.publish_at ?? r.created_at)}</span>
          <span>{t.feed.types[r.type as keyof typeof t.feed.types]}</span>
          {r.status === "draft" && <span className="rounded-full bg-danger-bg px-3 py-1 text-xs font-bold text-danger">Ciornă</span>}
        </p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">{r.title}</h1>
        {externalUrl && (
          <div className="pt-2">
            <LinkButton href={externalUrl} target="_blank" rel="noopener noreferrer" className="rounded-full">
              {t.resource.open} <ArrowSquareOut size={18} />
            </LinkButton>
          </div>
        )}
      </header>

      <Tabs
        items={[
          { id: "prezentare", label: "Prezentare", content: overview },
          ...(attachments.length > 0 ? [{ id: "atasamente", label: t.resource.attachments, count: attachments.length, content: files }] : []),
        ]}
      />
    </CommunityShell>
  );
}
