"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyNewResource } from "@/lib/push";
import { after } from "next/server";
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

type PublishDraft = z.infer<typeof schema>;

// Warnings (not errors) shown before a resource goes live. Cover and attachments only exist after the first save.
async function publishWarnings(supabase: Awaited<ReturnType<typeof createClient>>, id: string, d: PublishDraft): Promise<string[]> {
  const warnings: string[] = [];
  if (id) {
    const [{ data: cur }, { count }] = await Promise.all([
      supabase.from("resources").select("cover_path").eq("id", id).maybeSingle(),
      supabase.from("resource_attachments").select("id", { count: "exact", head: true }).eq("resource_id", id),
    ]);
    if (!cur?.cover_path && d.type !== "video") warnings.push("Resursa nu are imagine de copertă.");
    if (d.type === "pdf" && (count ?? 0) === 0) warnings.push("Resursa de tip PDF nu are niciun material atașat.");
  }
  return warnings;
}

export async function saveResource(_: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireStaff();
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

  const supabase = await createClient();

  // Non-blocking checks before publishing; skipped once the admin confirmed with "Publică oricum".
  if (d.status === "published" && formData.get("confirm") !== "1") {
    const warnings = await publishWarnings(supabase, id, d);
    if (warnings.length) return { warnings };
  }

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

  let resourceId = id;
  let wasPublished = false;
  if (id) {
    const { data: prev } = await supabase.from("resources").select("status").eq("id", id).maybeSingle();
    wasPublished = prev?.status === "published";
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

  // Push notification on the first publish, only when the resource is already visible (scheduled ones are not announced).
  const publishTime = row.publish_at ? new Date(row.publish_at).getTime() : 0;
  if (d.status === "published" && !wasPublished && publishTime <= Date.now()) after(() => notifyNewResource(resourceId));

  revalidatePath("/admin/resurse");
  revalidatePath("/feed");
  if (!id) redirect(`/admin/resurse/${resourceId}?nou=1`);
  return { ok: "Resursa a fost salvată." };
}

export async function trashResource(formData: FormData) {
  await requireStaff();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("resources").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/resurse");
  revalidatePath("/feed");
  redirect("/admin/resurse");
}

export async function restoreResource(formData: FormData) {
  await requireStaff();
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
  await requireStaff();
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
  await requireStaff();
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
  await requireStaff();
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
  await requireStaff();
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
  const admin = await requireStaff();
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

const bulkSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "Alege cel puțin o resursă.").max(200, "Maximum 200 de resurse odată."),
  op: z.enum(["publish", "draft", "move", "trash", "tags", "schedule"]),
  categoryId: z.string().uuid().optional(),
  tagIds: z.array(z.string().uuid()).max(50).default([]),
  tagMode: z.enum(["replace", "add"]).default("replace"),
  publishAt: z.string().default(""),
});

// Bulk update for the resources list. Publishing skips resources without any group tag (same rule as the single form).
export async function bulkResources(_: FormState, formData: FormData): Promise<FormState> {
  await requireStaff();
  const rawCat = String(formData.get("categoryId") ?? "");
  const parsed = bulkSchema.safeParse({ ids: formData.getAll("ids").map(String), op: formData.get("op"), categoryId: rawCat || undefined, tagIds: formData.getAll("tagIds").map(String), tagMode: formData.get("tagMode") ?? "replace", publishAt: String(formData.get("publishAt") ?? "") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Date invalide." };
  const { ids, op, categoryId, tagIds, tagMode, publishAt } = parsed.data;
  const supabase = await createClient();
  let ok = "";

  if (op === "publish") {
    const { data: tagged } = await supabase.from("resource_tags").select("resource_id").in("resource_id", ids);
    const withTag = new Set((tagged ?? []).map((t: { resource_id: string }) => t.resource_id));
    const eligible = ids.filter((i) => withTag.has(i));
    const skipped = ids.length - eligible.length;
    if (eligible.length) {
      const { data: before } = await supabase.from("resources").select("id,status,publish_at").in("id", eligible).is("deleted_at", null);
      const fresh = (before ?? []).filter((r: { status: string; publish_at: string | null }) => r.status !== "published" && (!r.publish_at || new Date(r.publish_at).getTime() <= Date.now())).map((r: { id: string }) => r.id).slice(0, 10);
      if (fresh.length) after(async () => { for (const rid of fresh) await notifyNewResource(rid); });
      const { error } = await supabase.from("resources").update({ status: "published" }).in("id", eligible).is("deleted_at", null);
      if (error) return { error: "Nu am putut publica resursele." };
    }
    ok = `${eligible.length} publicate.` + (skipped ? ` ${skipped} sărite, nu au niciun grup MentorMed.` : "");
  } else if (op === "draft") {
    const { error } = await supabase.from("resources").update({ status: "draft" }).in("id", ids).is("deleted_at", null);
    if (error) return { error: "Nu am putut retrage resursele." };
    ok = `${ids.length} retrase în draft.`;
  } else if (op === "tags") {
    if (!tagIds.length) return { error: "Alege cel puțin o grupă." };
    if (tagMode === "replace") {
      const { error: delErr } = await supabase.from("resource_tags").delete().in("resource_id", ids);
      if (delErr) return { error: "Nu am putut schimba grupele." };
    }
    const rows = ids.flatMap((resource_id) => tagIds.map((tag_id) => ({ resource_id, tag_id })));
    const { error } = await supabase.from("resource_tags").upsert(rows, { onConflict: "resource_id,tag_id", ignoreDuplicates: true });
    if (error) return { error: "Nu am putut schimba grupele." };
    ok = tagMode === "replace" ? `${ids.length} resurse au acum doar grupele alese.` : `Grupele au fost adăugate la ${ids.length} resurse.`;
  } else if (op === "schedule") {
    const iso = localInputToIso(publishAt);
    if (!iso || new Date(iso).getTime() <= Date.now()) return { error: "Alege o dată și o oră din viitor." };
    const { data: tagged } = await supabase.from("resource_tags").select("resource_id").in("resource_id", ids);
    const withTag = new Set((tagged ?? []).map((t: { resource_id: string }) => t.resource_id));
    const eligible = ids.filter((i) => withTag.has(i));
    if (eligible.length) {
      const { error } = await supabase.from("resources").update({ status: "published", publish_at: iso }).in("id", eligible).is("deleted_at", null);
      if (error) return { error: "Nu am putut programa resursele." };
    }
    const skipped = ids.length - eligible.length;
    ok = `${eligible.length} programate.` + (skipped ? ` ${skipped} sărite, nu au niciun grup MentorMed.` : "");
  } else if (op === "move") {
    if (!categoryId) return { error: "Alege categoria." };
    const { error } = await supabase.from("resources").update({ category_id: categoryId }).in("id", ids).is("deleted_at", null);
    if (error) return { error: "Nu am putut muta resursele." };
    ok = `${ids.length} mutate în categoria aleasă.`;
  } else {
    const { error } = await supabase.from("resources").update({ deleted_at: new Date().toISOString() }).in("id", ids).is("deleted_at", null);
    if (error) return { error: "Nu am putut muta resursele în coș." };
    ok = `${ids.length} mutate în coș.`;
  }

  revalidatePath("/admin/resurse");
  revalidatePath("/feed");
  return { ok };
}
