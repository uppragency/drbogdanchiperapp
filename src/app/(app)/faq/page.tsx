import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FaqBrowser, type FaqEntry } from "./faq-browser";
import { getLocale, getTx, pick } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTx())("Întrebări frecvente", "Frequently asked questions") };
}

export default async function FaqPage() {
  await requireUser();
  const tx = await getTx();
  const locale = await getLocale();
  const supabase = await createClient();
  const { data } = await supabase.from("faq_items").select("id,question,question_en,answer,answer_en,category,is_featured,link_href,link_label,link_label_en").eq("is_published", true).order("position").order("created_at");
  const items: FaqEntry[] = (data ?? []).map((f) => ({
    id: f.id,
    category: f.category,
    featured: f.is_featured,
    question: pick(locale, f.question, f.question_en),
    answer: pick(locale, f.answer, f.answer_en),
    linkHref: f.link_href,
    linkLabel: f.link_href ? pick(locale, f.link_label, f.link_label_en) : null,
  }));
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{tx("Întrebări frecvente", "Frequently asked questions")}</h1>
      {items.length > 0 ? <FaqBrowser items={items} /> : <p className="rounded-card border border-line bg-surface p-6 text-sm text-muted">{tx("Întrebările frecvente vor fi adăugate în curând.", "Frequently asked questions will be added soon.")}</p>}
    </div>
  );
}
