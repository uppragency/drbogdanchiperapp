"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { localInputToIso } from "@/lib/format";
import { slugify } from "@/lib/courses";
import type { FormState } from "@/app/login/actions";

const text = (max: number) => z.string().trim().max(max).default("");
const schema = z.object({
  type: z.enum(["studyclub", "bookclub", "mentormed"]),
  title: z.string().trim().min(2).max(160),
  titleEn: text(160),
  slug: z.string().trim().max(80),
  shortDescription: text(600), shortDescriptionEn: text(600),
  description: text(8000), descriptionEn: text(8000),
  mentors: text(1000),
  format: z.enum(["online", "fizic"]),
  city: text(80),
  registerUrl: z.string().trim().refine((v) => /^https?:\/\//i.test(v) && URL.canParse(v)),
  buttonLabel: text(60), buttonLabelEn: text(60),
  coverUrl: z.string().trim().refine((v) => v === "" || (/^https?:\/\//i.test(v) && URL.canParse(v))),
});
const g = (f: FormData, k: string) => String(f.get(k) ?? "");

export async function saveEvent(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const keys = ["type", "title", "titleEn", "slug", "shortDescription", "shortDescriptionEn", "description", "descriptionEn", "mentors", "format", "city", "registerUrl", "buttonLabel", "buttonLabelEn", "coverUrl"];
  const p = schema.safeParse(Object.fromEntries(keys.map((k) => [k, g(formData, k)])));
  if (!p.success) {
    const f = String(p.error.issues[0]?.path[0]);
    const msg: Record<string, string> = { title: "Titlul are minimum 2 caractere.", registerUrl: "Linkul de înscriere trebuie să înceapă cu https://.", coverUrl: "Linkul imaginii e invalid." };
    return { error: msg[f] ?? "Verifică datele introduse." };
  }
  const d = p.data;
  const startsAt = localInputToIso(g(formData, "startsAt"));
  const endsAt = localInputToIso(g(formData, "endsAt"));
  if (!startsAt) return { error: "Alege data și ora de start." };
  if (endsAt && new Date(endsAt) <= new Date(startsAt)) return { error: "Ora de final trebuie să fie după start." };
  if (d.format === "fizic" && !d.city) return { error: "Pentru un eveniment fizic completează orașul." };
  const slug = slugify(d.slug || d.title);
  if (!slug) return { error: "Adresa (slug) e invalidă." };
  const publish = formData.get("isPublished") === "on";
  const supabase = await createClient();
  const id = z.string().uuid().safeParse(formData.get("id"));
  let existing: { published_at: string | null } | null = null;
  if (id.success) existing = (await supabase.from("events").select("published_at").eq("id", id.data).maybeSingle()).data;
  const row = {
    slug, type: d.type, title: d.title, title_en: d.titleEn,
    short_description: d.shortDescription, short_description_en: d.shortDescriptionEn,
    description: d.description, description_en: d.descriptionEn, mentors: d.mentors,
    format: d.format, city: d.format === "online" ? "" : d.city,
    starts_at: startsAt, ends_at: endsAt,
    register_url: d.registerUrl, button_label: d.buttonLabel || "Înscrie-te", button_label_en: d.buttonLabelEn,
    cover_url: d.coverUrl || null,
    announce: formData.get("announce") === "on",
    is_published: publish,
    published_at: publish ? existing?.published_at ?? new Date().toISOString() : existing?.published_at ?? null,
  };
  const { data, error } = id.success
    ? await supabase.from("events").update(row).eq("id", id.data).select("id").maybeSingle()
    : await supabase.from("events").insert(row).select("id").single();
  if (error || !data) return { error: error?.code === "23505" ? "Există deja un eveniment cu această adresă (slug)." : "Salvarea a eșuat." };
  revalidatePath("/evenimente", "layout");
  revalidatePath("/eveniment", "layout");
  revalidatePath("/ce-e-nou");
  revalidatePath("/admin/evenimente");
  if (!id.success) redirect(`/admin/evenimente/${data.id}?creat=1`);
  return { ok: "Salvat." };
}

export async function setEventCover(id: string, path: string | null): Promise<FormState> {
  await requireAdmin();
  const eid = z.string().uuid().safeParse(id);
  if (!eid.success || (path !== null && !/^events\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(path))) return { error: "Cale invalidă." };
  const supabase = await createClient();
  const { error } = await supabase.from("events").update({ cover_path: path }).eq("id", eid.data);
  if (error) return { error: "Salvarea a eșuat." };
  revalidatePath("/evenimente", "layout");
  revalidatePath("/eveniment", "layout");
  return { ok: "Imagine salvată." };
}

export async function deleteEvent(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("events").delete().eq("id", id);
  revalidatePath("/evenimente", "layout");
  revalidatePath("/eveniment", "layout");
  redirect("/admin/evenimente");
}
