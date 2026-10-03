import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, DownloadSimple, ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, LinkButton } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { toEmbedUrl } from "@/lib/video";
import { t } from "@/lib/texts";

type Params = { id: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function load(id: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("resources")
    .select("id,title,description,type,body,video_url,status,publish_at,created_at,categories(name),resource_attachments(id,kind,label,url,file_path,position)")
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

  const category = Array.isArray(r.categories) ? r.categories[0] : r.categories;
  const embed = r.type === "video" && r.video_url ? toEmbedUrl(r.video_url) : null;
  const attachments = [...(r.resource_attachments ?? [])].sort((a, b) => a.position - b.position);
  const paragraphs = r.body.split(/\n{2,}/).filter((p: string) => p.trim());

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <Link href="/feed" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft size={16} /> {t.resource.back}
      </Link>

      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{t.feed.types[r.type as keyof typeof t.feed.types]}</Badge>
          {category && <span className="text-sm text-muted">{category.name}</span>}
          {r.status === "draft" && <Badge tone="danger">Ciornă</Badge>}
        </div>
        <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">{r.title}</h1>
        <p className="text-sm text-muted">{formatDate(r.publish_at ?? r.created_at)}</p>
      </header>

      {embed && (
        <div className="flex flex-col gap-3">
          <div className="aspect-video w-full overflow-hidden rounded-card border border-line bg-black">
            <iframe src={embed} title={r.title} className="size-full" loading="lazy" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
          </div>
          <p className="text-sm text-muted">{t.resource.videoHelp}</p>
        </div>
      )}
      {r.type === "video" && r.video_url && !embed && (
        <LinkButton href={r.video_url} target="_blank" rel="noopener noreferrer" className="self-start">
          {t.resource.open} <ArrowSquareOut size={18} />
        </LinkButton>
      )}
      {r.type === "link" && r.video_url && (
        <LinkButton href={r.video_url} target="_blank" rel="noopener noreferrer" className="self-start">
          {t.resource.open} <ArrowSquareOut size={18} />
        </LinkButton>
      )}

      {r.description && <p className="text-lg leading-relaxed text-muted">{r.description}</p>}
      {paragraphs.length > 0 && (
        <div className="flex max-w-[65ch] flex-col gap-4 text-base leading-relaxed">
          {paragraphs.map((p: string, i: number) => (
            <p key={i} className="whitespace-pre-line">{p}</p>
          ))}
        </div>
      )}

      {attachments.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">{t.resource.attachments}</h2>
          <ul className="flex flex-col gap-3">
            {attachments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 rounded-card border border-line bg-surface p-4">
                <span className="font-semibold">{a.label}</span>
                {a.file_path ? (
                  <LinkButton href={`/fisiere/${a.id}`} variant="secondary" prefetch={false}>
                    <DownloadSimple size={18} /> {t.resource.download}
                  </LinkButton>
                ) : (
                  <LinkButton href={a.url ?? "#"} variant="secondary" target="_blank" rel="noopener noreferrer">
                    <ArrowSquareOut size={18} /> {t.resource.open}
                  </LinkButton>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
