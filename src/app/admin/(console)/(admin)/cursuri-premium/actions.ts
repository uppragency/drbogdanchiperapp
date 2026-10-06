"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { localInputToIso } from "@/lib/format";
import { slugify } from "@/lib/courses";
import type { FormState } from "@/app/login/actions";

const money = z.string().trim().transform((v) => v.replace(/\s/g, "").replace(",", ".")).pipe(z.string().regex(/^\d{1,6}(\.\d{1,2})?$/)).transform(Number);
const optMoney = z.string().trim().transform((v) => v.replace(/\s/g, "").replace(",", ".")).pipe(z.union([z.literal(""), z.string().regex(/^\d{1,6}(\.\d{1,2})?$/)])).transform((v) => (v === "" ? null : Number(v)));
const text = (max: number) => z.string().trim().max(max).default("");
const url = z.string().trim().refine((v) => /^https?:\/\//i.test(v) && URL.canParse(v), "URL invalid");

const schema = z.object({
  title: z.string().trim().min(2).max(160),
  titleEn: text(160),
  slug: z.string().trim().max(80),
  shortDescription: text(600), shortDescriptionEn: text(600),
  longDescription: text(8000), longDescriptionEn: text(8000),
  benefits: text(4000), benefitsEn: text(4000),
  includes: text(4000), includesEn: text(4000),
  details: text(3000), detailsEn: text(3000),
  presenter: text(160), presenterBio: text(3000), presenterBioEn: text(3000),
  price: money,
  offerPrice: optMoney,
  memberDiscount: z.coerce.number().int().min(0).max(90),
  memberCode: text(60),
  shopUrl: url,
  buttonLabel: text(80), buttonLabelEn: text(80),
  coverUrl: z.string().trim().refine((v) => v === "" || (/^https?:\/\//i.test(v) && URL.canParse(v))),
  position: z.coerce.number().int().min(0).max(9999),
});

const g = (f: FormData, k: string) => String(f.get(k) ?? "");

export async function saveCourse(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const p = schema.safeParse({
    title: g(formData, "title"), titleEn: g(formData, "titleEn"), slug: g(formData, "slug"),
    shortDescription: g(formData, "shortDescription"), shortDescriptionEn: g(formData, "shortDescriptionEn"),
    longDescription: g(formData, "longDescription"), longDescriptionEn: g(formData, "longDescriptionEn"),
    benefits: g(formData, "benefits"), benefitsEn: g(formData, "benefitsEn"),
    includes: g(formData, "includes"), includesEn: g(formData, "includesEn"),
    details: g(formData, "details"), detailsEn: g(formData, "detailsEn"),
    presenter: g(formData, "presenter"), presenterBio: g(formData, "presenterBio"), presenterBioEn: g(formData, "presenterBioEn"),
    price: g(formData, "price"), offerPrice: g(formData, "offerPrice"),
    memberDiscount: g(formData, "memberDiscount") || "20", memberCode: g(formData, "memberCode"),
    shopUrl: g(formData, "shopUrl"), buttonLabel: g(formData, "buttonLabel"), buttonLabelEn: g(formData, "buttonLabelEn"),
    coverUrl: g(formData, "coverUrl"), position: g(formData, "position") || "100",
  });
  if (!p.success) {
    const f = p.error.issues[0]?.path[0];
    const msg: Record<string, string> = { title: "Titlul are minimum 2 caractere.", price: "Prețul e invalid (ex: 302,50).", offerPrice: "Prețul de ofertă e invalid.", shopUrl: "Linkul din magazin trebuie să înceapă cu https://.", coverUrl: "Linkul imaginii e invalid.", memberDiscount: "Reducerea este între 0 și 90." };
    return { error: msg[String(f)] ?? "Verifică datele introduse." };
  }
  const d = p.data;
  const offerUntil = localInputToIso(g(formData, "offerUntil"));
  if ((d.offerPrice == null) !== (offerUntil == null)) return { error: "Oferta are nevoie de preț și de dată de final, ambele sau niciuna." };
  if (d.offerPrice != null && d.offerPrice >= d.price) return { error: "Prețul de ofertă trebuie să fie mai mic decât prețul obișnuit." };
  const slug = slugify(d.slug || d.title);
  if (!slug) return { error: "Adresa (slug) e invalidă." };
  const publish = formData.get("isPublished") === "on";
  const supabase = await createClient();
  const id = z.string().uuid().safeParse(formData.get("id"));
  let existing: { is_published: boolean; published_at: string | null } | null = null;
  if (id.success) {
    const { data } = await supabase.from("premium_courses").select("is_published,published_at").eq("id", id.data).maybeSingle();
    existing = data;
  }
  const row = {
    slug, title: d.title, title_en: d.titleEn,
    short_description: d.shortDescription, short_description_en: d.shortDescriptionEn,
    long_description: d.longDescription, long_description_en: d.longDescriptionEn,
    benefits: d.benefits, benefits_en: d.benefitsEn, includes: d.includes, includes_en: d.includesEn,
    details: d.details, details_en: d.detailsEn,
    presenter: d.presenter, presenter_bio: d.presenterBio, presenter_bio_en: d.presenterBioEn,
    price: d.price, offer_price: d.offerPrice, offer_until: offerUntil,
    member_discount: d.memberDiscount, member_code: d.memberCode || "mentormeduser20",
    shop_url: d.shopUrl, button_label: d.buttonLabel || "Vezi cursul în magazin", button_label_en: d.buttonLabelEn,
    cover_url: d.coverUrl || null, position: d.position,
    announce: formData.get("announce") === "on",
    is_published: publish,
    published_at: publish ? existing?.published_at ?? new Date().toISOString() : existing?.published_at ?? null,
  };
  const { data, error } = id.success
    ? await supabase.from("premium_courses").update(row).eq("id", id.data).select("id").maybeSingle()
    : await supabase.from("premium_courses").insert(row).select("id").single();
  if (error || !data) return { error: error?.code === "23505" ? "Există deja un curs cu această adresă (slug)." : "Salvarea a eșuat." };
  revalidatePath("/cursuri", "layout");
  revalidatePath("/ce-e-nou");
  revalidatePath("/admin/cursuri-premium");
  if (!id.success) redirect(`/admin/cursuri-premium/${data.id}?creat=1`);
  return { ok: "Salvat." };
}

export async function setCourseCover(id: string, path: string | null): Promise<FormState> {
  await requireAdmin();
  const cid = z.string().uuid().safeParse(id);
  if (!cid.success || (path !== null && !/^courses\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(path))) return { error: "Cale invalidă." };
  const supabase = await createClient();
  const { error } = await supabase.from("premium_courses").update({ cover_path: path }).eq("id", cid.data);
  if (error) return { error: "Salvarea a eșuat." };
  revalidatePath("/cursuri", "layout");
  return { ok: "Imagine salvată." };
}

export async function deleteCourse(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("premium_courses").delete().eq("id", id);
  revalidatePath("/cursuri", "layout");
  redirect("/admin/cursuri-premium");
}
