"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  question: z.string().trim().min(1).max(300),
  answer: z.string().trim().min(1).max(5000),
  questionEn: z.string().trim().max(300).default(""),
  answerEn: z.string().trim().max(5000).default(""),
  position: z.coerce.number().int().min(1).max(999),
});

export async function saveFaq(formData: FormData) {
  await requireAdmin();
  const p = schema.safeParse({ question: formData.get("question"), answer: formData.get("answer"), questionEn: formData.get("questionEn") ?? "", answerEn: formData.get("answerEn") ?? "", position: formData.get("position") || 999 });
  if (!p.success) return;
  const supabase = await createClient();
  const row = { question: p.data.question, answer: p.data.answer, question_en: p.data.questionEn, answer_en: p.data.answerEn, position: p.data.position, is_published: formData.get("published") === "on" };
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (id.success) await supabase.from("faq_items").update(row).eq("id", id.data);
  else await supabase.from("faq_items").insert(row);
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
}

export async function deleteFaq(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("faq_items").delete().eq("id", id);
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
}
