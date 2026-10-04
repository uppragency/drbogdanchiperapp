"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { localInputToIso } from "@/lib/format";
import type { FormState } from "@/app/login/actions";

const https = z.string().trim().url().refine((v) => v.startsWith("https://"), "Linkul trebuie să înceapă cu https://");

const schema = z.object({
  title: z.string().trim().min(1, "Titlul este obligatoriu").max(200),
  description: z.string().trim().max(500).default(""),
  presenter: z.string().trim().max(120).default(""),
  titleEn: z.string().trim().max(200).default(""),
  descriptionEn: z.string().trim().max(500).default(""),
  bodyEn: z.string().max(50000).default(""),
  type: z.enum(["video", "pdf", "text", "link"]),
  categoryId: z.string().uuid("Alege o categorie"),
  body: z.string().max(50000).default(""),
  videoUrl: z.string().trim().default(""),
  status: z.enum(["draft", "published"]),
  publishAt: z.string().default(""),
  eventAt: z.string().default(""),
  isPinned: z.boolean(),
  commentsEnabled: z.boolean(),
  tagIds: z.array(z.string().uuid()),
});

export async function saveResource(_: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = schema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    presenter: formData.get("presenter") ?? "",
    titleEn: formData.get("titleEn") ?? "",
    descriptionEn: formData.get("descriptionEn") ?? "",
    bodyEn: formData.get("bodyEn") ?? "",
    type: formData.get("type"),
    categoryId: formData.get("categoryId"),
    body: formData.get("body") ?? "",
    videoUrl: formData.get("videoUrl") ?? "",
    status: formData.get("status"),
    publishAt: formData.get("publishAt") ?? "",
    eventAt: formData.get("eventAt") ?? "",
    isPinned: formData.get("isPinned") === "on",
    commentsEnabled: formData.get("commentsEnabled") === "on",
    tagIds: formData.getAll("tagIds").map(String),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Date invalide." };
  const d = parsed.data;

  if ((d.type === "video" || d.type === "link") && !https.safeParse(d.videoUrl).success) {
    return { error: d.type === "video" ? "Adaugă linkul videoului (https://)." : "Adaugă linkul resursei (https://)." };
  }
  if (d.status === "published" && d.tagIds.length === 0) return { error: "Alege cel puțin un MentorMed înainte de publicare." };

  const row = {
    title: d.title,
    description: d.description,
    presenter: d.presenter,
    title_en: d.titleEn,
    description_en: d.descriptionEn,
    body_en: d.bodyEn,
    type: d.type,
    category_id: d.categoryId,
    body: d.body,
    video_url: d.type === "video" || d.type === "link" ? d.videoUrl : null,
    status: d.status,
    publish_at: localInputToIso(d.publishAt),
    event_at: localInputToIso(d.eventAt),
    is_pinned: d.isPinned,
    comments_enabled: d.commentsEnabled,
  };

  const supabase = await createClient();
  let resourceId = id;
  if (id) {
    const { error } = await supabase.from("resources").update(row).eq("id", id);
    if (error) return { error: "Nu am putut salva resursa." };
  } else {
    const { data, error } = await supabase.from("resources").insert({ ...row, created_by: admin.id }).select("id").single();
    if (error || !data) return { error: "Nu am putut crea resursa." };
    resourceId = data.id;
  }

  const { error: delErr } = await supabase.from("resource_tags").delete().eq("resource_id", resourceId);
  if (delErr) return { error: "Nu am putut actualiza taguri." };
  if (d.tagIds.length) {
    const { error } = await supabase.from("resource_tags").insert(d.tagIds.map((tag_id) => ({ resource_id: resourceId, tag_id })));
    if (error) return { error: "Nu am putut salva taguri." };
  }

  revalidatePath("/admin/resurse");
  revalidatePath("/feed");
  if (!id) redirect(`/admin/resurse/${resourceId}?nou=1`);
  return { ok: "Resursa a fost salvată." };
}

export async function trashResource(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("resources").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/resurse");
  revalidatePath("/feed");
  redirect("/admin/resurse");
}

export async function restoreResource(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("resources").update({ deleted_at: null, status: "draft" }).eq("id", id);
  revalidatePath("/admin/resurse");
  redirect(`/admin/resurse/${id}`);
}

export async function purgeResource(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { data: files } = await supabase.from("resource_attachments").select("file_path").eq("resource_id", id).not("file_path", "is", null);
  const paths = (files ?? []).map((f) => f.file_path).filter((p): p is string => Boolean(p));
  if (paths.length) await supabase.storage.from("resources").remove(paths);
  await supabase.from("resources").delete().eq("id", id);
  revalidatePath("/admin/resurse");
  redirect("/admin/resurse?status=trash");
}

export async function addLinkAttachment(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = z
    .object({ resourceId: z.string().uuid(), label: z.string().trim().min(1, "Adaugă o etichetă").max(120), url: https })
    .safeParse({ resourceId: formData.get("resourceId"), label: formData.get("label"), url: formData.get("url") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Date invalide." };
  const supabase = await createClient();
  const { count } = await supabase.from("resource_attachments").select("id", { count: "exact", head: true }).eq("resource_id", parsed.data.resourceId);
  const { error } = await supabase.from("resource_attachments").insert({ resource_id: parsed.data.resourceId, kind: "link", label: parsed.data.label, url: parsed.data.url, position: (count ?? 0) + 1 });
  if (error) return { error: "Nu am putut adăuga linkul." };
  revalidatePath(`/admin/resurse/${parsed.data.resourceId}`);
  return { ok: "Linkul a fost adăugat." };
}

// Called after the browser uploaded the file directly to Storage with the admin session.
export async function registerFileAttachment(input: { resourceId: string; path: string; label: string; kind: "pdf" | "file" }): Promise<FormState> {
  await requireAdmin();
  const parsed = z
    .object({ resourceId: z.string().uuid(), path: z.string().min(3).max(300), label: z.string().trim().min(1).max(120), kind: z.enum(["pdf", "file"]) })
    .safeParse(input);
  if (!parsed.success || !parsed.data.path.startsWith(`${parsed.data.resourceId}/`) || parsed.data.path.includes("..")) return { error: "Date invalide." };
  const supabase = await createClient();
  const { count } = await supabase.from("resource_attachments").select("id", { count: "exact", head: true }).eq("resource_id", parsed.data.resourceId);
  const { error } = await supabase.from("resource_attachments").insert({ resource_id: parsed.data.resourceId, kind: parsed.data.kind, label: parsed.data.label, file_path: parsed.data.path, position: (count ?? 0) + 1 });
  if (error) return { error: "Nu am putut salva fișierul." };
  revalidatePath(`/admin/resurse/${parsed.data.resourceId}`);
  return { ok: "Fișierul a fost adăugat." };
}

export async function deleteAttachment(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { data } = await supabase.from("resource_attachments").select("file_path,resource_id").eq("id", id).maybeSingle();
  if (!data) return;
  if (data.file_path) await supabase.storage.from("resources").remove([data.file_path]);
  await supabase.from("resource_attachments").delete().eq("id", id);
  revalidatePath(`/admin/resurse/${data.resource_id}`);
}

const COVER_OK = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

// Called after the browser uploaded the image to the public covers bucket.
export async function setCover(resourceId: string, path: string | null): Promise<FormState> {
  await requireAdmin();
  const id = z.string().uuid().safeParse(resourceId);
  if (!id.success || (path !== null && (!COVER_OK.test(path) || !path.startsWith(`${id.data}/`)))) return { error: "Date invalide." };
  const supabase = await createClient();
  const { data: old } = await supabase.from("resources").select("cover_path").eq("id", id.data).maybeSingle();
  const { error } = await supabase.from("resources").update({ cover_path: path }).eq("id", id.data);
  if (error) return { error: "Nu am putut salva coperta." };
  if (old?.cover_path && old.cover_path !== path) await supabase.storage.from("covers").remove([old.cover_path]);
  revalidatePath(`/admin/resurse/${id.data}`);
  revalidatePath("/feed");
  return { ok: path ? "Coperta a fost salvată." : "Coperta a fost ștearsă." };
}

// Copies the resource as a draft: text, group, presenter, link attachments and uploaded files (copied inside Storage).
export async function duplicateResource(formData: FormData) {
  const admin = await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { data: r } = await supabase.from("resources").select("title,description,presenter,type,category_id,body,video_url,comments_enabled,title_en,description_en,body_en").eq("id", id).maybeSingle();
  if (!r) redirect("/admin/resurse");
  const { data: copy } = await supabase.from("resources").insert({ ...r, title: `${r.title} (copie)`.slice(0, 200), is_pinned: false, status: "draft", created_by: admin.id }).select("id").single();
  if (!copy) redirect("/admin/resurse");
  const [{ data: tags }, { data: atts }] = await Promise.all([
    supabase.from("resource_tags").select("tag_id").eq("resource_id", id),
    supabase.from("resource_attachments").select("kind,label,url,file_path,position").eq("resource_id", id).order("position"),
  ]);
  if (tags?.length) await supabase.from("resource_tags").insert(tags.map((t: { tag_id: string }) => ({ resource_id: copy.id, tag_id: t.tag_id })));
  const storage = createAdminClient().storage.from("resources");
  const rows: { resource_id: string; kind: string; label: string; url: string | null; file_path: string | null; position: number }[] = [];
  for (const a of (atts ?? []) as { kind: string; label: string; url: string | null; file_path: string | null; position: number }[]) {
    if (a.file_path) {
      const name = a.file_path.split("/").pop() ?? "fisier";
      const target = `${copy.id}/${name}`;
      const { error } = await storage.copy(a.file_path, target);
      if (error) continue;
      rows.push({ resource_id: copy.id, kind: a.kind, label: a.label, url: null, file_path: target, position: a.position });
    } else {
      rows.push({ resource_id: copy.id, kind: a.kind, label: a.label, url: a.url, file_path: null, position: a.position });
    }
  }
  if (rows.length) await supabase.from("resource_attachments").insert(rows);
  revalidatePath("/admin/resurse");
  redirect(`/admin/resurse/${copy.id}?nou=1`);
}
