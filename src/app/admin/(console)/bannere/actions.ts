"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { localInputToIso } from "@/lib/format";

const schema = z.object({
  message: z.string().trim().min(1).max(240),
  linkUrl: z.string().trim().refine((v) => v === "" || (/^https:\/\//i.test(v) && URL.canParse(v)), "link"),
  linkLabel: z.string().trim().max(40),
  messageEn: z.string().trim().max(240).default(""),
  linkLabelEn: z.string().trim().max(40).default(""),
});

export async function createBanner(formData: FormData) {
  await requireAdmin();
  const p = schema.safeParse({ message: formData.get("message"), linkUrl: formData.get("linkUrl") ?? "", linkLabel: formData.get("linkLabel") ?? "", messageEn: formData.get("messageEn") ?? "", linkLabelEn: formData.get("linkLabelEn") ?? "" });
  if (!p.success) redirect("/admin/bannere?err=1");
  const supabase = await createClient();
  await supabase.from("site_banners").insert({
    message: p.data.message,
    message_en: p.data.messageEn,
    link_label_en: p.data.linkUrl ? p.data.linkLabelEn : "",
    link_url: p.data.linkUrl || null,
    link_label: p.data.linkUrl ? p.data.linkLabel || "Vezi detalii" : "",
    starts_at: localInputToIso(String(formData.get("startsAt") ?? "")),
    ends_at: localInputToIso(String(formData.get("endsAt") ?? "")),
  });
  revalidatePath("/", "layout");
  redirect("/admin/bannere");
}

export async function toggleBanner(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const active = formData.get("active") === "1";
  const supabase = await createClient();
  await supabase.from("site_banners").update({ is_active: active }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function deleteBanner(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("site_banners").delete().eq("id", id);
  revalidatePath("/", "layout");
}
