import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Alert, Badge, Card, PageTitle, btn } from "@/components/ui";
import { isoToLocalInput } from "@/lib/format";
import { ResourceForm } from "../resource-form";
import { FileUploader, LinkAttachmentForm } from "../attachments";
import { deleteAttachment, duplicateResource, purgeResource, restoreResource, trashResource } from "../actions";
import { CoverUpload } from "../cover-upload";
import { PhotoRow, PhotoUploader } from "../photos";

export const metadata: Metadata = { title: "Editează resursa" };

export default async function EditResource({ params, searchParams }: PageProps<"/admin/resurse/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: r }, { data: categories }, { data: tags }, { data: rt }, { data: attachments }, { data: images }] = await Promise.all([
    supabase.from("resources").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id,name").order("position"),
    supabase.from("tags").select("id,name").order("position"),
    supabase.from("resource_tags").select("tag_id").eq("resource_id", id),
    supabase.from("resource_attachments").select("id,kind,label,file_path,url").eq("resource_id", id).order("position"),
    supabase.from("resource_images").select("id,thumb_path,caption,caption_en").eq("resource_id", id).order("position").order("created_at"),
  ]);
  if (!r) notFound();
  const trashed = Boolean(r.deleted_at);
  const imgs = images ?? [];
  const { data: signed } = imgs.length ? await supabase.storage.from("resource-photos").createSignedUrls(imgs.map((i) => i.thumb_path), 3600) : { data: [] };
  const photos = imgs.map((i, n) => ({ id: i.id, thumbUrl: signed?.[n]?.signedUrl ?? "", caption: i.caption ?? "", captionEn: i.caption_en ?? "" }));

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/resurse" className="text-sm font-semibold text-muted hover:text-ink">Înapoi la resurse</Link>
      <PageTitle title={r.title}>
        <div className="flex gap-2">
          {trashed && <Badge tone="danger">În coș</Badge>}
          {r.status === "draft" && !trashed && <Badge>Draft</Badge>}
        </div>
      </PageTitle>
      {sp.nou && <Alert kind="ok">Resursa a fost creată. Poți adăuga acum fișiere și linkuri atașate.</Alert>}

      <Card>
        <ResourceForm
          categories={categories ?? []}
          tags={tags ?? []}
          values={{
            id: r.id,
            title: r.title,
            description: r.description,
            type: r.type,
            categoryId: r.category_id,
            body: r.body,
            videoUrl: r.video_url ?? "",
            status: r.status,
            publishAt: isoToLocalInput(r.publish_at),
            eventAt: isoToLocalInput(r.event_at),
            isPinned: r.is_pinned,
            commentsEnabled: r.comments_enabled,
            downloadEnabled: r.download_enabled,
            presenter: r.presenter ?? "",
            titleEn: r.title_en ?? "",
            descriptionEn: r.description_en ?? "",
            bodyEn: r.body_en ?? "",
            tagIds: (rt ?? []).map((x) => x.tag_id),
          }}
        />
      </Card>

      {r.type === "photo" ? (
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">Poze ({photos.length} din 30)</h2>
          <ul className="divide-y divide-line">
            {photos.map((p, n) => <PhotoRow key={p.id} photo={p} index={n} total={photos.length} />)}
            {photos.length === 0 && <li className="py-3 text-sm text-muted">Nicio poză încărcată.</li>}
          </ul>
          <PhotoUploader resourceId={r.id} count={photos.length} />
        </Card>
      ) : (
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">Copertă</h2>
          <CoverUpload resourceId={r.id} current={r.cover_path} />
        </Card>
      )}

      <Card className="flex flex-col gap-5">
        <h2 className="text-lg font-bold">Materiale atașate</h2>
        <ul className="divide-y divide-line">
          {(attachments ?? []).map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <span><span className="font-semibold">{a.label}</span> <span className="text-muted">({a.kind === "link" ? "link" : a.kind === "pdf" ? "PDF" : "fișier"})</span></span>
              <form action={deleteAttachment}>
                <input type="hidden" name="id" value={a.id} />
                <button className="min-h-11 px-3 text-sm font-semibold text-danger">Șterge</button>
              </form>
            </li>
          ))}
          {(attachments ?? []).length === 0 && <li className="py-3 text-sm text-muted">Niciun material atașat.</li>}
        </ul>
        <FileUploader resourceId={r.id} />
        <LinkAttachmentForm resourceId={r.id} />
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">{trashed ? "Resursa este în coș și nu o vede nimeni." : "Resursa se mută în coș și poate fi restaurată."}</p>
        <div className="flex gap-2">
          {!trashed && <form action={duplicateResource}><input type="hidden" name="id" value={r.id} /><button className={btn.secondary}>Duplică</button></form>}
          {trashed ? (
            <>
              <form action={restoreResource}><input type="hidden" name="id" value={r.id} /><button className={btn.secondary}>Restaurează</button></form>
              <form action={purgeResource}><input type="hidden" name="id" value={r.id} /><button className={btn.danger}>Șterge definitiv</button></form>
            </>
          ) : (
            <form action={trashResource}><input type="hidden" name="id" value={r.id} /><button className={btn.danger}>Mută în coș</button></form>
          )}
        </div>
      </Card>
    </div>
  );
}
