"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/app/login/actions";

const schema = z.object({
  question: z.string().trim().min(1, "Întrebarea este obligatorie").max(200),
  questionEn: z.string().trim().max(200).default(""),
});

export async function createPoll(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const p = schema.safeParse({ question: formData.get("question"), questionEn: formData.get("questionEn") ?? "" });
  if (!p.success) return { error: p.error.issues[0]?.message ?? "Date invalide." };
  const options: { label: string; label_en: string }[] = [];
  for (let i = 1; i <= 5; i++) {
    const label = String(formData.get(`label${i}`) ?? "").trim().slice(0, 120);
    const labelEn = String(formData.get(`labelEn${i}`) ?? "").trim().slice(0, 120);
    if (label) options.push({ label, label_en: labelEn });
  }
  if (options.length < 2) return { error: "Adaugă cel puțin 2 variante de răspuns." };

  const supabase = await createClient();
  const { data: poll, error } = await supabase.from("polls").insert({ question: p.data.question, question_en: p.data.questionEn, is_active: false }).select("id").single();
  if (error || !poll) return { error: "Nu am putut crea sondajul." };
  const { error: optErr } = await supabase.from("poll_options").insert(options.map((o, i) => ({ poll_id: poll.id, label: o.label, label_en: o.label_en, position: i + 1 })));
  if (optErr) {
    await supabase.from("polls").delete().eq("id", poll.id);
    return { error: "Nu am putut salva variantele." };
  }
  revalidatePath("/admin/sondaje");
  return { ok: "Sondajul a fost creat. Activează-l când vrei să apară." };
}

// Only one poll can be active: every other one is switched off first.
export async function activatePoll(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("polls").update({ is_active: false }).neq("id", id).eq("is_active", true);
  await supabase.from("polls").update({ is_active: true }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function stopPoll(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("polls").update({ is_active: false }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function deletePoll(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("polls").delete().eq("id", id);
  revalidatePath("/", "layout");
}
