import type { Metadata } from "next";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getLocale, getTx, pick } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTx())("Întrebări frecvente", "Frequently asked questions") };
}

export default async function FaqPage() {
  await requireUser();
  const tx = await getTx();
  const locale = await getLocale();
  const supabase = await createClient();
  const { data } = await supabase.from("faq_items").select("id,question,question_en,answer,answer_en").eq("is_published", true).order("position").order("created_at");
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{tx("Întrebări frecvente", "Frequently asked questions")}</h1>
      <div className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface">
        {(data ?? []).map((f) => (
          <details key={f.id} className="group p-5">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-bold">
              {pick(locale, f.question, f.question_en)}
              <CaretDown size={18} className="shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 max-w-[65ch] whitespace-pre-line leading-relaxed text-muted">{pick(locale, f.answer, f.answer_en)}</p>
          </details>
        ))}
        {(data ?? []).length === 0 && <p className="p-6 text-sm text-muted">{tx("Întrebările frecvente vor fi adăugate în curând.", "Frequently asked questions will be added soon.")}</p>}
      </div>
    </div>
  );
}
