import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, Field, PageTitle, TextArea, btn } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { deleteFaq, saveFaq } from "./actions";

export const metadata: Metadata = { title: "FAQ" };

export default async function FaqAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.from("faq_items").select("*").order("position").order("created_at");
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Întrebări frecvente" />
      <Card>
        <form action={saveFaq} className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">Întrebare nouă</h2>
          <Field label="Întrebare" name="question" required />
          <TextArea label="Răspuns" name="answer" rows={4} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Poziție" name="position" type="number" defaultValue={(data?.length ?? 0) + 1} />
            <label className="flex min-h-11 items-center gap-3 self-end text-sm font-semibold"><input type="checkbox" name="published" defaultChecked className="size-5 accent-[var(--accent)]" /> Vizibilă membrilor</label>
          </div>
          <div><SubmitButton>Adaugă</SubmitButton></div>
        </form>
      </Card>
      {(data ?? []).map((f) => (
        <Card key={f.id}>
          <form action={saveFaq} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={f.id} />
            <Field label="Întrebare" name={`question`} defaultValue={f.question} required />
            <TextArea label="Răspuns" name="answer" defaultValue={f.answer} rows={4} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Poziție" name="position" type="number" defaultValue={f.position} />
              <label className="flex min-h-11 items-center gap-3 self-end text-sm font-semibold"><input type="checkbox" name="published" defaultChecked={f.is_published} className="size-5 accent-[var(--accent)]" /> Vizibilă membrilor</label>
            </div>
            <div className="flex gap-2"><SubmitButton variant="secondary">Salvează</SubmitButton></div>
          </form>
          <form action={deleteFaq} className="mt-3"><input type="hidden" name="id" value={f.id} /><button className={btn.danger}>Șterge</button></form>
        </Card>
      ))}
    </div>
  );
}
